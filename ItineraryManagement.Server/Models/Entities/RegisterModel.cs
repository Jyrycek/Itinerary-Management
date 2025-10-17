using System.ComponentModel.DataAnnotations;

namespace ItineraryManagement.Server.Models.Entities
{
    public class RegisterModel
    {
        [Required(ErrorMessage = "Uživatelské jméno je povinné")]
        [MinLength(3, ErrorMessage = "Uživatelské jméno musí obsahovat aspoň 3 znaky")]
        [MaxLength(100, ErrorMessage = "Uživatelské jméno nesmí obsahovat víc jak 100 znaků")]
        public string Username { get; set; } = string.Empty;

        [Required(ErrorMessage = "Heslo je povinné")]
        [MinLength(5, ErrorMessage = "Heslo musí obsahovat aspoň 5 znaků")]
        public string Password { get; set; } = string.Empty;

        [Required(ErrorMessage = "Jméno je povinné")]
        public string FirstName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Příjmení je povinné")]
        public string LastName { get; set; } = string.Empty;

        [Required(ErrorMessage = "E-emailová adresa je povinná")]
        [EmailAddress(ErrorMessage = "Nesprávný formát e-mailové adresy")]
        public string Email { get; set; } = string.Empty;
    }
}
