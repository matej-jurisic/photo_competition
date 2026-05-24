using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PhotoRating.API.Data;
using PhotoRating.API.Extensions;
using PhotoRating.API.Models;

namespace PhotoRating.API.Controllers;

[ApiController]
[Authorize]
[Route("api/user-sessions")]
public class UserSessionController(AppDbContext db) : ControllerBase
{
    [HttpGet("judge/{contestId}")]
    public async Task<ActionResult<JudgeSessionDto>> GetJudgeSession(int contestId)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();

        var judge = await db.Judges
            .AsNoTracking()
            .AsSplitQuery()
            .Include(j => j.Contest)
                .ThenInclude(c => c.Photographers)
                .ThenInclude(p => p.Photos)
            .Include(j => j.Contest)
                .ThenInclude(c => c.Topics)
            .Include(j => j.Contest)
                .ThenInclude(c => c.Badges)
            .Include(j => j.Ratings)
            .FirstOrDefaultAsync(j => j.UserId == userId && j.ContestId == contestId);

        if (judge is null) return NotFound("You are not a judge in this contest.");

        var contest = judge.Contest;
        var contestDto = new ContestDetailDto(
            contest.Id, contest.Name, contest.Description,
            contest.UploadEndDate, contest.RatingEndDate, contest.CreatedAt,
            contest.Rewards, contest.IsCompleted, contest.IsUploadClosed,
            contest.Photographers.Select(p => new PhotographerWithPhotosDto(
                p.Id, p.Name, p.Bio, p.ContestId, p.Token,
                p.Photos.Select(ph => new PhotoDto(ph.Id, ph.Title, ph.ImageUrl, ph.PhotographerId, ph.TopicId)).ToList()
            )).ToList(),
            contest.Topics.OrderBy(t => t.OrderIndex)
                .Select(t => new TopicDto(t.Id, t.Name, t.ContestId, t.OrderIndex)).ToList(),
            [],
            contest.Badges.Select(b => new ContestBadgeDto(b.Id, b.Name, b.AllowedCount)).ToList(),
            contest.OwnerId
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

    [HttpGet("photographer/{contestId}")]
    public async Task<ActionResult<PhotographerSessionDto>> GetPhotographerSession(int contestId)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();

        var photographer = await db.Photographers
            .AsNoTracking()
            .AsSplitQuery()
            .Include(p => p.Contest).ThenInclude(c => c.Topics)
            .Include(p => p.Photos)
            .FirstOrDefaultAsync(p => p.UserId == userId && p.ContestId == contestId);

        if (photographer is null) return NotFound("You are not a photographer in this contest.");

        var contest = photographer.Contest;
        var contestDto = new ContestDto(
            contest.Id, contest.Name, contest.Description,
            contest.UploadEndDate, contest.RatingEndDate, contest.CreatedAt,
            contest.Rewards, contest.IsCompleted, contest.IsUploadClosed, contest.OwnerId);

        var photographerDto = new PhotographerWithPhotosDto(
            photographer.Id, photographer.Name, photographer.Bio, photographer.ContestId, photographer.Token,
            photographer.Photos.Select(ph => new PhotoDto(ph.Id, ph.Title, ph.ImageUrl, ph.PhotographerId, ph.TopicId)).ToList()
        );

        var topics = contest.Topics
            .OrderBy(t => t.OrderIndex)
            .Select(t => new TopicDto(t.Id, t.Name, t.ContestId, t.OrderIndex))
            .ToList();

        return new PhotographerSessionDto(photographerDto, contestDto, topics);
    }
}
