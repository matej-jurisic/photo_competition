using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PhotoRating.API.Data;
using PhotoRating.API.Models;

namespace PhotoRating.API.Controllers;

[ApiController]
[Route("api/contests/{contestId}/results")]
public class ResultsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ContestResultsDto>> GetResults(int contestId)
    {
        var contest = await db.Contests
            .Include(c => c.Photographers)
            .Include(c => c.Topics)
            .Include(c => c.Judges)
            .FirstOrDefaultAsync(c => c.Id == contestId);

        if (contest is null) return NotFound();

        var photos = await db.Photos
            .Where(p => p.Photographer.ContestId == contestId)
            .Include(p => p.Ratings)
            .ToListAsync();

        var topicResults = contest.Topics
            .OrderBy(t => t.OrderIndex)
            .Select(topic =>
            {
                var topicPhotos = photos.Where(p => p.TopicId == topic.Id).ToList();
                var scores = contest.Photographers.Select(photographer =>
                {
                    var photographerPhotos = topicPhotos.Where(p => p.PhotographerId == photographer.Id).ToList();
                    var allRatings = photographerPhotos.SelectMany(p => p.Ratings).ToList();
                    return new PhotographerScoreDto(
                        new PhotographerDto(photographer.Id, photographer.Name, photographer.Bio, photographer.ContestId, photographer.Token),
                        allRatings.Count > 0 ? allRatings.Average(r => r.Score) : 0,
                        allRatings.Count,
                        photographerPhotos.Count
                    );
                }).ToList();

                return new TopicResultDto(
                    new TopicDto(topic.Id, topic.Name, topic.ContestId, topic.OrderIndex),
                    scores
                );
            }).ToList();

        // Determine overall winner by average score across all topics
        var overallScores = contest.Photographers.Select(photographer =>
        {
            var photographerPhotos = photos.Where(p => p.PhotographerId == photographer.Id).ToList();
            var allRatings = photographerPhotos.SelectMany(p => p.Ratings).ToList();
            return (Photographer: photographer, Avg: allRatings.Count > 0 ? allRatings.Average(r => r.Score) : 0);
        }).ToList();

        Photographer? winner = null;
        var withRatings = overallScores.Where(x => x.Avg > 0).OrderByDescending(x => x.Avg).ToList();
        if (withRatings.Count >= 2 && withRatings[0].Avg > withRatings[1].Avg)
            winner = withRatings[0].Photographer;
        else if (withRatings.Count == 1)
            winner = withRatings[0].Photographer;

        var contestDto = new ContestDto(contest.Id, contest.Name, contest.Description, contest.EndDate, contest.CreatedAt, contest.Reward);
        var winnerDto = winner is null ? null : new PhotographerDto(winner.Id, winner.Name, winner.Bio, winner.ContestId, winner.Token);

        return new ContestResultsDto(contestDto, topicResults, winnerDto);
    }
}
