using ItineraryManagement.Server.Exceptions;
using ItineraryManagement.Server.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace ItineraryManagement.Server.Services
{
    public class AuthService
    {
        private readonly string _privateKey;
        private readonly string _passwordKey;
        private readonly string _defaultProfileImageUrl;
        private readonly string _containerRoot;

        private readonly DatabaseManager _database;
        private readonly UploadService _uploadService;

        public AuthService(DatabaseManager database, UploadService uploadService, IOptions<AppSettings> config)
        {
            _database = database;
            _uploadService = uploadService;
            _privateKey = config.Value.JwtPrivateKey;
            _passwordKey = config.Value.PasswordKey;
            _defaultProfileImageUrl = config.Value.Images.DefaultProfileImageUrl;
            _containerRoot = config.Value.BlobStorage.ContainerRoot;
        }

        public static int GetUserIdFromContext(HttpContext httpContext)
        {
            var user = httpContext.User;
            if (user == null || user.Identity == null || !user.Identity.IsAuthenticated)
            {
                throw new UnauthorizedAccessException("User not authenticated");
            }

            var userIdClaim = user.Claims.FirstOrDefault(c => c.Type == "id");
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                throw new UnauthorizedAccessException("Invalid user ID");
            }

            return userId;
        }

        public async Task<(bool success, string message)> RegisterAsync(RegisterModel model)
        {
            bool emailTaken = await _database.IsEmailTakenAsync(model.Email);
            if (emailTaken)
            {
                return (false, "Zadaný e-mail již existuje");
            }

            bool usernameTaken = await _database.IsUsernameTakenAsync(model.Username);
            if (usernameTaken)
            {
                return (false, "Zadané uživatelské jméno již existuje");
            }

            User user = new User
            {
                Username = model.Username,
                FirstName = model.FirstName,
                LastName = model.LastName,
                Email = model.Email,
                PasswordHash = PasswordHasher.HashPassword(model.Password),
                ProfileImageUrl = _defaultProfileImageUrl
            };

            bool addUserResult = await _database.AddUserAsync(user);
            if (addUserResult)
            {
                return (true, string.Empty);
            }

            return (false, "Nastala interní chyba při registraci");
        }

        public async Task<(bool success, string message)> LoginAsync(LoginModel model)
        {
            try
            {
                User? user = await _database.GetUserByUsernameAsync(model.Username);

                if (user == null || !PasswordHasher.VerifyPassword(model.Password, user.PasswordHash))
                {
                    return (false, "Uživatelské jméno nebo heslo není správné");
                }

                string token = GenerateToken(user);
                return (true, token);
            }
            catch (Exception)
            {
                return (false, "Nastala interní chyba při přihlašování");
            }
        }
        public async Task<User?> getUserAsync(int userId)
        {
            return await _database.GetUserById(userId);
        }

        public async Task<UserDTO?> getUserDTOAsync(int userId)
        {
            User? user = await _database.GetUserById(userId);

            if (user == null)
            {
                return null;
            }

            string? profileImageUrl = user.ProfileImageUrl;

            if (!string.IsNullOrEmpty(profileImageUrl))
            {
                Uri blobUri = new Uri(profileImageUrl);
                string blobName = blobUri.AbsolutePath.TrimStart('/');
                blobName = blobName.Replace(_containerRoot, "");

                string sasTokenUrl = _uploadService.GenerateSasToken(blobName);

                profileImageUrl = sasTokenUrl;
            }

            return new UserDTO
            {
                Username = user.Username,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                Role = user.Role,
                CreatedAt = user.CreatedAt,
                ProfileImageUrl = profileImageUrl
            };
        }

        public async Task<string?> RefreshToken(int userId)
        {
            User? user = await _database.GetUserById(userId);

            if (user == null)
            {
                return null;
            }
            string token = GenerateToken(user);

            return token;
        }

        private string GenerateToken(User user)
        {
            var handler = new JwtSecurityTokenHandler();

            var privateKey = Encoding.UTF8.GetBytes(_privateKey);

            var credentials = new SigningCredentials(
                        new SymmetricSecurityKey(privateKey),
                        SecurityAlgorithms.HmacSha256);


            ClaimsIdentity claimsIdentity = new ClaimsIdentity();
            claimsIdentity.AddClaim(new Claim("id", user.Id.ToString()));
            claimsIdentity.AddClaim(new Claim(ClaimTypes.Name, user.Username));
            claimsIdentity.AddClaim(new Claim("firstName", Convert.ToBase64String(Encoding.UTF8.GetBytes(user.FirstName))));
            claimsIdentity.AddClaim(new Claim("lastName", Convert.ToBase64String(Encoding.UTF8.GetBytes(user.LastName))));
            claimsIdentity.AddClaim(new Claim(ClaimTypes.Email, user.Email));
            claimsIdentity.AddClaim(new Claim(ClaimTypes.Role, user.Role));

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                SigningCredentials = credentials,
                Expires = DateTime.UtcNow.AddMinutes(90),
                Subject = claimsIdentity,
                Audience = "ItineraryManagement.Client",
                Issuer = "ItineraryManagement.Server"
            };

            var token = handler.CreateToken(tokenDescriptor);
            return handler.WriteToken(token);
        }


        public async Task<bool> UpdateUserAsync(UserDTO user)
        {
            User? existingUser = await _database.GetUserByUsernameAsync(user.Username);
            if (existingUser == null)
            {
                return false;
            }

            bool isEmailTaken = await _database.IsEmailTakenByAnotherUserAsync(user.Email, existingUser.Id);
            if (isEmailTaken)
            {
                throw new InvalidOperationException("Tento email je již používán jiným uživatelem");
            }

            existingUser.FirstName = user.FirstName;
            existingUser.LastName = user.LastName;
            existingUser.Email = user.Email;

            return await _database.UpdateUserAsync(existingUser);
        }

        public async Task<bool> UpdateUserPasswordAsync(User user, string newPassword)
        {
            User? existingUser = await _database.GetUserByUsernameAsync(user.Username);
            if (existingUser == null)
            {
                return false;
            }

            existingUser.PasswordHash = PasswordHasher.HashPassword(newPassword);

            return await _database.UpdateUserAsync(existingUser);
        }

        private string GeneratePasswordResetToken(User user)
        {
            var handler = new JwtSecurityTokenHandler();
            var privateKey = Encoding.UTF8.GetBytes(_privateKey);

            var oldPasswordHash = user.PasswordHash[..8];
            var uniqueString = _passwordKey;
            var combinedString = oldPasswordHash + uniqueString;

            var combinedHash = PasswordHasher.HashPassword(combinedString);

            var credentials = new SigningCredentials(
                new SymmetricSecurityKey(privateKey),
                SecurityAlgorithms.HmacSha256);

            ClaimsIdentity claimsIdentity = new ClaimsIdentity();
            claimsIdentity.AddClaim(new Claim(ClaimTypes.Email, user.Email));
            claimsIdentity.AddClaim(new Claim("tokenType", "password-reset"));
            claimsIdentity.AddClaim(new Claim("passwordHashPart", combinedHash));

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                SigningCredentials = credentials,
                Expires = DateTime.UtcNow.AddMinutes(5),
                Subject = claimsIdentity,
                Audience = "ItineraryManagement.Client",
                Issuer = "ItineraryManagement.Server"
            };

            var token = handler.CreateToken(tokenDescriptor);
            return handler.WriteToken(token);
        }

        public async Task<User?> GetUserByEmailAsync(string email)
        {
            return await _database.Users.FirstOrDefaultAsync(u => u.Email == email);
        }

        public async Task<string> GeneratePasswordResetTokenAsync(User user)
        {
            var token = GeneratePasswordResetToken(user);

            return await Task.FromResult(token);
        }

        public async Task<bool> ValidatePasswordResetTokenAsync(string token, string email)
        {
            User? user = await _database.GetUserByUsernameByEmailAsync(email);
            if (user == null)
            {
                return false;
            }

            var key = Encoding.UTF8.GetBytes(_privateKey);

            var tokenHandler = new JwtSecurityTokenHandler();
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
                }, out SecurityToken validatedToken);

                var jwtToken = (JwtSecurityToken)validatedToken;

                var emailClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == "email")?.Value;
                var tokenTypeClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == "tokenType")?.Value;
                var tokenHashClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == "passwordHashPart")?.Value;

                var oldPasswordHash = user.PasswordHash[..8];
                var uniqueString = _passwordKey;
                var combinedString = oldPasswordHash + uniqueString;

                var expectedHash = PasswordHasher.HashPassword(combinedString);

                if (tokenHashClaim != expectedHash)
                {
                    throw new PasswordAlreadyChangedException();
                }

                if (emailClaim != email || tokenTypeClaim != "password-reset")
                {
                    throw new InvalidTokenException("Nastala chyba při ověřování");
                }

                return true;
            }
            catch (SecurityTokenExpiredException)
            {
                throw new TokenExpiredException();
            }
            catch (Exception)
            {
                throw new InvalidTokenException("Nastala chyba při ověřování");
            }
        }
    }
}