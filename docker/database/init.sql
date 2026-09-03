-- Inicialización de SQL Server para el Sistema CRM Compina.
-- Se ejecuta una vez (ver init.sh) conectado como 'sa'.
-- init.sh sustituye __CRM_APP_PASSWORD__ por la contraseña real antes de ejecutar.

-------------------------------------------------------------------------------
-- 1. Base de datos de la aplicación
-------------------------------------------------------------------------------
IF DB_ID(N'SistemaCrmCompipro') IS NULL
BEGIN
    CREATE DATABASE [SistemaCrmCompipro];
END;
GO

-------------------------------------------------------------------------------
-- 2. Login de servidor para el backend
-------------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = N'crm_app')
BEGIN
    CREATE LOGIN [crm_app]
        WITH PASSWORD = N'__CRM_APP_PASSWORD__',
             CHECK_POLICY = OFF,
             DEFAULT_DATABASE = [SistemaCrmCompipro];
END;
GO

-------------------------------------------------------------------------------
-- 3. Usuario de base de datos + roles
--    db_ddladmin  -> EF Core crea/actualiza el esquema (tabla Users)
--    db_datawriter/db_datareader -> INSERT/SELECT de la aplicación
-------------------------------------------------------------------------------
USE [SistemaCrmCompipro];
GO

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'crm_app')
BEGIN
    CREATE USER [crm_app] FOR LOGIN [crm_app];
END;
GO

ALTER ROLE [db_ddladmin]   ADD MEMBER [crm_app];
ALTER ROLE [db_datawriter] ADD MEMBER [crm_app];
ALTER ROLE [db_datareader] ADD MEMBER [crm_app];
GO

PRINT 'Base de datos SistemaCrmCompipro y usuario crm_app listos.';
GO