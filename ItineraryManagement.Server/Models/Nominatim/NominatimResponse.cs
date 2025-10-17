namespace ItineraryManagement.Server.Models.Nominatim
{
    public class NominatimResponse
    {
        public double Longitude { get; set; }
        public double Latitude { get; set; }
        public string OsmType { get; set; } = "unknown";
        public long OsmId { get; set; }
        public Dictionary<string, string> Tags { get; set; } = new();

        public string? OpeningHours { get; set; }
        public string? Website { get; set; }
        public string? Phone { get; set; }
        public string? Name { get; set; }
    }
}
