using System.ComponentModel.DataAnnotations;

namespace ItineraryManagement.Server.Models
{
    public class BoundsRequest
    {
        public double MinLng { get; set; }
        public double MinLat { get; set; }
        public double MaxLng { get; set; }
        public double MaxLat { get; set; }
        public int Zoom { get; set; }
        public List<string>? ExistingPlaceNames { get; set; }

        [Required]
        [StringLength(200, ErrorMessage = "Dotaz nesmí přesáhnout 200 znaků.")]
        [RegularExpression(@"^[a-zA-Z0-9\s.,\-\(\)\u00C0-\u017F]*$", ErrorMessage = "Povolené znaky: písmena, čísla, mezery, čárky, tečky, pomlčky a závorky")]
        public string userQuery { get; set; } = string.Empty;
    }

}
