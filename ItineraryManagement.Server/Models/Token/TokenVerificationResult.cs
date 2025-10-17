using System.Text.Json.Serialization;

namespace ItineraryManagement.Server.Models.Token
{
    public class TokenVerificationResult
    {
        [JsonPropertyName("isvalid")]
        public bool IsValid { get; set; }
    }
}
