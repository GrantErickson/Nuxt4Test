using Microsoft.Extensions.Logging;
using Moq;
using Nuxt4Test.Api.Controllers;
using Xunit;

namespace Nuxt4Test.Api.Tests;

public class WordleControllerTests
{
  private readonly Mock<ILogger<WordleController>> _loggerMock;
  private readonly WordleController _controller;

  public WordleControllerTests()
  {
    _loggerMock = new Mock<ILogger<WordleController>>();
    _controller = new WordleController(_loggerMock.Object);
  }

  [Fact]
  public void GetWordOfTheDay_ReturnsFiveLetterWord()
  {
    // Act
    var result = _controller.GetWordOfTheDay();

    // Assert
    Assert.Equal(5, result.Length);
  }

  [Fact]
  public void GetWordOfTheDay_ReturnsOnlyLowercaseLetters()
  {
    // Act
    var result = _controller.GetWordOfTheDay();

    // Assert
    Assert.Matches("^[a-z]{5}$", result);
  }

  [Fact]
  public void GetWordOfTheDay_ReturnsSameWordOnSameDay()
  {
    // Act - call multiple times
    var result1 = _controller.GetWordOfTheDay();
    var result2 = _controller.GetWordOfTheDay();
    var result3 = _controller.GetWordOfTheDay();

    // Assert - should be the same word for the same day
    Assert.Equal(result1, result2);
    Assert.Equal(result2, result3);
  }

  [Fact]
  public void GetWordOfTheDay_IsDeterministic()
  {
    // Arrange - create multiple controller instances
    var controller1 = new WordleController(new Mock<ILogger<WordleController>>().Object);
    var controller2 = new WordleController(new Mock<ILogger<WordleController>>().Object);

    // Act
    var result1 = controller1.GetWordOfTheDay();
    var result2 = controller2.GetWordOfTheDay();

    // Assert - different instances should return the same word
    Assert.Equal(result1, result2);
  }
}
