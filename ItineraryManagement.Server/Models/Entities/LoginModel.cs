using System.ComponentModel.DataAnnotations;

namespace ItineraryManagement.Server.Models.Entities
{
    public class LoginModel
    {
        [Required(ErrorMessage = "Uživatelské jméno je povinné")]
        [MinLength(3)]
        [MaxLength(100)]
        public string Username { get; set; } = string.Empty;

        [Required(ErrorMessage = "Heslo je povinné")]
        [MinLength(5)]
        public string Password { get; set; } = string.Empty;
    }
}
