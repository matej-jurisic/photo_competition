namespace PhotoRating.API.Models;

// Auth
public record RegisterDto(string Username, string DisplayName, string Password);
public record LoginDto(string Username, string Password);
public record AuthResultDto(string Token, int UserId, string Username, string DisplayName);

// Contest
public record ContestBadgeDto(int Id, string Name, int AllowedCount);
public record ContestBadgeInputDto(string Name, int AllowedCount);
public record CreateContestDto(string Name, string? Description, DateTime UploadEndDate, DateTime RatingEndDate, List<string> Rewards, List<ContestBadgeInputDto> Badges);
public record UpdateContestDto(string Name, string? Description, DateTime UploadEndDate, DateTime RatingEndDate, List<string> Rewards, List<ContestBadgeInputDto> Badges);
public record ContestDto(int Id, string Name, string? Description, DateTime UploadEndDate, DateTime RatingEndDate, DateTime CreatedAt, List<string> Rewards, bool IsCompleted, bool IsUploadClosed, int? OwnerId = null);
public record ContestDetailDto(
    int Id, string Name, string? Description, DateTime UploadEndDate, DateTime RatingEndDate, DateTime CreatedAt, List<string> Rewards, bool IsCompleted, bool IsUploadClosed,
    List<PhotographerWithPhotosDto> Photographers,
    List<TopicDto> Topics,
    List<JudgeDto> Judges,
    List<ContestBadgeDto> Badges,
    int? OwnerId = null);
public record SetCompleteDto(bool IsCompleted);
public record SetUploadClosedDto(bool IsUploadClosed);

// Browse (public, no tokens)
public record ContestPublicDto(
    int Id, string Name, string? Description,
    DateTime UploadEndDate, DateTime RatingEndDate, DateTime CreatedAt,
    bool IsCompleted, bool IsUploadClosed,
    string? OwnerDisplayName,
    int PhotographerCount, int JudgeCount,
    List<TopicDto> Topics);

// Photographer
public record CreatePhotographerDto(string Name, string? Bio, int? UserId = null);
public record UpdatePhotographerDto(string Name, string? Bio);
public record PhotographerDto(int Id, string Name, string? Bio, int ContestId, Guid Token);
public record PhotographerWithPhotosDto(int Id, string Name, string? Bio, int ContestId, Guid Token, List<PhotoDto> Photos);

// Photographer session (public, by token)
public record PhotographerSessionDto(PhotographerWithPhotosDto Photographer, ContestDto Contest, List<TopicDto> Topics);

// Topic
public record CreateTopicDto(string Name, int OrderIndex);
public record UpdateTopicDto(string Name, int OrderIndex);
public record TopicDto(int Id, string Name, int ContestId, int OrderIndex);

// Photo
public record PhotoDto(int Id, string? Title, string ImageUrl, int PhotographerId, int TopicId);

// Judge
public record CreateJudgeDto(string Name, string? Email, int? UserId = null);
public record UpdateJudgeDto(string Name, string? Email);
public record JudgeDto(int Id, string Name, string? Email, Guid Token, int ContestId, DateTime CreatedAt);

// Ratings
public record UpsertRatingDto(int PhotoId, int Score, string? Comment);
public record BulkUpsertRatingsDto(List<UpsertRatingDto> Ratings);
public record RatingDto(int Id, int PhotoId, int Score, string? Comment, DateTime CreatedAt);

// Judge session (public)
public record JudgeSessionDto(JudgeDto Judge, ContestDetailDto Contest, List<RatingDto> ExistingRatings, List<BadgeDto> ExistingBadges);

// Badges
public record BadgeDto(int Id, int JudgeId, int PhotoId, string BadgeName);
public record BadgeItemDto(int PhotoId, string BadgeName);
public record SetBadgesDto(List<BadgeItemDto> Badges);
public record BadgedPhotoDto(PhotoDto Photo, string PhotographerName, string TopicName, List<string> Badges);

// Results
public record PhotographerScoreDto(PhotographerDto Photographer, double AverageScore, int TotalRatings, int TotalPhotos, PhotoDto? TopPhoto, List<string> Comments);
public record TopicResultDto(TopicDto Topic, List<PhotographerScoreDto> Scores);
public record ContestResultsDto(ContestDto Contest, List<TopicResultDto> Topics, PhotographerDto? Winner, double? WinnerScore, List<PhotographerDto> TiedPhotographers, List<BadgedPhotoDto> BadgedPhotos, List<PhotographerScoreDto> OverallScores, int JudgeCount);

// Join requests
public record CreateJoinRequestDto(JoinRole Role, string? Message);
public record JoinRequestDto(int Id, int ContestId, string ContestName, string RequesterDisplayName, JoinRole Role, JoinRequestStatus Status, string? Message, DateTime CreatedAt, DateTime? ReviewedAt);

// Admin user search
public record UserSummaryDto(int Id, string Username, string DisplayName);

// Dashboard
public record MyContestEntryDto(ContestDto Contest, JoinRole Role);
public record OwnedContestSummaryDto(ContestDto Contest, int PendingRequestCount);
