using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PhotoRating.API.Data;
using PhotoRating.API.Models;

namespace PhotoRating.API.Controllers;

[ApiController]
public class TopicsController(AppDbContext db, IConfiguration config) : ControllerBase
{
    private bool IsAdmin() =>
        !string.IsNullOrEmpty(config["AdminKey"]) &&
        Request.Headers["X-Admin-Key"].FirstOrDefault() == config["AdminKey"];

    [HttpGet("api/contests/{contestId}/topics")]
    public async Task<ActionResult<List<TopicDto>>> GetByContest(int contestId)
    {
        if (!IsAdmin()) return Forbid();
        if (!await db.Contests.AnyAsync(c => c.Id == contestId)) return NotFound();
        return await db.Topics
            .Where(t => t.ContestId == contestId)
            .OrderBy(t => t.OrderIndex)
            .Select(t => new TopicDto(t.Id, t.Name, t.ContestId, t.OrderIndex))
            .ToListAsync();
    }

    [HttpPost("api/contests/{contestId}/topics")]
    public async Task<ActionResult<TopicDto>> Create(int contestId, CreateTopicDto dto)
    {
        if (!IsAdmin()) return Forbid();
        if (!await db.Contests.AnyAsync(c => c.Id == contestId)) return NotFound();
        var t = new Topic { Name = dto.Name, OrderIndex = dto.OrderIndex, ContestId = contestId };
        db.Topics.Add(t);
        await db.SaveChangesAsync();
        return new TopicDto(t.Id, t.Name, t.ContestId, t.OrderIndex);
    }

    [HttpPut("api/topics/{id}")]
    public async Task<ActionResult<TopicDto>> Update(int id, UpdateTopicDto dto)
    {
        if (!IsAdmin()) return Forbid();
        var t = await db.Topics.FindAsync(id);
        if (t is null) return NotFound();
        t.Name = dto.Name;
        t.OrderIndex = dto.OrderIndex;
        await db.SaveChangesAsync();
        return new TopicDto(t.Id, t.Name, t.ContestId, t.OrderIndex);
    }

    [HttpDelete("api/topics/{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        if (!IsAdmin()) return Forbid();
        var t = await db.Topics.FindAsync(id);
        if (t is null) return NotFound();
        db.Topics.Remove(t);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
