using System.ComponentModel.DataAnnotations;

namespace ItineraryManagement.Server.Models
{
    public class PasswordResetRequestModel
    {
        [Required(ErrorMessage = "E-emailová adresa je povinná")]
        [EmailAddress(ErrorMessage = "Nesprávný formát e-mailové adresy")]
        public string Email { get; set; } = string.Empty;
    }

}
