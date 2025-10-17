using ItineraryManagement.Server.Exceptions.Wikidata;
using ItineraryManagement.Server.Models;
using ItineraryManagement.Server.Models.OverpassApi;
using ItineraryManagement.Server.Models.Wikipedia;
using ItineraryManagement.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using Newtonsoft.Json;

namespace ItineraryManagement.Server.Controllers
{
    [Route("api/overpass"), ApiController, Authorize]
    public class OverpassController : ControllerBase
    {
        private readonly MapService _mapService;
        public OverpassController(MapService mapService)
        {
            _mapService = mapService;
        }

        [HttpPost("overpass-data")]
        public async Task<IActionResult> GetOverpassData([FromBody] OverpassRequest request)
        {
            string? overpassResult = await _mapService.GetOverpassDataAsync(request.Query, request.Proximity);
            if (overpassResult == null)
            {
                return StatusCode(500, new { message = "Error retrieving data from Overpass API" });
            }

            var overpassResponse = JsonConvert.DeserializeObject<OverpassResponse>(overpassResult);
            if (overpassResponse == null || overpassResponse.Elements == null)
            {
                return BadRequest(new { message = "Error parsing Overpass response" });
            }

            var nodes = overpassResponse.Elements
                .Where(e => e.Type == "node" && e.Tags == null)
                .Select(e => new
                {
                    e.Type,
                    e.Id,
                    e.Lat,
                    e.Lon
                }).ToList();

            var others = overpassResponse.Elements
                .Where(e => e.Tags != null)
                .ToList();

            return Ok(new { Nodes = nodes, Others = others });
        }

        [HttpPost("wikipedia-data-single")]
        public async Task<IActionResult> GetWikipediaData([FromBody] Element element)
        {
            if (element.Tags != null && !string.IsNullOrEmpty(element.Tags.Wikipedia))
            {
                double latitude = element.Lat ?? 0;
                double longitude = element.Lon ?? 0;
                var final_name = element.Tags.NameCz
                 ?? element.Tags.NameEn
                 ?? element.Tags.Name;

                var tags = element.Tags;
                bool isPageId = tags.isPageId;
                string? language = tags.lang;

                WikipediaData? wikipediaData;
                List<string> images = new();

                if (isPageId)
                {
                    if (final_name != null)
                    {
                        images = await _mapService.GetWikidataImageAsync(final_name, latitude, longitude) ?? new List<string>();
                    }

                    if (!images.Any())
                    {
                        images = await _mapService.GetWikipediaImageByPageIdAsync(tags.Wikipedia, latitude, longitude, language) ?? new List<string>();
                    }

                    wikipediaData = new WikipediaData
                    {
                        Article = new WikipediaArticle { Title = final_name },
                        WikidataImage = images ?? new List<string>()
                    };
                }
                else
                {
                    wikipediaData = await _mapService.GetWikipediaDataAsync(tags.Wikipedia, latitude, longitude);
                }

                if (wikipediaData != null)
                {
                    var result = new
                    {
                        Element = element,
                        Title = wikipediaData.Article?.Title ?? tags.Name ?? "",
                        OpeningHours = tags.OpeningHours ?? "",
                        Website = tags.Website ?? "",
                        Summary = wikipediaData.Article?.Extract ?? tags.Description ?? "",
                        Images = wikipediaData.WikidataImage ?? new List<string>(),
                    };
                    return Ok(result);
                }
            }
            return Ok("Invalid element or missing Wikipedia tag");
        }


        [HttpPost("wikidata-image")]
        public async Task<IActionResult> GetWikidataImage([FromBody] Element element)
        {
            if (element.Tags == null || string.IsNullOrEmpty(element.Tags.Name))
            {
                return BadRequest("Invalid element or missing name tag.");
            }

            double latitude = element.Lat ?? 0;
            double longitude = element.Lon ?? 0;
            var final_name = element.Tags.NameCz ?? element.Tags.NameEn ?? element.Tags.Name;

            try
            {
                var imageUrl = await _mapService.GetWikidataImageAsync(final_name, latitude, longitude);
                return Ok(new
                {
                    Element = element,
                    ImageUrl = imageUrl
                });
            }
            catch (WikidataImageNotFoundException)
            {
                return Ok(new
                {
                    Message = $"No image found for {final_name}.",
                    Place = final_name
                });
            }
            catch (WikidataServiceException ex)
            {
                return StatusCode(500, new
                {
                    Message = "An error occurred while retrieving data from Wikidata",
                    Error = ex.Message
                });
            }
        }
    }
}
