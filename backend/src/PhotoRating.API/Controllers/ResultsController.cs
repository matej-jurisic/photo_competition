using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PhotoRating.API.Data;
using PhotoRating.API.Models;

namespace PhotoRating.API.Controllers;

[ApiController]
[Route("api/contests/{contestId}/results")]
public class ResultsController(AppDbContext db, IConfiguration config) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ContestResultsDto>> GetResults(int contestId, [FromHeader(Name = "X-Admin-Key")] string? adminKey)
    {
        var contest = await db.Contests
            .AsNoTracking()
            .AsSplitQuery()
            .Include(c => c.Photographers)
            .Include(c => c.Topics)
            .Include(c => c.Judges)
            .FirstOrDefaultAsync(c => c.Id == contestId);

        if (contest is null) return NotFound();

        if (!contest.IsCompleted && DateTime.UtcNow < contest.RatingEndDate)
        {
            var expected = config["AdminKey"];
            if (string.IsNullOrEmpty(expected) || adminKey != expected)
                return Unauthorized();
        }

        var photos = await db.Photos
            .AsNoTracking()
            .Where(p => p.Photographer.ContestId == contestId)
            .Include(p => p.Ratings)
            .ToListAsync();

        var photographersById = contest.Photographers.ToDictionary(p => p.Id);
        var topicsById = contest.Topics.ToDictionary(t => t.Id);
        var photosById = photos.ToDictionary(p => p.Id);

        var topicResults = contest.Topics
            .OrderBy(t => t.OrderIndex)
            .Select(topic =>
            {
                var topicPhotos = photos.Where(p => p.TopicId == topic.Id).ToList();
                var scores = contest.Photographers
                    .Select(photographer =>
                    {
                        var photographerPhotos = topicPhotos.Where(p => p.PhotographerId == photographer.Id).ToList();
                        if (photographerPhotos.Count == 0) return null;
                        var allRatings = photographerPhotos.SelectMany(p => p.Ratings).ToList();
                        var topPhoto = photographerPhotos
                            .OrderByDescending(p => p.Ratings.Any() ? p.Ratings.Average(r => r.Score) : 0)
                            .First();
                        var comments = allRatings
                            .Where(r => !string.IsNullOrWhiteSpace(r.Comment))
                            .Select(r => r.Comment!)
                            .ToList();
                        return new PhotographerScoreDto(
                            new PhotographerDto(photographer.Id, photographer.Name, photographer.Bio, photographer.ContestId, photographer.Token),
                            allRatings.Count > 0 ? allRatings.Average(r => r.Score) : 0,
                            allRatings.Count,
                            photographerPhotos.Count,
                            new PhotoDto(topPhoto.Id, topPhoto.Title, topPhoto.ImageUrl, topPhoto.PhotographerId, topPhoto.TopicId),
                            comments
                        );
                    })
                    .Where(s => s is not null)
                    .Select(s => s!)
                    .ToList();

                return new TopicResultDto(
                    new TopicDto(topic.Id, topic.Name, topic.ContestId, topic.OrderIndex),
                    scores
                );
            }).ToList();

        // Compute overall scores (photographers who submitted at least one photo)
        var overallScoreDtos = contest.Photographers
            .Select(photographer =>
            {
                var photographerPhotos = photos.Where(p => p.PhotographerId == photographer.Id).ToList();
                if (photographerPhotos.Count == 0) return null;
                var allRatings = photographerPhotos.SelectMany(p => p.Ratings).ToList();
                var topPhoto = photographerPhotos
                    .OrderByDescending(p => p.Ratings.Any() ? p.Ratings.Average(r => r.Score) : 0)
                    .First();
                return new PhotographerScoreDto(
                    new PhotographerDto(photographer.Id, photographer.Name, photographer.Bio, photographer.ContestId, photographer.Token),
                    allRatings.Count > 0 ? allRatings.Average(r => r.Score) : 0,
                    allRatings.Count,
                    photographerPhotos.Count,
                    new PhotoDto(topPhoto.Id, topPhoto.Title, topPhoto.ImageUrl, topPhoto.PhotographerId, topPhoto.TopicId),
                    []
                );
            })
            .Where(s => s is not null)
            .Select(s => s!)
            .OrderByDescending(s => s.AverageScore)
            .ToList();

        // Determine overall winner
        Photographer? winner = null;
        List<Photographer> tiedPhotographers = [];
        var withRatings = overallScoreDtos.Where(s => s.AverageScore > 0).ToList();
        if (withRatings.Count >= 2 && withRatings[0].AverageScore > withRatings[1].AverageScore)
            winner = photographersById[withRatings[0].Photographer.Id];
        else if (withRatings.Count == 1)
            winner = photographersById[withRatings[0].Photographer.Id];
        else if (withRatings.Count >= 2)
        {
            var topAvg = withRatings[0].AverageScore;
            tiedPhotographers = withRatings
                .Where(x => x.AverageScore == topAvg)
                .Select(x => photographersById[x.Photographer.Id])
                .ToList();
        }

        var allBadges = await db.Badges
            .Where(b => photosById.Keys.Contains(b.PhotoId))
            .ToListAsync();

        var badgedPhotos = allBadges
            .GroupBy(b => b.PhotoId)
            .Select(g =>
            {
                var photo = photosById[g.Key];
                var photographer = photographersById[photo.PhotographerId];
                var topic = topicsById[photo.TopicId];
                return new BadgedPhotoDto(
                    new PhotoDto(photo.Id, photo.Title, photo.ImageUrl, photo.PhotographerId, photo.TopicId),
                    photographer.Name,
                    topic.Name,
                    g.Select(b => b.BadgeName).ToList()
                );
            })
            .ToList();

        var contestDto = new ContestDto(contest.Id, contest.Name, contest.Description, contest.UploadEndDate, contest.RatingEndDate, contest.CreatedAt, contest.Rewards, contest.IsCompleted, contest.IsUploadClosed);
        var winnerDto = winner is null ? null : new PhotographerDto(winner.Id, winner.Name, winner.Bio, winner.ContestId, winner.Token);
        var overallScoreById = overallScoreDtos.ToDictionary(x => x.Photographer.Id);
        var winnerScore = winner is null ? (double?)null : overallScoreById[winner.Id].AverageScore;
        var tiedDtos = tiedPhotographers.Select(p => new PhotographerDto(p.Id, p.Name, p.Bio, p.ContestId, p.Token)).ToList();

        return new ContestResultsDto(contestDto, topicResults, winnerDto, winnerScore, tiedDtos, badgedPhotos, overallScoreDtos, contest.Judges.Count);
    }
}
