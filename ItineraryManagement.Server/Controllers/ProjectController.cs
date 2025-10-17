using ItineraryManagement.Server.Models;
using ItineraryManagement.Server.Models.Entities;
using ItineraryManagement.Server.Models.OpenAI;
using ItineraryManagement.Server.Models.OverpassApi;
using ItineraryManagement.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace ItineraryManagement.Server.Controllers
{
    [Route("api/dashboard/project"), ApiController, Authorize]
    public class ProjectController : ControllerBase
    {
        private readonly DashboardService _dashboardService;
        private readonly UploadService _uploadService;
        private readonly OpenAIService _openAIService;

        private readonly AppSettings _appSettings;

        public ProjectController(AuthService authService,
            DashboardService dashboardService,
            UploadService uploadService,
            OpenAIService openAIService,
            IOptions<AppSettings> config)
        {
            _dashboardService = dashboardService;
            _uploadService = uploadService;
            _openAIService = openAIService;
            _appSettings = config.Value;
        }

        [HttpGet("{projectId}/get-places")]
        public async Task<IActionResult> GetProjectPlaces(int projectId)
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

            List<PlaceModelDTO>? places = await _dashboardService.GetPlaces(userId, projectId);

            if (places == null)
            {
                return BadRequest();
            }

            return Ok(new { places });
        }
        [HttpDelete("{projectId}/remove-place/{placeId}")]
        public async Task<IActionResult> RemovePlace(int projectId, int placeId)
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

            bool successful = await _dashboardService.RemovePlace(userId, projectId, placeId);

            if (!successful)
            {
                return BadRequest();
            }

            return Ok();
        }
        [HttpGet("{projectId}/get-tags")]
        public async Task<IActionResult> GetProjectTags(int projectId)
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

            List<Tag?>? tags = await _dashboardService.GetTags(userId, projectId);

            if (tags == null)
            {
                return BadRequest();
            }

            return Ok(new { tags });
        }

        [HttpPost("{projectId}/add-place")]
        public async Task<IActionResult> AddPlace(int projectId, [FromBody] PlaceModelDTO place)
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

            PlaceModelDTO? added_place = await _dashboardService.AddPlace(userId, projectId, place);
            
            if (added_place == null)
            {
                return BadRequest(new { message = "Nastala interní chyba při přidávání" });
            }

            return Ok(new { added_place });
        }

        [HttpPut("{projectId}/update-place")]
        public async Task<IActionResult> UpdatePlace(int projectId, [FromBody] PlaceModelDTO place)
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

            bool successful = await _dashboardService.UpdatePlace(userId, projectId, place);

            if (!successful)
            {
                return BadRequest(new { message = "Nastala interní chyba při aktualizaci místa" });
            }

            return Ok();
        }

        [HttpPost("{projectId}/update-place-picture/{placeId}/{imageId}")]
        public async Task<IActionResult> UpdatePlanPicture(int projectId, int placeId, int imageId, IFormFile file)
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

            string? oldImageUrl = null;
            if (imageId > 0)
            {
                oldImageUrl = await _dashboardService.GetPlaceImageUrlById(imageId, projectId, placeId, userId);
                if (oldImageUrl != null && oldImageUrl.StartsWith($"{_appSettings.BlobStorage.BaseUrl}/{_appSettings.BlobStorage.ContainerRoot}"))
                {
                    int startIndex = oldImageUrl.IndexOf($"/{_appSettings.BlobStorage.PlaceImagesPath}");
                    oldImageUrl = oldImageUrl.Substring(startIndex);
                    await _uploadService.DeletePlaceImageAsync(oldImageUrl);
                }
            }

            var fileName = $"{_appSettings.BlobStorage.PlaceImagesPath}/{projectId}/{placeId}/{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
            var blobUrl = await _uploadService.UploadAsync(memoryStream, fileName, file.ContentType);

            bool successful;
            if (imageId > 0)
            {
                successful = await _dashboardService.UpdatePlaceImageById(imageId, blobUrl);
            }
            else
            {
                successful = await _dashboardService.AddNewPlaceImage(projectId, placeId, userId, blobUrl);
            }

            if (!successful)
            {
                return BadRequest();
            }
            return Ok();
        }

        [HttpGet("{projectId}/get-itinerary")]
        public async Task<IActionResult> GetProjectItinerary(int projectId)
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

            var itineraryData = await _dashboardService.GetItinerary(userId, projectId);

            if (itineraryData == null)
            {
                return BadRequest();
            }

            return Ok(new { itinerary = itineraryData });
        }

        [HttpDelete("{projectId}/remove-place/{placeId}/day/{dayId}")]
        public async Task<IActionResult> RemovePlaceFromDay(int projectId, int dayId, int placeId)
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

            bool successful = await _dashboardService.RemovePlaceFromDay(userId, projectId, dayId, placeId);

            if (!successful)
            {
                return BadRequest();
            }

            return Ok();
        }

        [HttpPost("{projectId}/add-place/{placeId}/day/{dayId}")]
        public async Task<IActionResult> AddPlaceToDay(int projectId, int dayId, int placeId, [FromBody] int order)
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

            bool successful = await _dashboardService.AddPlaceToDay(userId, projectId, dayId, placeId, order);

            if (!successful)
            {
                return BadRequest();
            }

            return Ok();
        }

        [HttpPost("{projectId}/update-place-orders/day/{dayId}")]
        public async Task<IActionResult> UpdatePlaceOrders(int projectId, int dayId, [FromBody] List<ItineraryDayPlaceModel> placeOrders)
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

            bool successful = await _dashboardService.UpdatePlaceOrders(userId, projectId, dayId, placeOrders);

            if (!successful)
            {
                return BadRequest();
            }

            return Ok();
        }

        [HttpPost("generate")]
        public async Task<IActionResult> GenerateResponse([FromBody] GenerateRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var response = await _openAIService.GetOpenAiResponse(request.Title, request.Longitude, request.Latitude);
                return Ok(new { Response = response });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = "An error occurred while generating the response", Details = ex.Message });
            }
        }

        [HttpPost("get-places-in-bounds-ai")]
        public async Task<IActionResult> GetPlacesInBoundsAI([FromBody] BoundsRequest bounds)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                List<string>? administration = await MapService.GetAdministrativeAreas(bounds.MinLng, bounds.MinLat, bounds.MaxLng, bounds.MaxLat, bounds.Zoom);
                List<LocationResponse>? places = await _openAIService.GetTouristPlacesInBounds(bounds.MinLng, bounds.MinLat, bounds.MaxLng, bounds.MaxLat, bounds.ExistingPlaceNames ?? [], bounds.userQuery, administration);

                if (places == null || !places.Any())
                {
                    return Ok(new { Message = "Nebyla nalezena žádná turistická místa v této oblasti" });
                }

                return Ok(new { Places = places });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = "Chyba při získávání míst", Details = ex.Message });
            }
        }

        [HttpPost("{projectId}/add-places/day/{dayId}")]
        public async Task<IActionResult> AddPlacesToDay(int projectId, int dayId, [FromBody] List<PlaceOrderModel> places)
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

            bool successful = await _dashboardService.AddPlacesToDay(userId, projectId, dayId, places);

            if (!successful)
            {
                return BadRequest();
            }

            return Ok();
        }

        [HttpPost("{projectId}/transport-segments")]
        public async Task<IActionResult> GetTransportSegments(int projectId, [FromBody] List<int> dayIds)
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

            if (dayIds == null || !dayIds.Any())
            {
                return BadRequest("Musíš poslat aspoň jedno ID dne.");
            }

            var segments = await _dashboardService.GetTransportSegmentsForProject(userId, projectId, dayIds);

            return Ok(new { transportSegments = segments });
        }
    }
}
