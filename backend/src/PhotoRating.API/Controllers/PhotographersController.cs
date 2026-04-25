using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PhotoRating.API.Data;
using PhotoRating.API.Filters;
using PhotoRating.API.Models;

namespace PhotoRating.API.Controllers;

[ApiController]
[ServiceFilter(typeof(AdminAuthFilter))]
public class PhotographersController(AppDbContext db) : ControllerBase
{
    [HttpGet("api/contests/{contestId}/photographers")]
    public async Task<ActionResult<List<PhotographerWithPhotosDto>>> GetByContest(int contestId)
    {
        if (!await db.Contests.AnyAsync(c => c.Id == contestId)) return NotFound();
        return await db.Photographers
            .Where(p => p.ContestId == contestId)
            .Include(p => p.Photos)
            .Select(p => new PhotographerWithPhotosDto(
                p.Id, p.Name, p.Bio, p.ContestId, p.Token,
                p.Photos.Select(ph => new PhotoDto(ph.Id, ph.Title, ph.ImageUrl, ph.PhotographerId, ph.TopicId)).ToList()))
            .ToListAsync();
    }

    [HttpPost("api/contests/{contestId}/photographers")]
    public async Task<ActionResult<PhotographerDto>> Create(int contestId, CreatePhotographerDto dto)
    {
        if (!await db.Contests.AnyAsync(c => c.Id == contestId)) return NotFound();
        var p = new Photographer { Name = dto.Name, Bio = dto.Bio, ContestId = contestId };
        db.Photographers.Add(p);
        await db.SaveChangesAsync();
        return new PhotographerDto(p.Id, p.Name, p.Bio, p.ContestId, p.Token);
    }

    [HttpPut("api/photographers/{id}")]
    public async Task<ActionResult<PhotographerDto>> Update(int id, UpdatePhotographerDto dto)
    {
        var p = await db.Photographers.FindAsync(id);
        if (p is null) return NotFound();
        p.Name = dto.Name;
        p.Bio = dto.Bio;
        await db.SaveChangesAsync();
        return new PhotographerDto(p.Id, p.Name, p.Bio, p.ContestId, p.Token);
    }

    [HttpDelete("api/photographers/{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var p = await db.Photographers.FindAsync(id);
        if (p is null) return NotFound();
        db.Photographers.Remove(p);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
