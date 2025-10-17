namespace ItineraryManagement.Server.Models
{
    public class OverpassRequest
    {
        public string Query { get; set; } = string.Empty;
        public Proximity Proximity { get; set; } = new Proximity();
    }
}
