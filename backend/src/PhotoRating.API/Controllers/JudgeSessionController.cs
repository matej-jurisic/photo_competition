using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PhotoRating.API.Data;
using PhotoRating.API.Models;

namespace PhotoRating.API.Controllers;

[ApiController]
[Route("api/sessions/{token:guid}")]
public class JudgeSessionController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<JudgeSessionDto>> GetSession(Guid token)
    {
        var judge = await db.Judges
            .Include(j => j.Contest)
                .ThenInclude(c => c.Photographers)
                .ThenInclude(p => p.Photos)
            .Include(j => j.Contest)
                .ThenInclude(c => c.Topics)
            .Include(j => j.Contest)
                .ThenInclude(c => c.Judges)
            .Include(j => j.Contest)
                .ThenInclude(c => c.Badges)
            .Include(j => j.Ratings)
            .FirstOrDefaultAsync(j => j.Token == token);

        if (judge is null) return NotFound();

        var contest = judge.Contest;
        var contestDto = new ContestDetailDto(
            contest.Id, contest.Name, contest.Description, contest.UploadEndDate, contest.RatingEndDate, contest.CreatedAt, contest.Rewards, contest.IsCompleted, contest.IsUploadClosed,
            contest.Photographers.Select(p => new PhotographerWithPhotosDto(
                p.Id, p.Name, p.Bio, p.ContestId, p.Token,
                p.Photos.Select(ph => new PhotoDto(ph.Id, ph.Title, ph.ImageUrl, ph.PhotographerId, ph.TopicId)).ToList()
            )).ToList(),
            contest.Topics.OrderBy(t => t.OrderIndex)
                .Select(t => new TopicDto(t.Id, t.Name, t.ContestId, t.OrderIndex)).ToList(),
            contest.Judges.Select(j => new JudgeDto(j.Id, j.Name, j.Email, j.Token, j.ContestId, j.CreatedAt)).ToList(),
            contest.Badges.Select(b => new ContestBadgeDto(b.Id, b.Name, b.AllowedCount)).ToList()
        );

        var ratings = judge.Ratings
            .Select(r => new RatingDto(r.Id, r.PhotoId, r.Score, r.Comment, r.CreatedAt))
            .ToList();

        var badges = await db.Badges
            .Where(b => b.JudgeId == judge.Id)
            .Select(b => new BadgeDto(b.Id, b.JudgeId, b.PhotoId, b.BadgeName))
            .ToListAsync();

        var judgeDto = new JudgeDto(judge.Id, judge.Name, judge.Email, judge.Token, judge.ContestId, judge.CreatedAt);
        return new JudgeSessionDto(judgeDto, contestDto, ratings, badges);
    }

    [HttpPost("ratings")]
    public async Task<ActionResult<List<RatingDto>>> UpsertRatings(Guid token, BulkUpsertRatingsDto dto)
    {
        var judge = await db.Judges
            .Include(j => j.Ratings)
            .Include(j => j.Contest)
            .FirstOrDefaultAsync(j => j.Token == token);

        if (judge is null) return NotFound();

        if (judge.Contest!.IsCompleted)
            return BadRequest("Contest has been completed, ratings are closed.");
        if (!judge.Contest!.IsUploadClosed && DateTime.UtcNow < judge.Contest!.UploadEndDate)
            return BadRequest("Rating period has not started yet.");
        if (DateTime.UtcNow > judge.Contest!.RatingEndDate)
            return BadRequest("Contest has ended, ratings are closed.");

        foreach (var item in dto.Ratings)
        {
            if (item.Score < 1 || item.Score > 10)
                return BadRequest($"Score must be between 1 and 10 (got {item.Score} for photo {item.PhotoId}).");

            var existing = judge.Ratings.FirstOrDefault(r => r.PhotoId == item.PhotoId);
            if (existing is not null)
            {
                existing.Score = item.Score;
                existing.Comment = item.Comment;
                existing.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                db.Ratings.Add(new Rating
                {
                    JudgeId = judge.Id,
                    PhotoId = item.PhotoId,
                    Score = item.Score,
                    Comment = item.Comment
                });
            }
        }

        await db.SaveChangesAsync();

        var updated = await db.Ratings
            .Where(r => r.JudgeId == judge.Id)
            .Select(r => new RatingDto(r.Id, r.PhotoId, r.Score, r.Comment, r.CreatedAt))
            .ToListAsync();

        return updated;
    }

    [HttpPost("badges")]
    public async Task<ActionResult<List<BadgeDto>>> SetBadges(Guid token, SetBadgesDto dto)
    {
        if (dto.Badges.Select(b => b.PhotoId).Distinct().Count() != dto.Badges.Count)
            return BadRequest("Each photo can only receive one badge.");

        var judge = await db.Judges
            .Include(j => j.Contest).ThenInclude(c => c.Badges)
            .FirstOrDefaultAsync(j => j.Token == token);

        if (judge is null) return NotFound();

        if (judge.Contest.IsCompleted || DateTime.UtcNow > judge.Contest.RatingEndDate)
            return BadRequest("Contest is closed.");

        var contestBadges = judge.Contest.Badges;
        var validNames = contestBadges.Select(b => b.Name).ToHashSet();

        if (dto.Badges.Any(b => !validNames.Contains(b.BadgeName)))
            return BadRequest("Invalid badge name.");

        foreach (var group in dto.Badges.GroupBy(b => b.BadgeName))
        {
            var config = contestBadges.First(cb => cb.Name == group.Key);
            if (group.Count() > config.AllowedCount)
                return BadRequest($"Badge '{group.Key}' can be used at most {config.AllowedCount} time(s).");
        }

        var existing = await db.Badges.Where(b => b.JudgeId == judge.Id).ToListAsync();
        db.Badges.RemoveRange(existing);

        foreach (var item in dto.Badges)
            db.Badges.Add(new Badge { JudgeId = judge.Id, PhotoId = item.PhotoId, BadgeName = item.BadgeName });

        await db.SaveChangesAsync();

        return await db.Badges
            .Where(b => b.JudgeId == judge.Id)
            .Select(b => new BadgeDto(b.Id, b.JudgeId, b.PhotoId, b.BadgeName))
            .ToListAsync();
    }
}
