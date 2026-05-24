namespace PhotoRating.API.Models;

public class AppUser
{
    public int Id { get; set; }
    public string Username { get; set; } = "";
    public string DisplayName { get; set; } = "";
    public string PasswordHash { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<Contest> OwnedContests { get; set; } = [];
    public List<Photographer> PhotographerRoles { get; set; } = [];
    public List<Judge> JudgeRoles { get; set; } = [];
    public List<JoinRequest> JoinRequests { get; set; } = [];
}

public enum JoinRole { Photographer, Judge }
public enum JoinRequestStatus { Pending, Accepted, Rejected }

public class JoinRequest
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public AppUser User { get; set; } = null!;
    public int ContestId { get; set; }
    public Contest Contest { get; set; } = null!;
    public JoinRole Role { get; set; }
    public JoinRequestStatus Status { get; set; } = JoinRequestStatus.Pending;
    public string? Message { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ReviewedAt { get; set; }
}

public class Contest
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string? Description { get; set; }
    public List<string> Rewards { get; set; } = [];
    public DateTime UploadEndDate { get; set; }
    public DateTime RatingEndDate { get; set; }
    public bool IsCompleted { get; set; }
    public bool IsUploadClosed { get; set; }
    public bool IsPublic { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public int? OwnerId { get; set; }
    public AppUser? Owner { get; set; }

    public List<Photographer> Photographers { get; set; } = [];
    public List<Topic> Topics { get; set; } = [];
    public List<Judge> Judges { get; set; } = [];
    public List<ContestBadge> Badges { get; set; } = [];
}

public class ContestBadge
{
    public int Id { get; set; }
    public int ContestId { get; set; }
    public Contest Contest { get; set; } = null!;
    public string Name { get; set; } = "";
    public int AllowedCount { get; set; } = 1;
}

public class Photographer
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string? Bio { get; set; }
    public Guid Token { get; set; } = Guid.NewGuid();
    public int ContestId { get; set; }
    public Contest Contest { get; set; } = null!;
    public int? UserId { get; set; }
    public AppUser? User { get; set; }
    public List<Photo> Photos { get; set; } = [];
}

public class Topic
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public int OrderIndex { get; set; }
    public int ContestId { get; set; }
    public Contest Contest { get; set; } = null!;
    public List<Photo> Photos { get; set; } = [];
}

public class Photo
{
    public int Id { get; set; }
    public string? Title { get; set; }
    public string ImageUrl { get; set; } = "";
    public int PhotographerId { get; set; }
    public Photographer Photographer { get; set; } = null!;
    public int TopicId { get; set; }
    public Topic Topic { get; set; } = null!;
    public List<Rating> Ratings { get; set; } = [];
}

public class Judge
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string? Email { get; set; }
    public Guid Token { get; set; } = Guid.NewGuid();
    public int ContestId { get; set; }
    public Contest Contest { get; set; } = null!;
    public int? UserId { get; set; }
    public AppUser? User { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public List<Rating> Ratings { get; set; } = [];
}

public class Rating
{
    public int Id { get; set; }
    public int JudgeId { get; set; }
    public Judge Judge { get; set; } = null!;
    public int PhotoId { get; set; }
    public Photo Photo { get; set; } = null!;
    public int Score { get; set; }
    public string? Comment { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}

public class Badge
{
    public int Id { get; set; }
    public int JudgeId { get; set; }
    public Judge Judge { get; set; } = null!;
    public int PhotoId { get; set; }
    public Photo Photo { get; set; } = null!;
    public string BadgeName { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
