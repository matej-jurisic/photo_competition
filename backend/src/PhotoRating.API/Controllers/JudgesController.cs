using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PhotoRating.API.Data;
using PhotoRating.API.Filters;
using PhotoRating.API.Models;

namespace PhotoRating.API.Controllers;

[ApiController]
[ServiceFilter(typeof(AdminAuthFilter))]
public class JudgesController(AppDbContext db, IConfiguration config) : ControllerBase
{
    [HttpGet("api/contests/{contestId}/judges")]
    public async Task<ActionResult<List<JudgeDto>>> GetByContest(int contestId)
    {
        if (!await db.Contests.AnyAsync(c => c.Id == contestId)) return NotFound();
        return await db.Judges
            .Where(j => j.ContestId == contestId)
            .Select(j => new JudgeDto(j.Id, j.Name, j.Email, j.Token, j.ContestId, j.CreatedAt))
            .ToListAsync();
    }

    [HttpPost("api/contests/{contestId}/judges")]
    public async Task<ActionResult<JudgeDto>> Create(int contestId, CreateJudgeDto dto)
    {
        if (!await db.Contests.AnyAsync(c => c.Id == contestId)) return NotFound();
        var judge = new Judge { Name = dto.Name, Email = dto.Email, ContestId = contestId };
        db.Judges.Add(judge);
        await db.SaveChangesAsync();
        return new JudgeDto(judge.Id, judge.Name, judge.Email, judge.Token, judge.ContestId, judge.CreatedAt);
    }

    [HttpPut("api/judges/{id}")]
    public async Task<ActionResult<JudgeDto>> Update(int id, UpdateJudgeDto dto)
    {
        var judge = await db.Judges.FindAsync(id);
        if (judge is null) return NotFound();
        judge.Name = dto.Name;
        judge.Email = dto.Email;
        await db.SaveChangesAsync();
        return new JudgeDto(judge.Id, judge.Name, judge.Email, judge.Token, judge.ContestId, judge.CreatedAt);
    }

    [HttpDelete("api/judges/{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var judge = await db.Judges.FindAsync(id);
        if (judge is null) return NotFound();
        db.Judges.Remove(judge);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("api/judges/{id}/link")]
    public async Task<ActionResult<object>> GetJudgeLink(int id)
    {
        var judge = await db.Judges.FindAsync(id);
        if (judge is null) return NotFound();
        var baseUrl = config["FrontendUrl"] ?? "http://localhost:3000";
        return new { link = $"{baseUrl}/judge/{judge.Token}" };
    }
}
