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
    public DbSet<Badge> Badges => Set<Badge>();
    public DbSet<ContestBadge> ContestBadges => Set<ContestBadge>();

    protected override void OnModelCreating(ModelBuilder model)
    {
        model.Entity<Rating>()
            .HasIndex(r => new { r.JudgeId, r.PhotoId })
            .IsUnique();

        model.Entity<Judge>()
            .HasIndex(j => j.Token)
            .IsUnique();

        model.Entity<Photographer>()
            .HasIndex(p => p.Token)
            .IsUnique();

        model.Entity<Badge>()
            .HasIndex(b => new { b.JudgeId, b.PhotoId })
            .IsUnique();

        model.Entity<Badge>()
            .HasOne(b => b.Judge)
            .WithMany()
            .HasForeignKey(b => b.JudgeId)
            .OnDelete(DeleteBehavior.Cascade);

        model.Entity<Badge>()
            .HasOne(b => b.Photo)
            .WithMany()
            .HasForeignKey(b => b.PhotoId)
            .OnDelete(DeleteBehavior.Cascade);

        model.Entity<ContestBadge>()
            .HasOne(cb => cb.Contest)
            .WithMany(c => c.Badges)
            .HasForeignKey(cb => cb.ContestId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
