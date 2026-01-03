namespace Nuxt4Test.Api.Models
{
    public class HighScore
    {
        public int Id { get; set; }
        public required string PlayerName { get; set; }
        public int Score { get; set; }
        public DateTime AchievedAt { get; set; }
    }
}
