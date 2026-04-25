using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PhotoRating.API.Data;
using PhotoRating.API.Filters;
using PhotoRating.API.Models;

namespace PhotoRating.API.Controllers;

[ApiController]
[Route("api/contests")]
[ServiceFilter(typeof(AdminAuthFilter))]
public class ContestsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<List<ContestDto>> GetAll() =>
        await db.Contests
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new ContestDto(c.Id, c.Name, c.Description, c.UploadEndDate, c.RatingEndDate, c.CreatedAt, c.Reward))
            .ToListAsync();

    [HttpGet("{id}")]
    public async Task<ActionResult<ContestDetailDto>> GetById(int id)
    {
        var contest = await db.Contests
            .Include(c => c.Photographers).ThenInclude(p => p.Photos)
            .Include(c => c.Topics)
            .Include(c => c.Judges)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (contest is null) return NotFound();
        return ToDetail(contest);
    }

    [HttpPost]
    public async Task<ActionResult<ContestDto>> Create(CreateContestDto dto)
    {
        var contest = new Contest { Name = dto.Name, Description = dto.Description, UploadEndDate = dto.UploadEndDate, RatingEndDate = dto.RatingEndDate, Reward = dto.Reward };
        db.Contests.Add(contest);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = contest.Id },
            new ContestDto(contest.Id, contest.Name, contest.Description, contest.UploadEndDate, contest.RatingEndDate, contest.CreatedAt, contest.Reward));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ContestDto>> Update(int id, UpdateContestDto dto)
    {
        var contest = await db.Contests.FindAsync(id);
        if (contest is null) return NotFound();

        contest.Name = dto.Name;
        contest.Description = dto.Description;
        contest.UploadEndDate = dto.UploadEndDate;
        contest.RatingEndDate = dto.RatingEndDate;
        contest.Reward = dto.Reward;
        await db.SaveChangesAsync();
        return new ContestDto(contest.Id, contest.Name, contest.Description, contest.UploadEndDate, contest.RatingEndDate, contest.CreatedAt, contest.Reward);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var contest = await db.Contests.FindAsync(id);
        if (contest is null) return NotFound();
        db.Contests.Remove(contest);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private static ContestDetailDto ToDetail(Contest c) => new(
        c.Id, c.Name, c.Description, c.UploadEndDate, c.RatingEndDate, c.CreatedAt, c.Reward,
        c.Photographers.Select(p => new PhotographerWithPhotosDto(
            p.Id, p.Name, p.Bio, p.ContestId, p.Token,
            p.Photos.Select(ph => new PhotoDto(ph.Id, ph.Title, ph.ImageUrl, ph.PhotographerId, ph.TopicId)).ToList()
        )).ToList(),
        c.Topics.OrderBy(t => t.OrderIndex).Select(t => new TopicDto(t.Id, t.Name, t.ContestId, t.OrderIndex)).ToList(),
        c.Judges.Select(j => new JudgeDto(j.Id, j.Name, j.Email, j.Token, j.ContestId, j.CreatedAt)).ToList()
    );
}
