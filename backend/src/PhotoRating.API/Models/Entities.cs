namespace PhotoRating.API.Models;

public class Contest
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string? Description { get; set; }
    public List<string> Rewards { get; set; } = [];
    public DateTime UploadEndDate { get; set; }
    public DateTime RatingEndDate { get; set; }
    public bool IsCompleted { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

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
