using Microsoft.EntityFrameworkCore;
using Nuxt4Test.Api.Models;

namespace Nuxt4Test.Api.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<HighScore> HighScores { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<HighScore>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.PlayerName).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Score).IsRequired();
                entity.Property(e => e.AchievedAt).IsRequired();
            });
        }
    }
}
