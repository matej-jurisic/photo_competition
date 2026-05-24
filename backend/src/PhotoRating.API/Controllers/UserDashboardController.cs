using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PhotoRating.API.Data;
using PhotoRating.API.Extensions;
using PhotoRating.API.Models;

namespace PhotoRating.API.Controllers;

[ApiController]
[Authorize]
[Route("api/users/me")]
public class UserDashboardController(AppDbContext db) : ControllerBase
{
    [HttpGet("owned-contests")]
    public async Task<ActionResult<List<OwnedContestSummaryDto>>> OwnedContests()
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();

        var contests = await db.Contests
            .AsNoTracking()
            .Where(c => c.OwnerId == userId)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        var contestIds = contests.Select(c => c.Id).ToList();

        var pendingCounts = await db.JoinRequests
            .Where(r => contestIds.Contains(r.ContestId) && r.Status == JoinRequestStatus.Pending)
            .GroupBy(r => r.ContestId)
            .Select(g => new { ContestId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.ContestId, x => x.Count);

        var result = contests.Select(c => new OwnedContestSummaryDto(
            new ContestDto(c.Id, c.Name, c.Description, c.UploadEndDate, c.RatingEndDate, c.CreatedAt, c.Rewards, c.IsCompleted, c.IsUploadClosed, c.OwnerId),
            pendingCounts.GetValueOrDefault(c.Id, 0)
        )).ToList();

        return result;
    }

    [HttpGet("contests")]
    public async Task<ActionResult<List<MyContestEntryDto>>> MyContests()
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();

        var photographerContests = await db.Photographers
            .AsNoTracking()
            .Where(p => p.UserId == userId)
            .Include(p => p.Contest)
            .Select(p => new MyContestEntryDto(
                new ContestDto(p.Contest.Id, p.Contest.Name, p.Contest.Description, p.Contest.UploadEndDate, p.Contest.RatingEndDate, p.Contest.CreatedAt, p.Contest.Rewards, p.Contest.IsCompleted, p.Contest.IsUploadClosed, p.Contest.OwnerId),
                JoinRole.Photographer))
            .ToListAsync();

        var judgeContests = await db.Judges
            .AsNoTracking()
            .Where(j => j.UserId == userId)
            .Include(j => j.Contest)
            .Select(j => new MyContestEntryDto(
                new ContestDto(j.Contest.Id, j.Contest.Name, j.Contest.Description, j.Contest.UploadEndDate, j.Contest.RatingEndDate, j.Contest.CreatedAt, j.Contest.Rewards, j.Contest.IsCompleted, j.Contest.IsUploadClosed, j.Contest.OwnerId),
                JoinRole.Judge))
            .ToListAsync();

        return photographerContests.Concat(judgeContests).ToList();
    }
}
