using ItineraryManagement.Server.Exceptions.Wikidata;
using ItineraryManagement.Server.Models;
using ItineraryManagement.Server.Models.Wikipedia;
using Microsoft.Extensions.Caching.Memory;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Globalization;

namespace ItineraryManagement.Server.Services
{
    public class MapService
    {
        private readonly HttpClient _httpClient;
        private readonly IMemoryCache _cache;

        public MapService(HttpClient httpClient, IMemoryCache cache)
        {
            _httpClient = httpClient;
            _cache = cache;
        }
        public async Task<string?> GetOverpassDataAsync(string query, Proximity proximity)
        {
            string cacheKey = $"Overpass_{query}_{proximity.Latitude}_{proximity.Longitude}";

            if (_cache.TryGetValue(cacheKey, out string? cachedData))
            {
                return cachedData;
            }

            string overpassUrl = $"https://overpass-api.de/api/interpreter";
            try
            {
                string proximityParam = $"proximity={proximity.Longitude},{proximity.Latitude}";
                var content = new StringContent($"data={Uri.EscapeDataString(query)}&{proximityParam}", System.Text.Encoding.UTF8, "application/x-www-form-urlencoded");
                HttpResponseMessage response = await _httpClient.PostAsync(overpassUrl, content);
                response.EnsureSuccessStatusCode();

                var responseData = await response.Content.ReadAsStringAsync();
                _cache.Set(cacheKey, responseData, TimeSpan.FromMinutes(10));
                return responseData;
            }
            catch (Exception)
            {
                return null;
            }
        }

        public async Task<WikipediaData?> GetWikipediaDataAsync(string title, double latitude, double longitude)
        {
            string cacheKey = $"Wikipedia_{title}_{latitude}_{longitude}";

            if (_cache.TryGetValue(cacheKey, out WikipediaData? cachedData))
            {
                return cachedData;
            }

            var languageCodes = new[] { "cs", "en", "sk" };
            bool foundImages = false;
            List<string> images = new List<string>();

            foreach (var languageCode in languageCodes)
            {
                var summaryUrl = $"https://{languageCode}.wikipedia.org/api/rest_v1/page/summary/{Uri.EscapeDataString(title)}";
                var summaryResponse = await _httpClient.GetAsync(summaryUrl);

                if (summaryResponse.IsSuccessStatusCode)
                {
                    var summaryData = await summaryResponse.Content.ReadAsStringAsync();
                    var article = JsonConvert.DeserializeObject<WikipediaArticle>(summaryData);

                    if (article?.Thumbnail?.Source != null)
                    {
                        images.Add(article.Thumbnail.Source);
                        foundImages = true;
                    }

                    if (images.Count < 3)
                    {
                        var additionalImages = await GetWikipediaImagesAsync(title, languageCode);
                        images.AddRange(additionalImages);
                    }

                    images = images.Distinct().Take(3).ToList();

                    if (foundImages)
                    {
                        var wikipediaData = new WikipediaData
                        {
                            Article = article,
                            WikidataImage = images
                        };

                        _cache.Set(cacheKey, wikipediaData, TimeSpan.FromMinutes(10));
                        return wikipediaData;
                    }
                }
            }

            if (!foundImages)
            {
                try
                {
                    var wikidataImages = await GetWikidataImageAsync(title, latitude, longitude);
                    if (wikidataImages != null && wikidataImages.Any())
                    {
                        images = wikidataImages.Take(3).ToList();
                    }
                }
                catch (WikidataImageNotFoundException)
                {
                    return new WikipediaData
                    {
                        Article = null,
                        WikidataImage = images
                    };
                }

                return new WikipediaData
                {
                    Article = null,
                    WikidataImage = images
                };
            }
            return null;
        }


        public async Task<List<string>> GetWikipediaImagesAsync(string title, string languageCode)
        {
            var cacheKey = $"WikipediaImages_{title}_{languageCode}";
            if (_cache.TryGetValue(cacheKey, out List<string>? cachedImages))
            {
                return cachedImages ?? new List<string>();
            }

            var url = $"https://{languageCode}.wikipedia.org/w/api.php?action=query&titles={Uri.EscapeDataString(title)}&prop=images&format=json";

            var response = await _httpClient.GetAsync(url);
            if (!response.IsSuccessStatusCode) return new List<string>();

            var json = await response.Content.ReadAsStringAsync();
            var data = JObject.Parse(json);

            var imageTitles = data["query"]?["pages"]?.First?.First?["images"]
                ?.Select(img => img["title"]?.ToString())
                .Where(title => title != null && title.EndsWith(".jpg", StringComparison.OrdinalIgnoreCase))
                .Take(2)
                .ToList();

            if (imageTitles == null || imageTitles.Count == 0) return new List<string>();

            var imageUrls = new List<string>();

            foreach (var imageTitle in imageTitles)
            {
                if (string.IsNullOrEmpty(imageTitle)) continue;

                var imageUrl = await GetWikipediaImageUrlAsync(imageTitle, languageCode);
                if (!string.IsNullOrEmpty(imageUrl))
                {
                    imageUrls.Add(imageUrl);
                }
            }

            _cache.Set(cacheKey, imageUrls, TimeSpan.FromMinutes(10));
            return imageUrls;
        }

        public async Task<string?> GetWikipediaImageUrlAsync(string imageTitle, string languageCode)
        {
            var cacheKey = $"WikipediaImage_{languageCode}_{imageTitle}";

            if (_cache.TryGetValue(cacheKey, out string? cachedUrl))
            {
                return cachedUrl;
            }

            var url = $"https://{languageCode}.wikipedia.org/w/api.php?action=query&titles={Uri.EscapeDataString(imageTitle)}&prop=imageinfo&iiprop=url&format=json";

            var response = await _httpClient.GetAsync(url);
            if (!response.IsSuccessStatusCode) return null;

            var json = await response.Content.ReadAsStringAsync();
            var data = JObject.Parse(json);

            var imageUrl = data["query"]?["pages"]?.First?.First?["imageinfo"]?.First?["url"]?.ToString();

            if (!string.IsNullOrEmpty(imageUrl))
            {
                _cache.Set(cacheKey, imageUrl, TimeSpan.FromMinutes(10));
            }

            return imageUrl;
        }

        public async Task<List<string>> GetWikipediaImageByPageIdAsync(string pageId, double latitude, double longitude, string? languageCode = "en")
        {
            var cacheKey = $"WikipediaImages_{languageCode}_{pageId}";

            if (_cache.TryGetValue(cacheKey, out List<string>? cachedImages))
            {
                return cachedImages ?? new List<string>();
            }

            var url = $"https://{languageCode}.wikipedia.org/w/api.php?action=query&pageids={pageId}&prop=images&format=json";
            var response = await _httpClient.GetAsync(url);
            if (!response.IsSuccessStatusCode) return new List<string>();

            var json = await response.Content.ReadAsStringAsync();
            var data = JObject.Parse(json);

            var imageTitles = data["query"]?["pages"]?[pageId]?["images"]?
                .Select(img => img["title"]?.ToString())
                .Where(title => !string.IsNullOrEmpty(title))
                .Take(10)
                .ToList();

            if (imageTitles == null || !imageTitles.Any()) return new List<string>();

            var excludedKeywords = new[] { "flag", "coat of arms", "symbol", "logo", "emblem" };
            var filteredTitles = imageTitles.Where(title =>
                !excludedKeywords.Any(keyword => title!.IndexOf(keyword, StringComparison.OrdinalIgnoreCase) >= 0)).ToList();

            if (!filteredTitles.Any()) return new List<string>();

            var titlesQuery = string.Join("|", filteredTitles
                    .Where(title => !string.IsNullOrEmpty(title))
                    .Select(title => Uri.EscapeDataString(title!)));
            var imageInfoUrl = $"https://commons.wikimedia.org/w/api.php?action=query&titles={titlesQuery}&prop=imageinfo&iiprop=url|metadata&format=json";
            var imageResponse = await _httpClient.GetAsync(imageInfoUrl);

            if (!imageResponse.IsSuccessStatusCode) return new List<string>();

            var imageJson = await imageResponse.Content.ReadAsStringAsync();
            var imageData = JObject.Parse(imageJson);

            var images = new List<string>();
            foreach (var page in imageData["query"]?["pages"]!)
            {
                var imageUrl = page.First?["imageinfo"]?.First?["url"]?.ToString();
                var metadata = page.First?["imageinfo"]?.First?["metadata"];

                if (!string.IsNullOrEmpty(imageUrl) && metadata != null)
                {
                    double? imgLat = null, imgLon = null;

                    foreach (var meta in metadata)
                    {
                        var name = meta["name"]?.ToString();
                        var value = meta["value"]?.ToString();

                        if (name == "GPSLatitude") imgLat = ConvertToDecimalDegrees(value);
                        if (name == "GPSLongitude") imgLon = ConvertToDecimalDegrees(value);
                    }

                    if (imgLat.HasValue && imgLon.HasValue && IsNearby(latitude, longitude, imgLat.Value, imgLon.Value))
                    {
                        images.Add(imageUrl);
                    }
                }

                if (images.Count >= 3) break;
            }

            _cache.Set(cacheKey, images, TimeSpan.FromMinutes(10));
            return images;
        }

        private static bool IsNearby(double lat1, double lon1, double lat2, double lon2, double maxDistanceKm = 5.0)
        {
            const double EarthRadiusKm = 6371.0;
            var dLat = DegreesToRadians(lat2 - lat1);
            var dLon = DegreesToRadians(lon2 - lon1);
            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                    Math.Cos(DegreesToRadians(lat1)) * Math.Cos(DegreesToRadians(lat2)) *
                    Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
            return EarthRadiusKm * c <= maxDistanceKm;
        }

        private static double DegreesToRadians(double degrees) => degrees * Math.PI / 180.0;

        private static double? ConvertToDecimalDegrees(string? gpsValue)
        {
            if (string.IsNullOrEmpty(gpsValue)) return null;

            var parts = gpsValue.Split(',').Select(p => double.TryParse(p, out var v) ? v : (double?)null).ToArray();
            if (parts.Length < 3 || parts.Any(p => !p.HasValue)) return null;

            return parts[0] + (parts[1] / 60.0) + (parts[2] / 3600.0);
        }

        public async Task<List<string>?> GetWikidataImageAsync(string placeName, double latitude, double longitude)
        {
            var cacheKey = $"WikidataImages_{placeName}_{latitude}_{longitude}";

            if (_cache.TryGetValue(cacheKey, out List<string>? cachedImages))
            {
                return cachedImages ?? new List<string>();
            }

            var sparqlQuery = $@"
SELECT ?item ?itemLabel ?image ?location WHERE {{
  {{
    ?item rdfs:label ""{placeName}"". 
    OPTIONAL {{ ?item wdt:P18 ?image. }} 
  }}
  UNION 
  {{
    SERVICE wikibase:around {{
      ?item wdt:P625 ?location. 
      bd:serviceParam wikibase:center ""Point({longitude.ToString("G", CultureInfo.InvariantCulture)} {latitude.ToString("G", CultureInfo.InvariantCulture)})""^^geo:wktLiteral.
      bd:serviceParam wikibase:radius ""0.2"".
    }} 
    OPTIONAL {{ ?item wdt:P18 ?image. }} 
  }} 
  SERVICE wikibase:label {{ bd:serviceParam wikibase:language ""[AUTO_LANGUAGE],cs,en"" . }} 
}} 
LIMIT 10";

            var requestUrl = $"https://query.wikidata.org/sparql?query={Uri.EscapeDataString(sparqlQuery)}&format=json";

            using var httpClient = new HttpClient();
            httpClient.DefaultRequestHeaders.Add("User-Agent", "ItineraryManagement/1.0");

            try
            {
                var response = await httpClient.GetAsync(requestUrl);
                if (!response.IsSuccessStatusCode)
                {
                    throw new WikidataServiceException($"Wikidata API returned status code: {response.StatusCode}");
                }

                var responseData = await response.Content.ReadAsStringAsync();
                if (string.IsNullOrEmpty(responseData))
                {
                    throw new WikidataImageNotFoundException(placeName);
                }

                var sparqlResult = JsonConvert.DeserializeObject<dynamic>(responseData);
                if (sparqlResult?.results?.bindings == null)
                {
                    throw new WikidataImageNotFoundException(placeName);
                }

                var bindings = (IEnumerable<dynamic>)sparqlResult.results.bindings;
                if (!bindings.Any())
                {
                    throw new WikidataImageNotFoundException(placeName);
                }

                var imageResults = new List<(string image, double distance)>();

                foreach (var binding in bindings)
                {
                    var image = binding?.image?.value?.ToString() ?? string.Empty;
                    var location = binding?.location?.value?.ToString();

                    if (string.IsNullOrEmpty(image) || location == null)
                    {
                        continue;
                    }

                    var locationParts = location!.Replace("Point(", "").Replace(")", "").Split(' ');
                    if (locationParts.Length != 2) continue;
                    double imgLon = 0;
                    if (!double.TryParse(locationParts[1], NumberStyles.Float, CultureInfo.InvariantCulture, out double imgLat) ||
                        !double.TryParse(locationParts[0], NumberStyles.Float, CultureInfo.InvariantCulture, out imgLon))
                    {
                        continue;
                    }

                    double distance = GetDistance(latitude, longitude, imgLat, imgLon);
                    imageResults.Add((image, distance));
                }

                var finalImages = imageResults.OrderBy(i => i.distance).Select(i => i.image).Take(3).ToList();

                _cache.Set(cacheKey, finalImages, TimeSpan.FromMinutes(10));

                return finalImages;

            }
            catch (JsonException ex)
            {
                throw new WikidataServiceException("Error parsing JSON response from Wikidata API", ex);
            }
            catch (HttpRequestException ex)
            {
                throw new WikidataServiceException("Error while making HTTP request to Wikidata API", ex);
            }
        }

        private static double GetDistance(double latOrigin, double lonOrigin, double latDestination, double lonDestination)
        {
            var earthRadius = 6371e3;
            var radLatOrigin = latOrigin * Math.PI / 180;
            var radLatDestination = latDestination * Math.PI / 180;
            var deltaLat = (latDestination - latOrigin) * Math.PI / 180;
            var deltaLon = (lonDestination - lonOrigin) * Math.PI / 180;

            var a = Math.Sin(deltaLat / 2) * Math.Sin(deltaLat / 2) +
                    Math.Cos(radLatOrigin) * Math.Cos(radLatDestination) *
                    Math.Sin(deltaLon / 2) * Math.Sin(deltaLon / 2);
            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

            return earthRadius * c;
        }

        public static async Task<List<string>> GetAdministrativeAreas(double minLng, double minLat, double maxLng, double maxLat, int zoomLevel)
        {
            List<string> areaNames = new List<string>();

            string overpassQuery = zoomLevel < 3
    ? @"[out:json];
node['place'='continent']({minLat},{minLng},{maxLat},{maxLng});
out;
"
    : @"[out:json];
relation['admin_level'='{adminLevel}']({minLat},{minLng},{maxLat},{maxLng});
out center;
";

            minLng = Math.Max(-180, Math.Min(180, minLng));
            maxLng = Math.Max(-180, Math.Min(180, maxLng));

            overpassQuery = overpassQuery.Replace("{minLat}", minLat.ToString(CultureInfo.InvariantCulture))
                                    .Replace("{minLng}", minLng.ToString(CultureInfo.InvariantCulture))
                                    .Replace("{maxLat}", maxLat.ToString(CultureInfo.InvariantCulture))
                                    .Replace("{maxLng}", maxLng.ToString(CultureInfo.InvariantCulture));

            if (zoomLevel >= 3)
            {
                string[] adminLevels = zoomLevel switch
                {
                    <= 5 => new[] { "2" },
                    <= 8 => new[] { "4", "2" },
                    <= 11 => new[] { "6", "4", "2" },
                    _ => new[] { "8", "6", "4", "2" }
                };

                foreach (string adminLevel in adminLevels)
                {
                    string specificQuery = overpassQuery.Replace("{adminLevel}", adminLevel.ToString(CultureInfo.InvariantCulture));

                    string overpassUrl = $"https://overpass-api.de/api/interpreter?data={Uri.EscapeDataString(specificQuery)}";

                    using HttpClient client = new();
                    HttpResponseMessage response = await client.GetAsync(overpassUrl);

                    if (response.IsSuccessStatusCode)
                    {
                        string json = await response.Content.ReadAsStringAsync();
                        dynamic? result = JsonConvert.DeserializeObject(json);

                        if (result?.elements == null)
                        {
                            continue;
                        }

                        foreach (var element in result.elements)
                        {
                            if (element.tags != null && element.tags.name != null)
                            {
                                string name = (string)element.tags.name;
                                if (!areaNames.Contains(name))
                                {
                                    areaNames.Add(name);
                                }
                            }
                        }
                    }

                    if (areaNames.Count > 0)
                    {
                        break;
                    }
                }
            }
            else
            {
                string overpassUrl = $"https://overpass-api.de/api/interpreter?data={Uri.EscapeDataString(overpassQuery)}";

                using HttpClient client = new();
                HttpResponseMessage response = await client.GetAsync(overpassUrl);

                if (response.IsSuccessStatusCode)
                {
                    string json = await response.Content.ReadAsStringAsync();
                    dynamic? result = JsonConvert.DeserializeObject(json);

                    if (result?.elements != null)
                    {
                        foreach (var element in result.elements)
                        {
                            if (element.tags != null && element.tags.name != null)
                            {
                                string name = (string)element.tags.name;
                                if (!areaNames.Contains(name))
                                {
                                    areaNames.Add(name);
                                }
                            }
                        }
                    }
                }
            }
            return areaNames;
        }

    }
}
