using Microsoft.Extensions.Logging;
using Moq;
using Nuxt4Test.Api.Controllers;
using Xunit;

namespace Nuxt4Test.Api.Tests;

public class WeatherForecastControllerTests
{
  private readonly Mock<ILogger<WeatherForecastController>> _loggerMock;
  private readonly WeatherForecastController _controller;

  public WeatherForecastControllerTests()
  {
    _loggerMock = new Mock<ILogger<WeatherForecastController>>();
    _controller = new WeatherForecastController(_loggerMock.Object);
  }

  [Fact]
  public void Get_ReturnsFiveForecasts()
  {
    // Act
    var result = _controller.Get();

    // Assert
    Assert.Equal(5, result.Count());
  }

  [Fact]
  public void Get_ReturnsConsecutiveDates()
  {
    // Act
    var result = _controller.Get().ToList();

    // Assert
    var today = DateOnly.FromDateTime(DateTime.Now);
    for (int i = 0; i < 5; i++)
    {
      Assert.Equal(today.AddDays(i + 1), result[i].Date);
    }
  }

  [Fact]
  public void Get_TemperatureIsInValidRange()
  {
    // Act
    var result = _controller.Get();

    // Assert
    foreach (var forecast in result)
    {
      Assert.InRange(forecast.TemperatureC, -20, 54);
    }
  }

  [Fact]
  public void Get_EachForecastHasSummary()
  {
    // Act
    var result = _controller.Get();

    // Assert
    foreach (var forecast in result)
    {
      Assert.NotNull(forecast.Summary);
      Assert.NotEmpty(forecast.Summary);
    }
  }

  [Fact]
  public void Get_TemperatureFIsCalculatedCorrectly()
  {
    // Act
    var result = _controller.Get();

    // Assert
    foreach (var forecast in result)
    {
      var expectedF = 32 + (int)(forecast.TemperatureC / 0.5556);
      Assert.Equal(expectedF, forecast.TemperatureF);
    }
  }
}
