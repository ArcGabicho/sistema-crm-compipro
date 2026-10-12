namespace Server.Config;

public enum Acceso
{
    Ninguno = 0,
    Leer = 1,
    Escribir = 2,
    Eliminar = 3,
}

public static class Roles
{
    public const string Admin = "admin";
    public const string Ventas = "ventas";
    public const string Operaciones = "operaciones";
    public const string Gerencia = "gerencia";

    public static readonly string[] Todos = [Admin, Ventas, Operaciones, Gerencia];

    public static bool EsValido(string? role) =>
        role is not null && Todos.Contains(role, StringComparer.OrdinalIgnoreCase);

    public static bool Es(string? role, string esperado) =>
        string.Equals(role, esperado, StringComparison.OrdinalIgnoreCase);
}

public static class Modulos
{
    public const string Estadisticas = "estadisticas";
    public const string Solicitudes = "solicitudes";
    public const string Clientes = "clientes";
    public const string TiposCliente = "tipos-cliente";
    public const string Cotizaciones = "cotizaciones";
    public const string Pedidos = "pedidos";
    public const string Tickets = "tickets";
    public const string Inventario = "inventario";
    public const string Logistica = "logistica";
    public const string Proveedores = "proveedores";
    public const string Documentos = "documentos";
    public const string Email = "email";
    public const string Eventos = "eventos";
    public const string Ventas = "ventas";
    public const string Usuarios = "usuarios";
    public const string Configuracion = "configuracion";
    public const string Auditoria = "auditoria";
    public const string Asistencia = "asistencia";
    public const string Cuenta = "cuenta";

    public static readonly string[] Todos =
    [
        Estadisticas, Solicitudes, Clientes, TiposCliente, Cotizaciones, Pedidos, Tickets,
        Inventario, Logistica, Proveedores, Documentos, Email, Eventos, Ventas, Usuarios,
        Configuracion, Auditoria, Asistencia, Cuenta,
    ];
}

/// <summary>
/// Matriz de permisos por rol. Admin puede todo; eliminar es exclusivo de admin.
/// Debe mantenerse sincronizada con <c>core/client/app/lib/permisos.ts</c>.
/// </summary>
public static class Permisos
{
    private const Acceso L = Acceso.Leer;
    private const Acceso E = Acceso.Escribir;

    private static readonly Dictionary<string, Acceso> Ventas = new()
    {
        [Modulos.Estadisticas] = L,
        [Modulos.Solicitudes] = E,
        [Modulos.Clientes] = E,
        [Modulos.TiposCliente] = L,
        [Modulos.Cotizaciones] = E,
        [Modulos.Pedidos] = L,
        [Modulos.Tickets] = E,
        [Modulos.Inventario] = L,
        [Modulos.Documentos] = E,
        [Modulos.Email] = E,
        [Modulos.Eventos] = E,
        [Modulos.Ventas] = E,
        [Modulos.Asistencia] = E,
        [Modulos.Cuenta] = E,
    };

    private static readonly Dictionary<string, Acceso> Operaciones = new()
    {
        [Modulos.Estadisticas] = L,
        [Modulos.Clientes] = L,
        [Modulos.TiposCliente] = L,
        [Modulos.Cotizaciones] = L,
        [Modulos.Pedidos] = E,
        [Modulos.Tickets] = E,
        [Modulos.Inventario] = E,
        [Modulos.Logistica] = E,
        [Modulos.Proveedores] = E,
        [Modulos.Documentos] = E,
        [Modulos.Ventas] = L,
        [Modulos.Asistencia] = E,
        [Modulos.Cuenta] = E,
    };

    // Gerencia ve todo; solo escribe en lo personal (su asistencia y su cuenta).
    private static readonly Dictionary<string, Acceso> Gerencia =
        Modulos.Todos.ToDictionary(
            m => m,
            m => m is Modulos.Asistencia or Modulos.Cuenta ? E : L);

    // Rol desconocido o sin asignar (p. ej. el antiguo "user"): lo mínimo hasta que admin le asigne uno.
    private static readonly Dictionary<string, Acceso> SinRol = new()
    {
        [Modulos.Estadisticas] = L,
        [Modulos.Asistencia] = E,
        [Modulos.Cuenta] = E,
    };

    private static readonly Dictionary<string, Dictionary<string, Acceso>> Matriz =
        new(StringComparer.OrdinalIgnoreCase)
        {
            [Roles.Ventas] = Ventas,
            [Roles.Operaciones] = Operaciones,
            [Roles.Gerencia] = Gerencia,
        };

    public static bool Puede(string? role, string modulo, Acceso acceso)
    {
        if (Roles.Es(role, Roles.Admin)) return true;
        if (acceso == Acceso.Eliminar) return false;

        var permisos = role is not null && Matriz.TryGetValue(role, out var p) ? p : SinRol;
        return permisos.TryGetValue(modulo, out var nivel) && nivel >= acceso;
    }
}

/// <summary>Módulo al que pertenece un controlador o acción, para aplicar <see cref="Permisos"/>.</summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, Inherited = true)]
public sealed class ModuloAttribute(string nombre) : Attribute
{
    public string Nombre { get; } = nombre;
}

/// <summary>Fija el nivel de acceso de una acción cuando el verbo HTTP no lo refleja.</summary>
[AttributeUsage(AttributeTargets.Method)]
public sealed class AccesoAttribute(Acceso nivel) : Attribute
{
    public Acceso Nivel { get; } = nivel;
}
