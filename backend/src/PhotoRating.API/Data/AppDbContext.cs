using Microsoft.EntityFrameworkCore;
using PhotoRating.API.Models;

namespace PhotoRating.API.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Contest> Contests => Set<Contest>();
    public DbSet<Photographer> Photographers => Set<Photographer>();
    public DbSet<Topic> Topics => Set<Topic>();
    public DbSet<Photo> Photos => Set<Photo>();
    public DbSet<Judge> Judges => Set<Judge>();
    public DbSet<Rating> Ratings => Set<Rating>();

    protected override void OnModelCreating(ModelBuilder model)
    {
        model.Entity<Rating>()
            .HasIndex(r => new { r.JudgeId, r.PhotoId })
            .IsUnique();

        model.Entity<Judge>()
            .HasIndex(j => j.Token)
            .IsUnique();
    }
}
