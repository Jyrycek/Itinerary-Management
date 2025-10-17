using ItineraryManagement.Server.Exceptions;
using ItineraryManagement.Server.Models;
using ItineraryManagement.Server.Models.Entities;
using ItineraryManagement.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace ItineraryManagement.Server.Controllers
{
    [Route("api/user"), ApiController]
    public class UserController : ControllerBase
    {
        private readonly AuthService _authService;
        private readonly EmailService _emailService;
        private readonly UploadService _uploadService;
        private readonly DashboardService _dashboardService;

        private readonly string _profileImagesPath;
        public UserController(AuthService authService, EmailService emailService, UploadService uploadService, DashboardService dashboardService, IOptions<AppSettings> config)
        {
            _authService = authService;
            _emailService = emailService;
            _uploadService = uploadService;
            _dashboardService = dashboardService;
            _profileImagesPath = config.Value.BlobStorage.ProfileImagesPath;
        }

        [HttpGet("get-user"), Authorize]
        public async Task<IActionResult> GetUser()
        {
            int userId;
            try
            {
                userId = AuthService.GetUserIdFromContext(HttpContext);
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized();
            }

            UserDTO? databaseUser = await _authService.getUserDTOAsync(userId);

            if (databaseUser == null)
            {
                return BadRequest();
            }

            return Ok(databaseUser);
        }

        [HttpPost("change-password"), Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequestModel request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            int userId;
            try
            {
                userId = AuthService.GetUserIdFromContext(HttpContext);
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized();
            }

            User? user = await _authService.getUserAsync(userId);

            if (user == null)
            {
                return StatusCode(500, new { message = "Nastala interní chyba" });
            }

            if (!PasswordHasher.VerifyPassword(request.currentPassword, user.PasswordHash))
            {
                return Conflict(new { message = "Původní heslo není správné" });
            }

            bool result = await _authService.UpdateUserPasswordAsync(user, request.newPassword);
            if (result)
            {
                return Ok();
            }

            return StatusCode(500, new { message = "Nastala interní chyba při změně hesla" });
        }


        [HttpPut("update-user"), Authorize]
        public async Task<ActionResult> updateUser([FromBody] UserDTO user)
        {
            try
            {
                AuthService.GetUserIdFromContext(HttpContext);
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized();
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                bool result = await _authService.UpdateUserAsync(user);
                if (result)
                {
                    return Ok();
                }

                return StatusCode(500, new { message = "Nastala chyba při úpravě údajů" });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("request-password-reset")]
        public async Task<IActionResult> RequestPasswordReset([FromBody] PasswordResetRequestModel model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var user = await _authService.GetUserByEmailAsync(model.Email);
            if (user == null)
            {
                return NotFound(new { Message = "Uživatel se zadanou e-mailovou adresou neexistuje" });
            }

            var token = await _authService.GeneratePasswordResetTokenAsync(user);
            var resetLink = $"{Request.Scheme}://{Request.Host}/password-reset?token={token}&email={model.Email}";

            if (resetLink == null)
            {
                return StatusCode(500, new { Message = "Došlo k chybě při odesílání e-mailu" });
            }

            try
            {
                await _emailService.SendPasswordResetEmailAsync(model.Email, resetLink);
            }
            catch (EmailSendingException ex)
            {
                return StatusCode(500, new { Message = $"Nepodařilo se odeslat e-mail. Zkuste to prosím znovu později. Error: {ex}" });
            }
            catch (Exception)
            {
                return StatusCode(500, new { Message = "Došlo k interní chybě serveru" });
            }

            return Ok(new { Message = "E-mail s pokyny k obnovení hesla byl odeslán" });
        }

        [HttpPost("create-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordModel model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var isValidToken = await _authService.ValidatePasswordResetTokenAsync(model.Token, model.Email);
                if (!isValidToken)
                {
                    return BadRequest(new { message = "Token je neplatný." });
                }
            }
            catch (TokenExpiredException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (PasswordAlreadyChangedException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (InvalidTokenException ex)
            {
                return BadRequest(new { message = ex.Message });
            }

            var user = await _authService.GetUserByEmailAsync(model.Email);
            if (user == null)
            {
                return BadRequest(new { message = "Uživatel nebyl nalezen" });
            }

            await _authService.UpdateUserPasswordAsync(user, model.NewPassword);

            return Ok();
        }

        [HttpPost("update-profile-image")]
        public async Task<IActionResult> UpdateProfileImage(IFormFile file)
        {
            int userId;
            try
            {
                userId = AuthService.GetUserIdFromContext(HttpContext);
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized();
            }

            string validationMessage = string.Empty;
            if (!UploadService.ValidateImage(file, out validationMessage))
            {
                return BadRequest(validationMessage);
            }

            using var memoryStream = new MemoryStream();
            await file.CopyToAsync(memoryStream);
            memoryStream.Position = 0;

            string? oldImageUrl = await _dashboardService.GetOldProfilePictureUrl(userId);

            if (!string.IsNullOrEmpty(oldImageUrl))
            {
                int startIndex = oldImageUrl.IndexOf($"/{_profileImagesPath}");
                oldImageUrl = oldImageUrl.Substring(startIndex);
                await _uploadService.DeleteAsync(oldImageUrl);
            }

            var fileName = $"{_profileImagesPath}/{userId}/{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";

            var blobUrl = await _uploadService.UploadAsync(memoryStream, fileName, file.ContentType);

            bool successful = await _dashboardService.UpdateUserProfilePicture(userId, blobUrl);

            if (!successful)
            {
                return BadRequest();
            }
            return Ok();
        }
    }
}
