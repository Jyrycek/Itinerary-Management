using ItineraryManagement.Server.Models;
using ItineraryManagement.Server.Models.Entities;
using ItineraryManagement.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace ItineraryManagement.Server.Controllers
{
    [Route("api/dashboard"), ApiController, Authorize]
    public class DashboardController : ControllerBase
    {
        private readonly DashboardService _dashboardService;
        private readonly UploadService _uploadService;

        private readonly AppSettings _appSettings;
        public DashboardController(DashboardService dashboardService, UploadService uploadService, IOptions<AppSettings> config)
        {
            _dashboardService = dashboardService;
            _uploadService = uploadService;
            _appSettings = config.Value;
        }

        [HttpGet("get-projects")]
        public async Task<IActionResult> GetProjects()
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

            List<ProjectModel>? projects = await _dashboardService.GetProjects(userId);

            if (projects == null)
            {
                return BadRequest();
            }

            return Ok(new { projects });
        }

        [HttpGet("get-project/{projectId}")]
        public async Task<IActionResult> GetProjectById(int projectId)
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

            ProjectModel? project = await _dashboardService.GetProjectById(userId, projectId);

            if (project == null)
            {
                return NotFound($"No project found with ID: {projectId}.");
            }

            return Ok(new { project });
        }

        [HttpDelete("remove-project/{projectId}")]
        public async Task<IActionResult> RemoveProject(int projectId)
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

            bool successful = await _dashboardService.RemoveProject(userId, projectId);

            if (!successful)
            {
                return BadRequest();
            }

            return Ok();
        }

        [HttpPost("add-project")]
        public async Task<IActionResult> AddProject([FromBody] ProjectModelDTO project)
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

            project.UserId = userId;
            ProjectModel? added_project = await _dashboardService.AddProject(project);

            if (added_project == null)
            {
                return BadRequest();
            }

            return Ok(new { added_project });
        }

        [HttpPost("update-project")]
        public async Task<IActionResult> UpdateProject([FromBody] ProjectModel updated_project)
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

            bool successful = await _dashboardService.UpdateProjectAsync(userId, updated_project);

            if (!successful)
            {
                return BadRequest();
            }

            return Ok();
        }

        [HttpPost("update-project-image/{projectId}")]
        public async Task<IActionResult> UpdateProjectImage(IFormFile file, int projectId)
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

            ProjectModel? project = await _dashboardService.GetAuthorizedProjectAsync(userId, projectId);

            if (project == null)
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

            string? oldImageUrl = _dashboardService.GetOldProjectImageUrl(project);

            if (!string.IsNullOrEmpty(oldImageUrl))
            {
                int startIndex = oldImageUrl.IndexOf($"/{_appSettings.BlobStorage.ProjecteImagesPath}");
                oldImageUrl = oldImageUrl.Substring(startIndex);
                await _uploadService.DeleteAsync(oldImageUrl);
            }

            var fileName = $"{_appSettings.BlobStorage.ProjecteImagesPath}/{userId}/{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";

            var blobUrl = await _uploadService.UploadAsync(memoryStream, fileName, file.ContentType);

            bool successful = await _dashboardService.UpdateProjectPicture(projectId, blobUrl);

            if (!successful)
            {
                return BadRequest();
            }

            string? imageUrl = await _dashboardService.GetProjectImageUrlAsync(projectId);

            if (string.IsNullOrEmpty(imageUrl))
            {
                return BadRequest();
            }
            return Ok(new { imageUrl });
        }

        [HttpPost("project/{projectId}/update-day-times/{dayId}")]
        public async Task<IActionResult> UpdateDayTimes(int projectId, int dayId, UpdateDayTimesModel model)
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

            if (model.StartTime == null || model.EndTime == null)
            {
                return BadRequest("Start and end time cannot be null");
            }

            bool successful = await _dashboardService.UpdateDayTimes(userId, projectId, dayId, model.StartTime, model.EndTime);

            if (!successful)
            {
                return BadRequest();
            }

            return Ok();
        }
    }
}
