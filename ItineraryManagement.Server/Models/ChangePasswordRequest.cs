using System.ComponentModel.DataAnnotations;

namespace ItineraryManagement.Server.Models
{
    public class ChangePasswordRequestModel
    {
        [Required(ErrorMessage = "Současné heslo je povinné")]
        public string currentPassword { get; set; } = string.Empty;

        [Required(ErrorMessage = "Nové heslo je povinné")]
        [MinLength(5, ErrorMessage = "Nové heslo musí obsahovat aspoň 5 znaků")]
        public string newPassword { get; set; } = string.Empty;
    }
}
