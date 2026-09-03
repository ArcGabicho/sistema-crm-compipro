// Infraestructura del Sistema CRM Compina en Azure.
//   - Azure SQL Database  (SistemaCrmCompipro)
//   - Container Apps Environment + Log Analytics
//   - 2 Container Apps: server (ingress interno) y client (ingress externo)
// Las imágenes deben existir ya en el ACR (scripts/deploy.sh las compila con `az acr build`).

targetScope = 'resourceGroup'

@description('Prefijo para los nombres de recursos.')
param namePrefix string = 'crmcompina'

@description('Región. Por defecto la del grupo de recursos.')
param location string = resourceGroup().location

@description('Nombre del Azure Container Registry ya existente.')
param acrName string

@description('Tag de las imágenes en el ACR.')
param imageTag string

@description('Login del administrador del Azure SQL Server.')
param sqlAdminLogin string

@secure()
@description('Contraseña del administrador del Azure SQL Server.')
param sqlAdminPassword string

@secure()
@description('Secreto de firma del JWT (mismo valor para backend y cliente).')
param jwtKey string

param seedAdminEmail string = 'admin@compipro.net'
param seedAdminName string = 'Administrador'

@secure()
param seedAdminPassword string

var tags = {
  project: 'sistema-crm-compina'
  managedBy: 'bicep'
}

var suffix = uniqueString(resourceGroup().id, namePrefix)
var lawName = 'log-${namePrefix}-${suffix}'
var envName = 'cae-${namePrefix}-${suffix}'
var sqlServerName = 'sql-${namePrefix}-${suffix}'
var sqlDbName = 'SistemaCrmCompipro'
var serverAppName = 'ca-${namePrefix}-server'
var clientAppName = 'ca-${namePrefix}-client'

// ---------------------------------------------------------------------------
// Observabilidad
// ---------------------------------------------------------------------------
resource law 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: lawName
  location: location
  tags: tags
  properties: {
    sku: { name: 'PerGB2018' }
    retentionInDays: 30
  }
}

// ---------------------------------------------------------------------------
// Container Apps Environment
// ---------------------------------------------------------------------------
resource containerEnv 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: envName
  location: location
  tags: tags
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: law.properties.customerId
        sharedKey: law.listKeys().primarySharedKey
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Base de datos
// ---------------------------------------------------------------------------
resource sqlServer 'Microsoft.Sql/servers@2023-08-01-preview' = {
  name: sqlServerName
  location: location
  tags: tags
  properties: {
    administratorLogin: sqlAdminLogin
    administratorLoginPassword: sqlAdminPassword
    version: '12.0'
    minimalTlsVersion: '1.2'
    publicNetworkAccess: 'Enabled'
  }
}

resource sqlDb 'Microsoft.Sql/servers/databases@2023-08-01-preview' = {
  parent: sqlServer
  name: sqlDbName
  location: location
  tags: tags
  sku: {
    name: 'Basic'
    tier: 'Basic'
  }
  properties: {
    collation: 'SQL_Latin1_General_CP1_CI_AS'
  }
}

// Permite que otros servicios de Azure (los Container Apps) se conecten.
resource sqlFirewallAzure 'Microsoft.Sql/servers/firewallRules@2023-08-01-preview' = {
  parent: sqlServer
  name: 'AllowAllAzureIps'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// ---------------------------------------------------------------------------
// ACR (existente) y credenciales
// ---------------------------------------------------------------------------
resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' existing = {
  name: acrName
}

var acrCreds = acr.listCredentials()
var acrLoginServer = acr.properties.loginServer

// FQDNs deterministas (no crean ciclo entre las dos apps)
var envDomain = containerEnv.properties.defaultDomain
var backendUrl = 'https://${serverAppName}.internal.${envDomain}'
var clientUrl = 'https://${clientAppName}.${envDomain}'

var sqlConnectionString = 'Server=tcp:${sqlServer.properties.fullyQualifiedDomainName},1433;Database=${sqlDbName};User ID=${sqlAdminLogin};Password=${sqlAdminPassword};Encrypt=True;TrustServerCertificate=False;Connection Timeout=60;'

// ---------------------------------------------------------------------------
// Backend (.NET) — ingress interno
// ---------------------------------------------------------------------------
resource serverApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: serverAppName
  location: location
  tags: tags
  properties: {
    managedEnvironmentId: containerEnv.id
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: false
        targetPort: 8080
        transport: 'auto'
      }
      registries: [
        {
          server: acrLoginServer
          username: acrCreds.username
          passwordSecretRef: 'acr-password'
        }
      ]
      secrets: [
        { name: 'acr-password', value: acrCreds.passwords[0].value }
        { name: 'sql-connection', value: sqlConnectionString }
        { name: 'jwt-key', value: jwtKey }
        { name: 'seed-admin-password', value: seedAdminPassword }
      ]
    }
    template: {
      containers: [
        {
          name: 'server'
          image: '${acrLoginServer}/sistema-crm-compina-server:${imageTag}'
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          env: [
            { name: 'ASPNETCORE_ENVIRONMENT', value: 'Production' }
            { name: 'ASPNETCORE_URLS', value: 'http://+:8080' }
            { name: 'ConnectionStrings__Default', secretRef: 'sql-connection' }
            { name: 'Jwt__Key', secretRef: 'jwt-key' }
            { name: 'Cors__AllowedOrigins__0', value: clientUrl }
            { name: 'Seed__Admin__Email', value: seedAdminEmail }
            { name: 'Seed__Admin__Name', value: seedAdminName }
            { name: 'Seed__Admin__Password', secretRef: 'seed-admin-password' }
          ]
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 3
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Frontend (Next.js BFF) — ingress externo
// ---------------------------------------------------------------------------
resource clientApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: clientAppName
  location: location
  tags: tags
  properties: {
    managedEnvironmentId: containerEnv.id
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: true
        targetPort: 3000
        transport: 'auto'
        allowInsecure: false
      }
      registries: [
        {
          server: acrLoginServer
          username: acrCreds.username
          passwordSecretRef: 'acr-password'
        }
      ]
      secrets: [
        { name: 'acr-password', value: acrCreds.passwords[0].value }
        { name: 'auth-jwt-secret', value: jwtKey }
      ]
    }
    template: {
      containers: [
        {
          name: 'client'
          image: '${acrLoginServer}/sistema-crm-compina-client:${imageTag}'
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          env: [
            { name: 'NODE_ENV', value: 'production' }
            { name: 'BACKEND_URL', value: backendUrl }
            { name: 'AUTH_JWT_SECRET', secretRef: 'auth-jwt-secret' }
          ]
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 3
      }
    }
  }
  dependsOn: [
    serverApp
  ]
}

// ---------------------------------------------------------------------------
// Salidas
// ---------------------------------------------------------------------------
output clientUrl string = 'https://${clientApp.properties.configuration.ingress.fqdn}'
output backendInternalUrl string = backendUrl
output sqlServerFqdn string = sqlServer.properties.fullyQualifiedDomainName
output acrLoginServer string = acrLoginServer
