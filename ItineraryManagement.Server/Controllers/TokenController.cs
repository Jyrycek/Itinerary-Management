using ItineraryManagement.Server.Models.Token;
using ItineraryManagement.Server.Services;
using Itinero.Algorithms;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Text;
using System.Text.Json;

namespace ItineraryManagement.Server.Controllers
{
    [Route("api/token"), ApiController]
    public class TokenController : ControllerBase
    {
        private readonly string _privateKey;

        private readonly AuthService _authService;

        public TokenController(AuthService authService, IOptions<AppSettings> config)
        {
            this._authService = authService;
            _privateKey = config.Value.JwtPrivateKey;
        }

        [HttpPost("verify-token")]
        [ProducesResponseType(typeof(TokenVerificationResult), StatusCodes.Status200OK)]
        public IActionResult VerifyToken([FromBody] object data)
        {
            var jsonElement = (JsonElement)data;
            string token;

            if (jsonElement.TryGetProperty("token", out var tokenProperty))
            {
                token = tokenProperty.GetString()!;
            }
            else
            {
                return Ok(new { isvalid = false });
            }

            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(_privateKey);

            try
            {
                tokenHandler.ValidateToken(token, new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidIssuer = "ItineraryManagement.Server",
                    ValidAudience = "ItineraryManagement.Client"

                }, out _);

                // Token je platný
                return Ok(new TokenVerificationResult { IsValid = true });
            }
            catch
            {
                // Došlo k chybě při ověřování tokenu
                return Ok(new TokenVerificationResult { IsValid = false });
            }
        }

        [HttpPost("refresh-token"), Authorize]
        public async Task<IActionResult> RefreshToken()
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

            string? token = await _authService.RefreshToken(userId);

            if (token == null)
            {
                return BadRequest();
            }

            return Ok(new { token });
        }
    }
}
