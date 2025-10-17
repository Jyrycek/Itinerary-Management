using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ItineraryManagement.Server.Models.Entities
{
    public class Tag
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Color { get; set; } = string.Empty;
        public List<PlaceTagModel> PlaceTags { get; set; } = new List<PlaceTagModel>();
    }

    public class TagModelDTO
    {
        public int Id { get; set; }

        [Required(ErrorMessage = "Název je povinný")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "Barva je povinná")]
        [RegularExpression("^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$", ErrorMessage = "Nesprávný formát barvy")]
        public string? Color { get; set; } = string.Empty;
    }

    public class PlaceTagModel
    {
        public int PlaceId { get; set; }

        public int TagId { get; set; }
        [JsonIgnore]
        public PlaceModel? Place { get; set; }

        public Tag? Tag { get; set; }
    }
}
