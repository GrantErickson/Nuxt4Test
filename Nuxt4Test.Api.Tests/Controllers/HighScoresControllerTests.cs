using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using Nuxt4Test.Api.Controllers;
using Nuxt4Test.Api.Data;
using Nuxt4Test.Api.Models;
using Xunit;

namespace Nuxt4Test.Api.Tests;

public class HighScoresControllerTests : IDisposable
{
  private readonly ApplicationDbContext _context;
  private readonly Mock<ILogger<HighScoresController>> _loggerMock;
  private readonly HighScoresController _controller;

  public HighScoresControllerTests()
  {
    var options = new DbContextOptionsBuilder<ApplicationDbContext>()
        .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
        .Options;

    _context = new ApplicationDbContext(options);
    _loggerMock = new Mock<ILogger<HighScoresController>>();
    _controller = new HighScoresController(_context, _loggerMock.Object);
  }

  public void Dispose()
  {
    _context.Database.EnsureDeleted();
    _context.Dispose();
  }

  [Fact]
  public async Task GetHighScores_ReturnsScores_OrderedByScoreDescending()
  {
    // Arrange
    var scores = new List<HighScore>
        {
            new() { PlayerName = "Player1", Score = 100, AchievedAt = DateTime.UtcNow },
            new() { PlayerName = "Player2", Score = 300, AchievedAt = DateTime.UtcNow },
            new() { PlayerName = "Player3", Score = 200, AchievedAt = DateTime.UtcNow }
        };
    await _context.HighScores.AddRangeAsync(scores);
    await _context.SaveChangesAsync();

    // Act
    var result = await _controller.GetHighScores();

    // Assert
    Assert.NotNull(result.Value);
    var scoreList = result.Value.ToList();
    Assert.Equal(3, scoreList.Count);
    Assert.Equal(300, scoreList[0].Score);
    Assert.Equal(200, scoreList[1].Score);
    Assert.Equal(100, scoreList[2].Score);
  }

  [Fact]
  public async Task GetHighScores_ReturnsTop10Only()
  {
    // Arrange - add 15 scores
    var scores = Enumerable.Range(1, 15)
        .Select(i => new HighScore { PlayerName = $"Player{i}", Score = i * 10, AchievedAt = DateTime.UtcNow })
        .ToList();
    await _context.HighScores.AddRangeAsync(scores);
    await _context.SaveChangesAsync();

    // Act
    var result = await _controller.GetHighScores();

    // Assert
    Assert.NotNull(result.Value);
    Assert.Equal(10, result.Value.Count());
    // Should have scores 150, 140, 130, ... 60 (top 10)
    Assert.Equal(150, result.Value.First().Score);
    Assert.Equal(60, result.Value.Last().Score);
  }

  [Fact]
  public async Task GetHighScore_ReturnsNotFound_WhenIdDoesNotExist()
  {
    // Act
    var result = await _controller.GetHighScore(999);

    // Assert
    Assert.IsType<Microsoft.AspNetCore.Mvc.NotFoundResult>(result.Result);
  }

  [Fact]
  public async Task PostHighScore_CreatesNewScore()
  {
    // Arrange
    var newScore = new HighScore { PlayerName = "NewPlayer", Score = 750 };

    // Act
    var result = await _controller.PostHighScore(newScore);

    // Assert
    Assert.IsType<Microsoft.AspNetCore.Mvc.CreatedAtActionResult>(result.Result);
    var createdResult = (Microsoft.AspNetCore.Mvc.CreatedAtActionResult)result.Result;
    var createdScore = (HighScore)createdResult.Value!;
    Assert.Equal("NewPlayer", createdScore.PlayerName);
    Assert.Equal(750, createdScore.Score);
    Assert.NotEqual(default, createdScore.AchievedAt);
  }

  [Fact]
  public async Task PostHighScore_SetsAchievedAtToUtcNow()
  {
    // Arrange
    var beforePost = DateTime.UtcNow;
    var newScore = new HighScore { PlayerName = "TimePlayer", Score = 100 };

    // Act
    await _controller.PostHighScore(newScore);
    var afterPost = DateTime.UtcNow;

    // Assert
    var savedScore = await _context.HighScores.FirstAsync();
    Assert.InRange(savedScore.AchievedAt, beforePost, afterPost);
  }

  [Fact]
  public async Task DeleteHighScore_ReturnsNotFound_WhenIdDoesNotExist()
  {
    // Act
    var result = await _controller.DeleteHighScore(999);

    // Assert
    Assert.IsType<Microsoft.AspNetCore.Mvc.NotFoundResult>(result);
  }

  [Fact]
  public async Task DeleteHighScore_RemovesScore_WhenIdExists()
  {
    // Arrange
    var score = new HighScore { PlayerName = "ToDelete", Score = 100, AchievedAt = DateTime.UtcNow };
    await _context.HighScores.AddAsync(score);
    await _context.SaveChangesAsync();
    var id = score.Id;

    // Act
    var result = await _controller.DeleteHighScore(id);

    // Assert
    Assert.IsType<Microsoft.AspNetCore.Mvc.NoContentResult>(result);
    Assert.Null(await _context.HighScores.FindAsync(id));
  }
}
