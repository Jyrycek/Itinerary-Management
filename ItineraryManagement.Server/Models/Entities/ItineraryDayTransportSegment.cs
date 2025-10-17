using System.Text.Json.Serialization;

namespace ItineraryManagement.Server.Models.Entities
{
    public class ItineraryDayTransportSegment
    {
        public int ItineraryDayId { get; set; }
        public int FromPlaceId { get; set; }
        public int ToPlaceId { get; set; }
        public int TransportModeId { get; set; }

        [JsonIgnore]
        public ItineraryDay? ItineraryDay { get; set; }
        [JsonIgnore]
        public PlaceModel? FromPlace { get; set; }
        [JsonIgnore]
        public PlaceModel? ToPlace { get; set; }
        public TransportMode? TransportMode { get; set; }
    }
}
