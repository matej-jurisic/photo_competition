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
    public DbSet<AppUser> Users => Set<AppUser>();
    public DbSet<JoinRequest> JoinRequests => Set<JoinRequest>();

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

        // AppUser
        model.Entity<AppUser>()
            .HasIndex(u => u.Username)
            .IsUnique();

        // Contest → Owner: preserve contest when owner account is deleted
        model.Entity<Contest>()
            .HasOne(c => c.Owner)
            .WithMany(u => u.OwnedContests)
            .HasForeignKey(c => c.OwnerId)
            .OnDelete(DeleteBehavior.SetNull);

        // Photographer → User
        model.Entity<Photographer>()
            .HasOne(p => p.User)
            .WithMany(u => u.PhotographerRoles)
            .HasForeignKey(p => p.UserId)
            .OnDelete(DeleteBehavior.SetNull);

        // Judge → User
        model.Entity<Judge>()
            .HasOne(j => j.User)
            .WithMany(u => u.JudgeRoles)
            .HasForeignKey(j => j.UserId)
            .OnDelete(DeleteBehavior.SetNull);

        // JoinRequest
        model.Entity<JoinRequest>()
            .HasOne(r => r.User)
            .WithMany(u => u.JoinRequests)
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        model.Entity<JoinRequest>()
            .HasOne(r => r.Contest)
            .WithMany()
            .HasForeignKey(r => r.ContestId)
            .OnDelete(DeleteBehavior.Cascade);

        // One pending/accepted request per user+contest+role
        model.Entity<JoinRequest>()
            .HasIndex(r => new { r.UserId, r.ContestId, r.Role })
            .IsUnique();
    }
}
