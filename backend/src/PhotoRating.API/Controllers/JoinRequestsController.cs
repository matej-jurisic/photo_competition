using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using PhotoRating.API.Data;
using PhotoRating.API.Extensions;
using PhotoRating.API.Models;

namespace PhotoRating.API.Controllers;

[ApiController]
[Authorize]
public class JoinRequestsController(AppDbContext db, IConfiguration config) : ControllerBase
{
    private bool IsAdmin() =>
        !string.IsNullOrEmpty(config["AdminKey"]) &&
        Request.Headers["X-Admin-Key"].FirstOrDefault() == config["AdminKey"];

    [HttpPost("api/contests/{contestId}/join-requests")]
    [EnableRateLimiting("joinRequest")]
    public async Task<ActionResult<JoinRequestDto>> Create(int contestId, CreateJoinRequestDto dto)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();

        var contest = await db.Contests.FindAsync(contestId);
        if (contest is null) return NotFound("Contest not found.");

        if (contest.IsCompleted || contest.RatingEndDate < DateTime.UtcNow)
            return BadRequest("Contest is already completed.");

        // Check they aren't already a participant
        bool isPhotographer = dto.Role == JoinRole.Photographer &&
            await db.Photographers.AnyAsync(p => p.UserId == userId && p.ContestId == contestId);
        bool isJudge = dto.Role == JoinRole.Judge &&
            await db.Judges.AnyAsync(j => j.UserId == userId && j.ContestId == contestId);

        if (isPhotographer || isJudge)
            return Conflict("You are already a participant in this contest for this role.");

        // Check for existing pending/accepted request
        var existing = await db.JoinRequests
            .FirstOrDefaultAsync(r => r.UserId == userId && r.ContestId == contestId && r.Role == dto.Role);

        if (existing is not null)
        {
            if (existing.Status == JoinRequestStatus.Pending)
                return Conflict("You already have a pending request for this role.");
            if (existing.Status == JoinRequestStatus.Accepted)
                return Conflict("Your request was already accepted.");
            // Rejected: update to pending so they can try again
            existing.Status = JoinRequestStatus.Pending;
            existing.Message = dto.Message;
            existing.ReviewedAt = null;
            existing.CreatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();
            return ToDto(existing, contest.Name, User.FindFirst("displayName")?.Value ?? "");
        }

        var request = new JoinRequest
        {
            UserId = userId.Value,
            ContestId = contestId,
            Role = dto.Role,
            Message = dto.Message
        };

        db.JoinRequests.Add(request);
        await db.SaveChangesAsync();

        return CreatedAtAction(null, ToDto(request, contest.Name, User.FindFirst("displayName")?.Value ?? ""));
    }

    [HttpGet("api/contests/{contestId}/join-requests")]
    [AllowAnonymous]
    public async Task<ActionResult<List<JoinRequestDto>>> GetForContest(int contestId)
    {
        var userId = User.GetUserId();

        var contest = await db.Contests.FindAsync(contestId);
        if (contest is null) return NotFound();

        if (!IsAdmin() && contest.OwnerId != userId)
            return Forbid();

        return await db.JoinRequests
            .Where(r => r.ContestId == contestId && r.Status == JoinRequestStatus.Pending)
            .Include(r => r.User)
            .Select(r => new JoinRequestDto(
                r.Id, r.ContestId, contest.Name,
                r.User.DisplayName, r.Role, r.Status,
                r.Message, r.CreatedAt, r.ReviewedAt))
            .ToListAsync();
    }

    [HttpPatch("api/join-requests/{requestId}/accept")]
    [AllowAnonymous]
    public async Task<IActionResult> Accept(int requestId)
    {
        var userId = User.GetUserId();
        if (!IsAdmin() && userId is null) return Unauthorized();

        var request = await db.JoinRequests
            .Include(r => r.Contest)
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.Id == requestId);

        if (request is null) return NotFound();
        if (!IsAdmin() && request.Contest.OwnerId != userId) return Forbid();
        if (request.Status != JoinRequestStatus.Pending) return BadRequest("Request is not pending.");

        request.Status = JoinRequestStatus.Accepted;
        request.ReviewedAt = DateTime.UtcNow;

        if (request.Role == JoinRole.Photographer)
        {
            db.Photographers.Add(new Photographer
            {
                Name = request.User.DisplayName,
                ContestId = request.ContestId,
                UserId = request.UserId
            });
        }
        else
        {
            db.Judges.Add(new Judge
            {
                Name = request.User.DisplayName,
                ContestId = request.ContestId,
                UserId = request.UserId
            });
        }

        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPatch("api/join-requests/{requestId}/reject")]
    [AllowAnonymous]
    public async Task<IActionResult> Reject(int requestId)
    {
        var userId = User.GetUserId();
        if (!IsAdmin() && userId is null) return Unauthorized();

        var request = await db.JoinRequests
            .Include(r => r.Contest)
            .FirstOrDefaultAsync(r => r.Id == requestId);

        if (request is null) return NotFound();
        if (!IsAdmin() && request.Contest.OwnerId != userId) return Forbid();
        if (request.Status != JoinRequestStatus.Pending) return BadRequest("Request is not pending.");

        request.Status = JoinRequestStatus.Rejected;
        request.ReviewedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("api/users/me/join-requests")]
    public async Task<ActionResult<List<JoinRequestDto>>> MyRequests()
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();

        return await db.JoinRequests
            .Where(r => r.UserId == userId)
            .Include(r => r.Contest)
            .Include(r => r.User)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new JoinRequestDto(
                r.Id, r.ContestId, r.Contest.Name,
                r.User.DisplayName, r.Role, r.Status,
                r.Message, r.CreatedAt, r.ReviewedAt))
            .ToListAsync();
    }

    private static JoinRequestDto ToDto(JoinRequest r, string contestName, string displayName) =>
        new(r.Id, r.ContestId, contestName, displayName, r.Role, r.Status, r.Message, r.CreatedAt, r.ReviewedAt);
}
