using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using PhotoRating.API.Data;
using PhotoRating.API.Extensions;
using PhotoRating.API.Models;
using PhotoRating.API.Services;

namespace PhotoRating.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(AppDbContext db, JwtService jwtService) : ControllerBase
{
    [HttpPost("register")]
    [EnableRateLimiting("auth")]
    public async Task<ActionResult<AuthResultDto>> Register(RegisterDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Username) || string.IsNullOrWhiteSpace(dto.Password) || string.IsNullOrWhiteSpace(dto.DisplayName))
            return BadRequest("Username, display name, and password are required.");

        if (dto.Username.Length < 3 || dto.Username.Length > 30)
            return BadRequest("Username must be between 3 and 30 characters.");

        if (dto.Password.Length < 6)
            return BadRequest("Password must be at least 6 characters.");

        var normalized = dto.Username.Trim().ToLowerInvariant();

        if (await db.Users.AnyAsync(u => u.Username == normalized))
            return Conflict("Username already taken.");

        var user = new AppUser
        {
            Username = normalized,
            DisplayName = dto.DisplayName.Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password, workFactor: 12)
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();

        var token = jwtService.GenerateToken(user.Id, user.Username, user.DisplayName);
        return Ok(new AuthResultDto(token, user.Id, user.Username, user.DisplayName));
    }

    [HttpPost("login")]
    [EnableRateLimiting("auth")]
    public async Task<ActionResult<AuthResultDto>> Login(LoginDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Username) || string.IsNullOrWhiteSpace(dto.Password))
            return BadRequest("Username and password are required.");

        var normalized = dto.Username.Trim().ToLowerInvariant();
        var user = await db.Users.FirstOrDefaultAsync(u => u.Username == normalized);

        if (user is null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            return Unauthorized("Invalid username or password.");

        var token = jwtService.GenerateToken(user.Id, user.Username, user.DisplayName);
        return Ok(new AuthResultDto(token, user.Id, user.Username, user.DisplayName));
    }

    [HttpGet("me")]
    [Authorize]
    public ActionResult<AuthResultDto> Me()
    {
        var userId = User.GetUserId();
        var username = User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value;
        var displayName = User.FindFirst("displayName")?.Value;

        if (userId is null || username is null || displayName is null) return Unauthorized();

        var token = jwtService.GenerateToken(userId.Value, username, displayName);
        return Ok(new AuthResultDto(token, userId.Value, username, displayName));
    }
}
