using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PhotoRating.API.Data;
using PhotoRating.API.Models;

namespace PhotoRating.API.Controllers;

[ApiController]
[Route("api/browse/contests")]
public class ContestBrowseController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<List<ContestPublicDto>> GetAll()
    {
        return await db.Contests
            .AsNoTracking()
            .Include(c => c.Owner)
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new ContestPublicDto(
                c.Id, c.Name, c.Description,
                c.UploadEndDate, c.RatingEndDate, c.CreatedAt,
                c.IsCompleted, c.IsUploadClosed,
                c.Owner != null ? c.Owner.DisplayName : null,
                c.Photographers.Count,
                c.Judges.Count,
                c.Topics.OrderBy(t => t.OrderIndex)
                    .Select(t => new TopicDto(t.Id, t.Name, t.ContestId, t.OrderIndex)).ToList()
            ))
            .ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ContestPublicDto>> GetById(int id)
    {
        var c = await db.Contests
            .AsNoTracking()
            .Include(c => c.Owner)
            .Include(c => c.Topics)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (c is null) return NotFound();

        var photographerCount = await db.Photographers.CountAsync(p => p.ContestId == id);
        var judgeCount = await db.Judges.CountAsync(j => j.ContestId == id);

        return new ContestPublicDto(
            c.Id, c.Name, c.Description,
            c.UploadEndDate, c.RatingEndDate, c.CreatedAt,
            c.IsCompleted, c.IsUploadClosed,
            c.Owner?.DisplayName,
            photographerCount, judgeCount,
            c.Topics.OrderBy(t => t.OrderIndex)
                .Select(t => new TopicDto(t.Id, t.Name, t.ContestId, t.OrderIndex)).ToList()
        );
    }
}
