using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace Server.Config;

/// <summary>
/// Aplica la matriz de <see cref="Permisos"/> a cada acción autenticada según su
/// <see cref="ModuloAttribute"/> y el verbo HTTP (GET = leer, DELETE = eliminar,
/// el resto = escribir). Un endpoint autenticado sin módulo queda solo para admin.
/// </summary>
public sealed class PermisosFilter : IAuthorizationFilter
{
    public void OnAuthorization(AuthorizationFilterContext context)
    {
        var metadata = context.ActionDescriptor.EndpointMetadata;
        if (metadata.OfType<IAllowAnonymous>().Any()) return;

        var user = context.HttpContext.User;
        if (user.Identity?.IsAuthenticated != true) return; // el 401 lo resuelve [Authorize]

        // El último atributo es el más específico (acción sobre controlador).
        var modulo = metadata.OfType<ModuloAttribute>().LastOrDefault()?.Nombre;
        var acceso = metadata.OfType<AccesoAttribute>().LastOrDefault()?.Nivel
            ?? AccesoPorVerbo(context.HttpContext.Request.Method);
        string? role = user.FindFirstValue("role");

        bool permitido = modulo is null
            ? Roles.Es(role, Roles.Admin)
            : Permisos.Puede(role, modulo, acceso);

        if (!permitido)
        {
            context.Result = new ObjectResult(new { message = "No tienes permiso para realizar esta acción." })
            {
                StatusCode = StatusCodes.Status403Forbidden,
            };
        }
    }

    private static Acceso AccesoPorVerbo(string method) =>
        HttpMethods.IsGet(method) || HttpMethods.IsHead(method) || HttpMethods.IsOptions(method)
            ? Acceso.Leer
            : HttpMethods.IsDelete(method) ? Acceso.Eliminar : Acceso.Escribir;
}
