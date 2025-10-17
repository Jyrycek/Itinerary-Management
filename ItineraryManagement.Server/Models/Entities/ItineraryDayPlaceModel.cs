using System.Text.Json.Serialization;

namespace ItineraryManagement.Server.Models.Entities
{
    public class ItineraryDayPlaceModel
    {
        public int Order { get; set; }
        public int ItineraryDayId { get; set; }

        [JsonIgnore]
        public ItineraryDay? ItineraryDay { get; set; }
        public int PlaceId { get; set; }
        [JsonIgnore]
        public PlaceModel? Place { get; set; }
    }
    public class ItineraryWithDaysAndPlacesDto
    {
        public int Id { get; set; }
        public int ProjectId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public List<ItineraryDayDto> ItineraryDays { get; set; } = new List<ItineraryDayDto>();
    }
}
