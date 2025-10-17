using ItineraryManagement.Server.Helpers;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ItineraryManagement.Server.Models.Entities
{
    public class ProjectModel
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Title { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string? ImageUrl { get; set; } = string.Empty;
        public User User { get; set; } = new User();
        [JsonIgnore]
        public List<PlaceModel>? Places { get; set; } = new List<PlaceModel>();
        public ICollection<Itinerary> Itineraries { get; set; } = new List<Itinerary>();
    }
    public class ProjectModelDTO
    {
        public int UserId { get; set; }

        [Required(ErrorMessage = "Název je povinný")]
        [MaxLength(100, ErrorMessage = "Název může mít maximálně 100 znaků")]
        public string Title { get; set; } = string.Empty;

        [Required(ErrorMessage = "Počáteční datum je povinné")]
        public DateTime StartDate { get; set; }

        [Required(ErrorMessage = "Koncové datum je povinné")]
        [DateGreaterThan("StartDate", ErrorMessage = "Koncové datum musí být pozdější než počáteční datum")]
        public DateTime EndDate { get; set; }
    }
}
