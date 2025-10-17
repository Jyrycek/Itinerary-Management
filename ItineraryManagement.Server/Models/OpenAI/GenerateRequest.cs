using System.ComponentModel.DataAnnotations;

namespace ItineraryManagement.Server.Models.OpenAI
{
    public class GenerateRequest
    {
        [Required(ErrorMessage = "Title is required")]
        public string Title { get; set; }

        [Range(-180, 180, ErrorMessage = "Longitude must be between -180 and 180")]
        public double Longitude { get; set; }

        [Range(-90, 90, ErrorMessage = "Latitude must be between -90 and 90")]
        public double Latitude { get; set; }
    }
}
