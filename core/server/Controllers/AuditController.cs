using Server.Config;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Domain;
using Server.Models;
using Server.Services;

namespace Server.Controllers;

[ApiController]
[Authorize]
[Modulo(Modulos.Auditoria)]
[Route("api/audit")]
public sealed class AuditController(IAuditService audit) : ControllerBase
{
    [HttpGet]
    public Task<PagedResult<AuditLog>> List(
        int page = 1, int pageSize = 30, string? search = null, CancellationToken ct = default)
        => audit.ListAsync(page, pageSize, search, ct);
}
