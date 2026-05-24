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
            .Where(c => c.IsPublic)
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
                    .Select(t => new TopicDto(t.Id, t.Name, t.ContestId, t.OrderIndex)).ToList(),
                c.IsPublic
            ))
            .ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ContestPublicDto>> GetById(int id)
    {
        var result = await db.Contests
            .AsNoTracking()
            .Where(c => c.Id == id && c.IsPublic)
            .Select(c => new
            {
                c.Id, c.Name, c.Description,
                c.UploadEndDate, c.RatingEndDate, c.CreatedAt,
                c.IsCompleted, c.IsUploadClosed, c.IsPublic,
                OwnerDisplayName = c.Owner != null ? c.Owner.DisplayName : null,
                PhotographerCount = c.Photographers.Count,
                JudgeCount = c.Judges.Count,
                Topics = c.Topics.OrderBy(t => t.OrderIndex)
                    .Select(t => new TopicDto(t.Id, t.Name, t.ContestId, t.OrderIndex)).ToList()
            })
            .FirstOrDefaultAsync();

        if (result is null) return NotFound();

        return new ContestPublicDto(
            result.Id, result.Name, result.Description,
            result.UploadEndDate, result.RatingEndDate, result.CreatedAt,
            result.IsCompleted, result.IsUploadClosed,
            result.OwnerDisplayName,
            result.PhotographerCount, result.JudgeCount,
            result.Topics,
            result.IsPublic
        );
    }
}
