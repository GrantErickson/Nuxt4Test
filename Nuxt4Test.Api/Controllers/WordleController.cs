using System.Reflection;
using Microsoft.AspNetCore.Mvc;

namespace Nuxt4Test.Api.Controllers;

[ApiController]
[Route("[controller]")]
public class WordleController : ControllerBase
{
    private static readonly string[] Words = LoadWords();

    private readonly ILogger<WordleController> _logger;

    public WordleController(ILogger<WordleController> logger)
    {
        _logger = logger;
    }

    private static string[] LoadWords()
    {
        var assembly = Assembly.GetExecutingAssembly();
        using var stream = assembly.GetManifestResourceStream("Nuxt4Test.Api.word-bank.csv");
        if (stream is null)
        {
            throw new InvalidOperationException("Could not load word-bank.csv embedded resource");
        }

        using var reader = new StreamReader(stream);
        var content = reader.ReadToEnd();
        return content.Split(['\r', '\n'], StringSplitOptions.RemoveEmptyEntries);
    }

    /// <summary>
    /// Gets the Wordle word of the day.
    /// </summary>
    /// <returns>A 5-letter word for today's Wordle puzzle.</returns>
    [HttpGet("word-of-the-day")]
    public string GetWordOfTheDay()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var random = new Random(today.DayNumber);
        var wordIndex = random.Next(Words.Length);
        var word = Words[wordIndex];

        _logger.LogInformation("Word of the day requested for {Date}: {Word}", today, word);

        return word;
    }
}
