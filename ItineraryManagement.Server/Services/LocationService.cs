using Newtonsoft.Json.Linq;
using System.Globalization;
using FuzzySharp;
using System.Diagnostics;
using ItineraryManagement.Server.Models.Nominatim;
using ItineraryManagement.Server.Exceptions;

namespace ItineraryManagement.Server.Services
{
    public class LocationService
    {
        private readonly HttpClient _httpClient;

        private const double Epsilon = 1e-9;

        public LocationService(HttpClient httpClient)
        {
            _httpClient = httpClient;
            _httpClient.DefaultRequestHeaders.Add("User-Agent", "ItineraryManagement/1.0");
        }

        public async Task<NominatimResponse> GetFullNominatimDataAsync(string placeName, double minLng, double minLat, double maxLng, double maxLat)
        {
            var url = $"https://nominatim.openstreetmap.org/search?q={Uri.EscapeDataString(placeName)}" +
                      $"&format=json&bounded=1&extratags=1" +
                      $"&viewbox={minLng.ToString(CultureInfo.InvariantCulture)}," +
                      $"{maxLat.ToString(CultureInfo.InvariantCulture)}," +
                      $"{maxLng.ToString(CultureInfo.InvariantCulture)}," +
                      $"{minLat.ToString(CultureInfo.InvariantCulture)}" +
                      $"&accept-language=cs,en,*";

            try
            {
                var response = await _httpClient.GetStringAsync(url);
                var json = JArray.Parse(response);

                if (json.Count == 0) return new NominatimResponse();

                var firstResult = json[0];

                var nominatimResponse = new NominatimResponse
                {
                    Longitude = firstResult.Value<double>("lon"),
                    Latitude = firstResult.Value<double>("lat"),
                    OsmType = firstResult.Value<string>("osm_type") ?? "unknown",
                    OsmId = firstResult.Value<long?>("osm_id") ?? 0
                };

                var extraTags = firstResult["extratags"] as JObject;
                if (extraTags != null)
                {
                    nominatimResponse.Website = extraTags.Value<string>("website");
                    nominatimResponse.OpeningHours = extraTags.Value<string>("opening_hours");
                }

                if (string.IsNullOrEmpty(nominatimResponse.Website) || string.IsNullOrEmpty(nominatimResponse.OpeningHours))
                {
                    await AddOsmTagsAsync(nominatimResponse);
                }

                return nominatimResponse;
            }
            catch (Exception)
            {
                return new NominatimResponse();
            }
        }

        public async Task<(double Longitude, double Latitude, string? usedLanguage, string? pageId)> GetCoordinatesFromWikipediaAsync(
    string placeName, double minLng, double minLat, double maxLng, double maxLat)
        {
            string[] languages = { "cs", "en" };
            string? bestMatchPageId = null;
            double bestMatchScore = 0;
            double bestLongitude = 0;
            double bestLatitude = 0;
            string? bestUsedLanguage = null;

            foreach (var language in languages)
            {
                var searchResults = await SearchWikipediaForPageIdsAsync(placeName, language);
                if (searchResults == null) continue;

                int checkedPages = 0;
                bool foundInBoundingBox = false;

                foreach (var pageId in searchResults)
                {
                    if (checkedPages > 3) break;

                    var (longitude, latitude, pageName) = await GetCoordinatesFromPageIdAsync(pageId, language);
                    if (Math.Abs(longitude) < Epsilon && Math.Abs(latitude) < Epsilon) continue;

                    double matchScore = CalculateFuzzyMatch(placeName, pageName);

                    //Pokud je podobnost 100%, ale není v bouding boxu, tak vrátíme null, protože by to akorát našlo nepravděpodobný výsledek a nebo by to hledalo zbytečně
                    if (Math.Abs(matchScore - 1.0) < Epsilon)
                    {
                        if (IsWithinBoundingBox(longitude, latitude, minLng, minLat, maxLng, maxLat))
                        {
                            return (longitude, latitude, language, pageId);
                        }
                        return (0, 0, null, null);
                    }

                    if (IsWithinBoundingBox(longitude, latitude, minLng, minLat, maxLng, maxLat))
                    {
                        if (matchScore > bestMatchScore)
                        {
                            bestMatchScore = matchScore;
                            bestLongitude = longitude;
                            bestLatitude = latitude;
                            bestMatchPageId = pageId;
                            bestUsedLanguage = language;
                        }

                        foundInBoundingBox = true;
                        break;
                    }
                    checkedPages++;
                }

                if (foundInBoundingBox)
                {
                    continue; //useless - analyze
                }
            }

            if (bestMatchScore < 0.35)
            {
                return (0, 0, null, null);
            }

            return bestMatchPageId != null
                ? (bestLongitude, bestLatitude, bestUsedLanguage, bestMatchPageId)
                : (0, 0, null, null); 
        }

        private static bool IsWithinBoundingBox(double lon, double lat, double minLng, double minLat, double maxLng, double maxLat)
        {
            return lon >= minLng && lon <= maxLng && lat >= minLat && lat <= maxLat;
        }


        private async Task<List<string>?> SearchWikipediaForPageIdsAsync(string placeName, string language)
        {
            var searchUrl = $"https://{language}.wikipedia.org/w/api.php?action=query&list=search&srsearch={placeName}&format=json";
            var searchResponse = await _httpClient.GetStringAsync(searchUrl);
            var searchJson = JObject.Parse(searchResponse);

            return searchJson["query"]?["search"]?
                .Select(s => s["pageid"]?.ToString())
                .Where(id => !string.IsNullOrEmpty(id))
                .Cast<string>()
                .ToList() ?? new List<string>();
        }


        private async Task<(double Longitude, double Latitude, string PageName)> GetCoordinatesFromPageIdAsync(string pageId, string language)
        {
            var coordinatesUrl = $"https://{language}.wikipedia.org/w/api.php?action=query&prop=coordinates&format=json&pageids={pageId}";
            var coordinatesResponse = await _httpClient.GetStringAsync(coordinatesUrl);
            var coordinatesJson = JObject.Parse(coordinatesResponse);

            var pages = coordinatesJson["query"]?["pages"];
            if (pages != null)
            {
                var page = pages[pageId];
                var coords = page?["coordinates"]?.FirstOrDefault();
                var pageName = page?["title"]?.ToString() ?? string.Empty;

                if (coords != null)
                {
                    double longitude = coords.Value<double>("lon");
                    double latitude = coords.Value<double>("lat");

                    return (longitude, latitude, pageName);
                }
            }

            return (0, 0, string.Empty);
        }

        private static double CalculateFuzzyMatch(string source, string target)
        {
            return Fuzz.Ratio(source, target) / 100.0;
        }

        private async Task AddOsmTagsAsync(NominatimResponse location)
        {
            string osmTypeShort = location.OsmType switch
            {
                "node" => "node",
                "way" => "way",
                "relation" => "relation",
                _ => "unknown"
            };

            if (osmTypeShort == "unknown")
                return;

            string url = $"https://www.openstreetmap.org/api/0.6/{osmTypeShort}/{location.OsmId}.json";

            try
            {
                var response = await _httpClient.GetStringAsync(url);
                var json = JObject.Parse(response);

                var tags = json["elements"]?[0]?["tags"] as JObject;

                if (tags != null)
                {
                    location.Tags = tags.ToObject<Dictionary<string, string>>() ?? new Dictionary<string, string>();
                }
            }
            catch (Exception ex)
            {
                throw new OsmTagFetchException($"Chyba při získávání OSM tagů z {url}", ex);
            }
        }
    }
}
