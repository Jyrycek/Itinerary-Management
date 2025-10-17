using System.ComponentModel.DataAnnotations;

namespace ItineraryManagement.Server.Models
{
    public class ResetPasswordModel
    {
        [Required]
        public string Token { get; set; } = string.Empty;

        [Required]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Nové heslo je povinné")]
        [MinLength(5, ErrorMessage = "Nové heslo musí obsahovat aspoň 5 znaků")]
        public string NewPassword { get; set; } = string.Empty;
    }
}
