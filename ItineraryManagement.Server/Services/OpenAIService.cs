using ItineraryManagement.Server.Services;
using Microsoft.SemanticKernel.Connectors.OpenAI;
using Microsoft.SemanticKernel;
using Newtonsoft.Json;
using OpenAI.Chat;
using ItineraryManagement.Server.Models.Nominatim;
using ItineraryManagement.Server.Models.OpenAI;
using ItineraryManagement.Server.Models.OverpassApi;

namespace ItineraryManagement.Server.Services
{

    public class OpenAIService
    {
        private readonly ChatClient _chatClient;
        private readonly LocationService _locationService;
        private readonly Kernel _kernel;

        private const double Epsilon = 1e-9;

        public OpenAIService(LocationService locationService, IConfiguration configuration)
        {
            var apiKey = configuration["OpenAI"]
               ?? throw new ArgumentNullException(nameof(configuration), "OpenAI API klíč nebyl nalezen v konfiguraci (Key Vault)");

            _chatClient = new ChatClient(model: "gpt-4o", apiKey: apiKey);
            _locationService = locationService;

            _kernel = Kernel.CreateBuilder().AddOpenAIChatCompletion(
                modelId: "gpt-4o",
                apiKey: (apiKey)).Build();
        }


        public async Task<string> GetOpenAiResponse(string title, double longitude, double latitude)
        {
            var messages = new List<ChatMessage>
        {
            new SystemChatMessage("Jsi nápomocný asistent, který poskytuje krátké popisy míst v češtině."),
            new UserChatMessage($"Popiš místo: {title} na souřadnicích: {latitude}, {longitude}")
        };

            var chatOptions = new ChatCompletionOptions
            {
                MaxOutputTokenCount = 150,
            };

            var completion = await _chatClient.CompleteChatAsync(messages, chatOptions);

            if (completion is not null && completion.Value.Content.Count > 0)
            {
                return completion.Value.Content[0].Text;
            }

            return "Žádná odpověď nebyla vygenerována";
        }

        public async Task<List<LocationResponse>> GetTouristPlacesInBounds(double minLng, double minLat, double maxLng, double maxLat, List<string> existingPlaceNames, string userQuery, List<string> administration)
        {
            //jsonSchema se da udelat přímo z třídy GeneratedPlacesResponse
            ChatResponseFormat chatResponseFormat = ChatResponseFormat.CreateJsonSchemaFormat(
                jsonSchemaFormatName: "tourist_places",
                jsonSchema: BinaryData.FromString("""
        {
            "type": "object",
            "properties": {
                "Places": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "Name": { "type": "string" },
                            "Longitude": { "type": "number" },
                            "Latitude": { "type": "number" },
                            "Description": { "type": "string" }
                        },
                        "required": ["Name", "Longitude", "Latitude", "Description"],
                        "additionalProperties": false
                    }
                }
            },
            "required": ["Places"],
            "additionalProperties": false
        }
        """),
       jsonSchemaIsStrict: true);

            var executionSettings = new OpenAIPromptExecutionSettings
            {
#pragma warning disable SKEXP0010
                ResponseFormat = chatResponseFormat
            };

            var placeType = string.IsNullOrWhiteSpace(userQuery) ? "turistická místa" : userQuery;

            var existingPlacesText = existingPlaceNames.Any()
            ? $" Nesmíš zahrnout následující místa: {string.Join(", ", existingPlaceNames)}."
            : "";

            var adminText = administration.Any() ? $" Administrativní celky v dané oblasti: {string.Join(", ", administration)}." : "";

            var prompt = $@"Poskytni seznam 10-20 {placeType} v oblasti mezi souřadnicemi (bounding box):
    MinLng: {minLng}, MinLat: {minLat}, MaxLng: {maxLng}, MaxLat: {maxLat}.{adminText}{existingPlacesText}";

            GeneratedPlacesResponse? response;
            try
            {
                var result = await _kernel.InvokePromptAsync<string>(prompt, new(executionSettings));

                if (result == null) return [];

                response = JsonConvert.DeserializeObject<GeneratedPlacesResponse>(result);
            }
            catch (Exception)
            {
                return [];
            }

            if (response == null) return [];

            try
            {
                List<GeneratedPlaces> places = response.Places;

                double tolerance = 0.1;

                var tasks = places.Select(async place =>
                {
                    double originalLongitude = place.Longitude;
                    double originalLatitude = place.Latitude;

                    var (longitude, latitude, usedLang, pageId) =
                        await _locationService.GetCoordinatesFromWikipediaAsync(place.Name, minLng, minLat, maxLng, maxLat);

                    bool areCorsCertain = true;
                    NominatimResponse? nominatimResponse = null;

                    if (Math.Abs(longitude) < Epsilon && Math.Abs(latitude) < Epsilon)
                    {
                        nominatimResponse = await _locationService.GetFullNominatimDataAsync(place.Name, minLng, minLat, maxLng, maxLat);
                        if (nominatimResponse != null)
                        {
                            longitude = nominatimResponse.Longitude;
                            latitude = nominatimResponse.Latitude;
                        }
                        areCorsCertain = false;
                    }

                    if (Math.Abs(longitude) < Epsilon && Math.Abs(latitude) < Epsilon)
                    {
                        longitude = originalLongitude;
                        latitude = originalLatitude;
                    }

                    if (!IsWithinTolerance(longitude, latitude, minLng, minLat, maxLng, maxLat, tolerance))
                    {
                        return null;
                    }

                    return new LocationResponse
                    {
                        Elements = new List<Element>
                        {
                        new Element
                        {
                        Type = "node",
                        Lat = latitude,
                        Lon = longitude,
                        AreCoordinatesCertain = areCorsCertain,
                        Tags = new Tags
                        {
                            isPageId = pageId != null,
                            Name = place.Name,
                            Description = place.Description,
                            Website = nominatimResponse?.Website ?? "",
                            OpeningHours = nominatimResponse?.OpeningHours ?? "",
                            Wikipedia = (usedLang != null && pageId != null) ? $"{usedLang}:{pageId}" : null,
                        }
                    }
                }
                    };
                });
                var results = await Task.WhenAll(tasks);
                return results.OfType<LocationResponse>().ToList();
            }
            catch (Exception)
            {
                return [];
            }
        }

        private static bool IsWithinTolerance(double longitude, double latitude, double minLng, double minLat, double maxLng, double maxLat, double tolerance)
        {
            return !(Math.Abs(longitude) < Epsilon && Math.Abs(latitude) < Epsilon) &&
                   ((longitude >= minLng - tolerance && longitude <= maxLng + tolerance) &&
                    (latitude >= minLat - tolerance && latitude <= maxLat + tolerance));
        }
    }
}