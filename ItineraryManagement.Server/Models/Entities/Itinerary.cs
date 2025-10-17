using System.Text.Json.Serialization;

namespace ItineraryManagement.Server.Models.Entities
{
    public class Itinerary
    {
        public int Id { get; set; }
        public int ProjectId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public List<ItineraryDay> ItineraryDays { get; set; } = new List<ItineraryDay>();
        [JsonIgnore]
        public ProjectModel Project { get; set; } = new ProjectModel();
    }

    public class ItineraryDay
    {
        public int Id { get; set; }
        public int ItineraryId { get; set; }
        public DateTime DayDate { get; set; }
        public TimeSpan? StartTime { get; set; }
        public TimeSpan? EndTime { get; set; }
        public List<ItineraryDayPlaceModel> ItineraryDayPlaces { get; set; } = new List<ItineraryDayPlaceModel>();
        [JsonIgnore]
        public Itinerary Itinerary { get; set; } = new Itinerary();
    }
    public class ItineraryDayDto
    {
        public int Id { get; set; }
        public DateTime DayDate { get; set; }
        public TimeSpan? StartTime { get; set; }
        public TimeSpan? EndTime { get; set; }
        public List<PlaceModelDTO> Places { get; set; } = new List<PlaceModelDTO>();
    }

}
