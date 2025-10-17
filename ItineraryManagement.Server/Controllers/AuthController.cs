using ItineraryManagement.Server.Models.Entities;
using ItineraryManagement.Server.Services;
using Microsoft.AspNetCore.Mvc;

namespace ItineraryManagement.Server.Controllers
{
    [Route("api/auth/"), ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AuthService _authService;
        public AuthController(AuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("register")]
        public async Task<ActionResult> Register(RegisterModel model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var (result, message) = await _authService.RegisterAsync(model);
            if (result)
            {
                return Ok();
            }

            if (!string.IsNullOrEmpty(message))
            {
                return Conflict(new { message });
            }

            return StatusCode(500, new { message = "Nastala interní chyba při registraci" });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginModel model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var (success, message) = await _authService.LoginAsync(model);

            if (success)
            {
                return Ok(new { token = message });
            }

            if (message.Contains("Nastala interní chyba při přihlašování"))
            {
                return StatusCode(500, new { message });
            }

            return Unauthorized(new { message });
        }
    }
}
