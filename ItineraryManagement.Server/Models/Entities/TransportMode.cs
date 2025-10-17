using System.Text.Json.Serialization;

namespace ItineraryManagement.Server.Models.Entities
{
    public class TransportMode
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;

        [JsonIgnore]
        public ICollection<ItineraryDayTransportSegment> TransportSegments { get; set; } = new List<ItineraryDayTransportSegment>();
    }
}
