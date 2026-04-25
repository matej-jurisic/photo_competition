using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PhotoRating.API.Data;
using PhotoRating.API.Filters;
using PhotoRating.API.Models;

namespace PhotoRating.API.Controllers;

[ApiController]
[Route("api/photos")]
[ServiceFilter(typeof(AdminAuthFilter))]
public class PhotosController(AppDbContext db, IConfiguration config, IWebHostEnvironment env) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<PhotoDto>> Upload(
        [FromForm] int photographerId,
        [FromForm] int topicId,
        [FromForm] string? title,
        IFormFile file)
    {
        if (!await db.Photographers.AnyAsync(p => p.Id == photographerId)) return NotFound("Photographer not found");
        if (!await db.Topics.AnyAsync(t => t.Id == topicId)) return NotFound("Topic not found");

        var uploadPath = config["UploadPath"] ?? Path.Combine(env.ContentRootPath, "uploads");
        Directory.CreateDirectory(uploadPath);

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        var allowed = new[] { ".jpg", ".jpeg", ".png", ".webp" };
        if (!allowed.Contains(ext)) return BadRequest("Only JPG, PNG, and WebP images are allowed.");

        var fileName = $"{Guid.NewGuid()}{ext}";
        var filePath = Path.Combine(uploadPath, fileName);

        await using (var stream = System.IO.File.Create(filePath))
            await file.CopyToAsync(stream);

        var photo = new Photo
        {
            Title = title,
            ImageUrl = $"/uploads/{fileName}",
            PhotographerId = photographerId,
            TopicId = topicId
        };
        db.Photos.Add(photo);
        await db.SaveChangesAsync();

        return new PhotoDto(photo.Id, photo.Title, photo.ImageUrl, photo.PhotographerId, photo.TopicId);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var photo = await db.Photos.FindAsync(id);
        if (photo is null) return NotFound();

        var uploadPath = config["UploadPath"] ?? Path.Combine(env.ContentRootPath, "uploads");
        var fileName = Path.GetFileName(photo.ImageUrl);
        var filePath = Path.Combine(uploadPath, fileName);
        if (System.IO.File.Exists(filePath)) System.IO.File.Delete(filePath);

        db.Photos.Remove(photo);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
