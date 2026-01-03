using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Nuxt4Test.Api.Data;
using Nuxt4Test.Api.Models;

namespace Nuxt4Test.Api.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class HighScoresController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<HighScoresController> _logger;

        public HighScoresController(ApplicationDbContext context, ILogger<HighScoresController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<HighScore>>> GetHighScores()
        {
            return await _context.HighScores
                .OrderByDescending(h => h.Score)
                .Take(10)
                .ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<HighScore>> GetHighScore(int id)
        {
            var highScore = await _context.HighScores.FindAsync(id);

            if (highScore == null)
            {
                return NotFound();
            }

            return highScore;
        }

        [HttpPost]
        public async Task<ActionResult<HighScore>> PostHighScore(HighScore highScore)
        {
            highScore.AchievedAt = DateTime.UtcNow;
            _context.HighScores.Add(highScore);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetHighScore), new { id = highScore.Id }, highScore);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteHighScore(int id)
        {
            var highScore = await _context.HighScores.FindAsync(id);
            if (highScore == null)
            {
                return NotFound();
            }

            _context.HighScores.Remove(highScore);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
