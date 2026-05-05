using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PhotoRating.API.Data;
using PhotoRating.API.Models;

namespace PhotoRating.API.Controllers;

[ApiController]
[Route("api/photographer-sessions/{token:guid}")]
public class PhotographerSessionController(AppDbContext db, IConfiguration config, IWebHostEnvironment env) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PhotographerSessionDto>> GetSession(Guid token)
    {
        var p = await db.Photographers
            .Include(p => p.Photos)
            .Include(p => p.Contest).ThenInclude(c => c.Topics)
            .FirstOrDefaultAsync(p => p.Token == token);

        if (p is null) return NotFound();

        return new PhotographerSessionDto(
            new PhotographerWithPhotosDto(p.Id, p.Name, p.Bio, p.ContestId, p.Token,
                p.Photos.Select(ph => new PhotoDto(ph.Id, ph.Title, ph.ImageUrl, ph.PhotographerId, ph.TopicId)).ToList()),
            new ContestDto(p.Contest.Id, p.Contest.Name, p.Contest.Description, p.Contest.UploadEndDate, p.Contest.RatingEndDate, p.Contest.CreatedAt, p.Contest.Rewards, p.Contest.IsCompleted),
            p.Contest.Topics.OrderBy(t => t.OrderIndex).Select(t => new TopicDto(t.Id, t.Name, t.ContestId, t.OrderIndex)).ToList()
        );
    }

    [HttpPost("photos")]
    public async Task<ActionResult<PhotoDto>> Upload(Guid token, [FromForm] int topicId, IFormFile file)
    {
        var p = await db.Photographers
            .Include(p => p.Photos)
            .Include(p => p.Contest)
            .FirstOrDefaultAsync(p => p.Token == token);

        if (p is null) return NotFound();
        if (DateTime.UtcNow >= p.Contest.UploadEndDate) return BadRequest("Upload period has ended.");
        if (!await db.Topics.AnyAsync(t => t.Id == topicId && t.ContestId == p.ContestId))
            return BadRequest("Topic not found in this contest.");

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!new[] { ".jpg", ".jpeg", ".png", ".webp" }.Contains(ext))
            return BadRequest("Only JPG, PNG, and WebP images are allowed.");

        var uploadPath = config["UploadPath"] ?? Path.Combine(env.ContentRootPath, "uploads");
        Directory.CreateDirectory(uploadPath);

        // Replace existing photo for this topic if any
        var existing = p.Photos.FirstOrDefault(ph => ph.TopicId == topicId);
        if (existing is not null)
        {
            var oldFile = Path.Combine(uploadPath, Path.GetFileName(existing.ImageUrl));
            if (System.IO.File.Exists(oldFile)) System.IO.File.Delete(oldFile);
            db.Photos.Remove(existing);
        }

        var fileName = $"{Guid.NewGuid()}{ext}";
        await using (var stream = System.IO.File.Create(Path.Combine(uploadPath, fileName)))
            await file.CopyToAsync(stream);

        var photo = new Photo { ImageUrl = $"/uploads/{fileName}", PhotographerId = p.Id, TopicId = topicId };
        db.Photos.Add(photo);
        await db.SaveChangesAsync();

        return new PhotoDto(photo.Id, photo.Title, photo.ImageUrl, photo.PhotographerId, photo.TopicId);
    }

    [HttpGet("competitors")]
    public async Task<ActionResult<List<string>>> GetCompetitors(Guid token)
    {
        var p = await db.Photographers.FirstOrDefaultAsync(p => p.Token == token);
        if (p is null) return NotFound();

        var names = await db.Photographers
            .Where(ph => ph.ContestId == p.ContestId && ph.Id != p.Id)
            .OrderBy(ph => ph.Name)
            .Select(ph => ph.Name)
            .ToListAsync();

        return names;
    }

    [HttpDelete("photos/{photoId}")]
    public async Task<IActionResult> DeletePhoto(Guid token, int photoId)
    {
        var p = await db.Photographers.FirstOrDefaultAsync(p => p.Token == token);
        if (p is null) return NotFound();

        var photo = await db.Photos.FirstOrDefaultAsync(ph => ph.Id == photoId && ph.PhotographerId == p.Id);
        if (photo is null) return NotFound();

        var uploadPath = config["UploadPath"] ?? Path.Combine(env.ContentRootPath, "uploads");
        var filePath = Path.Combine(uploadPath, Path.GetFileName(photo.ImageUrl));
        if (System.IO.File.Exists(filePath)) System.IO.File.Delete(filePath);

        db.Photos.Remove(photo);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
