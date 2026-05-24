using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PhotoRating.API.Data;
using PhotoRating.API.Models;

namespace PhotoRating.API.Controllers;

[ApiController]
[Route("api/admin/users")]
public class AdminUsersController(AppDbContext db, IConfiguration config) : ControllerBase
{
    private bool IsAdmin() =>
        !string.IsNullOrEmpty(config["AdminKey"]) &&
        Request.Headers["X-Admin-Key"].FirstOrDefault() == config["AdminKey"];

    [HttpGet]
    public async Task<ActionResult<List<UserSummaryDto>>> Search([FromQuery] string? search)
    {
        if (!IsAdmin()) return Forbid();
        var query = db.Users.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(u => u.Username.Contains(term) || u.DisplayName.ToLower().Contains(term));
        }
        return await query
            .OrderBy(u => u.DisplayName)
            .Take(20)
            .Select(u => new UserSummaryDto(u.Id, u.Username, u.DisplayName))
            .ToListAsync();
    }
}
