using ItineraryManagement.Server.Models.Entities;
using System.ComponentModel.DataAnnotations;

namespace ItineraryManagement.Server.Models
{
    public class PlaceModel
    {
        public int Id { get; set; }
        public int ProjectId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; } = string.Empty;
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public int Order { get; set; } = 0;
        public int? VisitDuration { get; set; }
        public string? Website { get; set; }
        public string? OpeningHours { get; set; }
        public List<PlaceImageModel> PlaceImages { get; set; } = new List<PlaceImageModel>();
        public ProjectModel Project { get; set; } = new ProjectModel();
        public List<PlaceTagModel> PlaceTags { get; set; } = new List<PlaceTagModel>();

        public List<ItineraryDayPlaceModel> ItineraryDayPlaces { get; set; } = new List<ItineraryDayPlaceModel>();
    }
    public class PlaceImageModel
    {
        public int Id { get; set; }
        public int PlaceId { get; set; }
        public string? ImageUrl { get; set; }

        public PlaceModel Place { get; set; } = new PlaceModel();
    }
    public class PlaceImageModelDTO
    {
        public int? Id { get; set; }
        public string? ImageUrl { get; set; } = string.Empty;
    }

    public class PlaceModelDTO
    {
        public int Id { get; set; }

        [Required(ErrorMessage = "Název místa je povinný")]
        [MaxLength(100, ErrorMessage = "Název místa nesmí překročit 100 znaků")]
        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; } = string.Empty;
        public int? VisitDuration { get; set; }

        [Range(-90, 90, ErrorMessage = "Zeměpisná šířka musí být mezi -90 a 90 stupni")]
        public double Latitude { get; set; }

        [Range(-180, 180, ErrorMessage = "Zeměpisná délka musí být mezi -180 a 180 stupni")]
        public double Longitude { get; set; }
        public int Order { get; set; }
        public string? Website { get; set; }
        public string? OpeningHours { get; set; }
        public List<PlaceImageModelDTO>? PlaceImages { get; set; } = new List<PlaceImageModelDTO>();

        public List<TagModelDTO> Tags { get; set; } = new List<TagModelDTO>();
    }
}
