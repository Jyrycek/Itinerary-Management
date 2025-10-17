using ItineraryManagement.Server.Models;
using ItineraryManagement.Server.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace ItineraryManagement.Server.Services
{
    public class DashboardService
    {
        private readonly string _baseUrl;
        private readonly string _defaultProfileImageUrl;
        private readonly string _defaultProjectImageUrl;
        private readonly string _defaultPlaceImageUrl;
        private readonly string _containerRoot;

        private readonly DatabaseManager _databaseManager;
        private readonly UploadService _uploadService;


        public DashboardService(DatabaseManager database, UploadService uploadService, IOptions<AppSettings> config)
        {
            _databaseManager = database;
            _uploadService = uploadService;
            _baseUrl = config.Value.BlobStorage.BaseUrl;
            _defaultProfileImageUrl = config.Value.Images.DefaultProfileImageUrl;
            _defaultProjectImageUrl = config.Value.Images.DefaultProjectImageUrl;
            _defaultPlaceImageUrl = config.Value.Images.DefaultPlaceImageUrl;
            _containerRoot = config.Value.BlobStorage.ContainerRoot;

        }
        private async Task<bool> IsUserAuthorizedAsync(int userId, int projectId)
        {
            var project = await _databaseManager.GetProjectById(projectId);
            return project != null && project.UserId == userId;
        }

        public async Task<ProjectModel?> GetAuthorizedProjectAsync(int userId, int projectId)
        {
            if (await IsUserAuthorizedAsync(userId, projectId))
            {
                return await _databaseManager.GetProjectById(projectId);
            }
            return null;
        }

        private async Task<ProjectModel?> GetAuthorizedProjectAllAsync(int userId, int projectId)
        {
            if (await IsUserAuthorizedAsync(userId, projectId))
            {
                return await _databaseManager.GetProjectByIdAll(projectId);
            }
            return null;
        }

        public async Task<List<ProjectModel>?> GetProjects(int userId)
        {
            List<ProjectModel>? projects = await _databaseManager.GetProjectsAsync(userId);

            if (projects == null)
            {
                return null;
            }

            foreach (ProjectModel project in projects)
            {
                string? imageUrl = project.ImageUrl;

                if (string.IsNullOrEmpty(imageUrl))
                {
                    continue;
                }
                if (imageUrl.StartsWith(_baseUrl))
                {
                    Uri blobUri = new Uri(imageUrl);
                    string blobName = blobUri.AbsolutePath.TrimStart('/');
                    blobName = blobName.Replace(_containerRoot, "");

                    string sasTokenUrl = _uploadService.GenerateSasToken(blobName);

                    project.ImageUrl = sasTokenUrl;
                }
            }

            return projects;
        }

        public async Task<bool> RemoveProject(int userId, int projectId)
        {
            ProjectModel? project = await GetAuthorizedProjectAsync(userId, projectId);

            if (project == null)
            {
                return false;
            }

            return await _databaseManager.RemoveProjectAsync(project);
        }

        public async Task<ProjectModel?> AddProject(ProjectModelDTO project)
        {
            User? user = await _databaseManager.GetUserById(project.UserId);

            if (user == null)
            {
                return null;
            }

            ProjectModel project_temp = new ProjectModel
            {
                UserId = project.UserId,
                User = user,
                Title = project.Title,
                StartDate = project.StartDate,
                EndDate = project.EndDate,
                ImageUrl = _defaultProjectImageUrl
            };

            Itinerary itinerary = new Itinerary
            {
                StartDate = project.StartDate,
                EndDate = project.EndDate,
                Project = project_temp,
                ProjectId = project_temp.Id
            };

            List<ItineraryDay> itineraryDays = new List<ItineraryDay>();
            for (DateTime date = project.StartDate; date <= project.EndDate; date = date.AddDays(1))
            {
                ItineraryDay day = new ItineraryDay
                {
                    Itinerary = itinerary,
                    DayDate = date,
                    StartTime = new TimeSpan(10, 0, 0),
                    EndTime = new TimeSpan(16, 0, 0)
                };
                itineraryDays.Add(day);
            }

            itinerary.ItineraryDays = itineraryDays;

            project_temp.Itineraries.Add(itinerary);

            return await _databaseManager.AddProjectAsync(project_temp);
        }


        public async Task<List<PlaceModelDTO>?> GetPlaces(int userId, int projectId)
        {
            ProjectModel? project = await GetAuthorizedProjectAsync(userId, projectId);

            if (project == null)
            {
                return null;
            }

            List<PlaceModel>? places = await _databaseManager.GetPlacesAsync(projectId);

            if (places == null)
            {
                return null;
            }

            await CorrectOrder(places);

            List<PlaceModelDTO> placeDtos = new List<PlaceModelDTO>();

            foreach (PlaceModel place in places)
            {
                List<PlaceImageModelDTO> placeImages = new List<PlaceImageModelDTO>();

                foreach (var image in place.PlaceImages)
                {
                    string? imageUrl = image.ImageUrl;

                    if (string.IsNullOrEmpty(imageUrl))
                    {
                        continue;
                    }

                    if (imageUrl.StartsWith(_baseUrl))
                    {
                        Uri blobUri = new Uri(imageUrl);
                        string blobName = blobUri.AbsolutePath.TrimStart('/');
                        blobName = blobName.Replace(_containerRoot, "");

                        string sasTokenUrl = _uploadService.GenerateSasToken(blobName);
                        imageUrl = sasTokenUrl;
                    }


                    placeImages.Add(new PlaceImageModelDTO
                    {
                        Id = image.Id,
                        ImageUrl = imageUrl
                    });
                }

                var placeDto = new PlaceModelDTO
                {
                    Id = place.Id,
                    Title = place.Title,
                    Description = place.Description,
                    Latitude = place.Latitude,
                    Longitude = place.Longitude,
                    Order = place.Order,
                    PlaceImages = placeImages,
                    VisitDuration = place.VisitDuration,
                    OpeningHours = place.OpeningHours,
                    Website = place.Website,
                    Tags = place.PlaceTags.Select(pt => new TagModelDTO
                    {
                        Name = pt.Tag?.Name ?? string.Empty,
                        Color = pt.Tag?.Color ?? string.Empty
                    }).ToList()
                };

                placeDtos.Add(placeDto);
            }

            return placeDtos;
        }

        private async Task CorrectOrder(List<PlaceModel> places)
        {
            // Kontrola na nuly
            foreach (var place in places)
            {
                if (place.Order <= 0)
                {
                    place.Order = 1;
                }
            }

            // Získání pořadí a odstranění duplicit
            var orderSet = new HashSet<int>();
            foreach (var place in places)
            {
                if (place.Order >= 1)
                {
                    orderSet.Add(place.Order);
                }
            }

            int maxOrder = orderSet.Count > 0 ? orderSet.Max() : 0;
            bool orderChanged = false;

            // První krok: Nalezení chybějících čísel v pořadí
            for (int i = 1; i <= maxOrder; i++)
            {
                if (!orderSet.Contains(i))
                {
                    var placeToUpdate = places.FirstOrDefault(p => p.Order > i);
                    if (placeToUpdate != null)
                    {
                        placeToUpdate.Order = i;
                        orderChanged = true;
                    }
                }
            }

            // Oprava duplicitního pořadí
            var orderCount = new Dictionary<int, int>();
            foreach (var place in places)
            {
                if (orderCount.ContainsKey(place.Order))
                {
                    orderCount[place.Order]++;
                }
                else
                {
                    orderCount[place.Order] = 1;
                }
            }

            // Druhý krok: Posunout duplicitní pořadí
            int nextOrder = 1;
            foreach (var place in places)
            {
                while (orderCount[place.Order] > 1)
                {
                    while (orderCount.ContainsKey(nextOrder))
                    {
                        nextOrder++;
                    }

                    if (place.Order != nextOrder)
                    {
                        orderCount[place.Order]--;
                        place.Order = nextOrder;
                        orderCount[nextOrder] = 1;
                        orderChanged = true;
                    }
                }
            }

            // Pokud došlo ke změnám, aktualizujeme databázi
            if (orderChanged)
            {
                await _databaseManager.UpdatePlacesAsync(places);
            }
        }

        public async Task<List<Tag?>?> GetTags(int userId, int projectId)
        {
            ProjectModel? project = await GetAuthorizedProjectAsync(userId, projectId);

            if (project == null)
            {
                return null;
            }

            List<Tag?>? tags = await _databaseManager.GetTagsByProjectIdAsync(projectId);

            if (tags == null)
            {
                return null;
            }

            return tags;
        }

        public async Task<bool> RemovePlace(int userId, int projectId, int placeId)
        {
            ProjectModel? project = await GetAuthorizedProjectAsync(userId, projectId);

            if (project == null)
            {
                return false;
            }

            PlaceModel? place = await _databaseManager.GetPlaceById(placeId);

            if (place == null || place.ProjectId != projectId)
            {
                return false;
            }

            return await _databaseManager.RemovePlaceAsync(place);
        }
        public async Task<PlaceModelDTO?> AddPlace(int userId, int projectId, PlaceModelDTO placeDto)
        {
            ProjectModel? project = await GetAuthorizedProjectAsync(userId, projectId);

            if (project == null)
            {
                return null;
            }

            List<PlaceImageModel> placeImages = new List<PlaceImageModel>();

            if (placeDto.PlaceImages != null && placeDto.PlaceImages.Any())
            {
                foreach (var imageDto in placeDto.PlaceImages)
                {
                    string imageUrl = string.IsNullOrEmpty(imageDto.ImageUrl) ? _defaultPlaceImageUrl : imageDto.ImageUrl;

                    if (imageUrl.StartsWith(_baseUrl))
                    {
                        Uri blobUri = new Uri(imageUrl);
                        string blobName = blobUri.AbsolutePath.TrimStart('/');
                        blobName = blobName.Replace(_containerRoot, "");

                        string sasTokenUrl = _uploadService.GenerateSasToken(blobName);
                        imageUrl = sasTokenUrl;
                    }

                    placeImages.Add(new PlaceImageModel
                    {
                        ImageUrl = imageUrl
                    });
                }
            }
            else
            {
                string imageUrl = _defaultPlaceImageUrl;

                Uri blobUri = new Uri(imageUrl);
                string blobName = blobUri.AbsolutePath.TrimStart('/');
                blobName = blobName.Replace(_containerRoot, "");

                string sasTokenUrl = _uploadService.GenerateSasToken(blobName);
                imageUrl = sasTokenUrl;

                placeImages.Add(new PlaceImageModel
                {
                    ImageUrl = imageUrl
                });
            }

            PlaceModel placeEntity = new PlaceModel
            {
                Title = placeDto.Title,
                Project = project,
                ProjectId = project.Id,
                Description = placeDto.Description,
                Latitude = placeDto.Latitude,
                Longitude = placeDto.Longitude,
                Order = placeDto.Order,
                VisitDuration = placeDto.VisitDuration == 0 || placeDto.VisitDuration == null ? 60 : placeDto.VisitDuration,
                PlaceImages = placeImages,
                Website = placeDto.Website,
                OpeningHours = placeDto.OpeningHours
            };

            var addedPlace = await _databaseManager.AddPlaceAsync(placeEntity);

            if (addedPlace == null)
            {
                return null;
            }

            if (placeDto.Tags != null && placeDto.Tags.Any())
            {
                var tagsToAdd = new List<PlaceTagModel>();

                foreach (var tagDto in placeDto.Tags)
                {
                    var tag = await _databaseManager.Tags
                                    .FirstOrDefaultAsync(t => t.Name == tagDto.Name);

                    if (tag == null)
                    {
                        tag = new Tag
                        {
                            Name = tagDto.Name,
                            Color = tagDto.Color
                        };

                        _databaseManager.Tags.Add(tag);
                    }

                    tagsToAdd.Add(new PlaceTagModel
                    {
                        PlaceId = addedPlace.Id,
                        TagId = tag.Id,
                        Place = addedPlace,
                        Tag = tag
                    });
                }

                if (tagsToAdd.Any())
                {
                    _databaseManager.PlaceTags.AddRange(tagsToAdd);
                    await _databaseManager.SaveChangesAsync();
                }
            }

            var result = new PlaceModelDTO
            {
                Id = addedPlace.Id,
                Title = addedPlace.Title,
                Description = addedPlace.Description,
                Latitude = addedPlace.Latitude,
                Longitude = addedPlace.Longitude,
                Order = addedPlace.Order,
                VisitDuration = addedPlace.VisitDuration,
                Website = addedPlace.Website,
                OpeningHours = addedPlace.OpeningHours,
                PlaceImages = addedPlace.PlaceImages.Select(pi => new PlaceImageModelDTO
                {
                    Id = pi.Id,
                    ImageUrl = pi.ImageUrl
                }).ToList(),
                Tags = addedPlace.PlaceTags.Select(pt => new TagModelDTO
                {
                    Name = pt.Tag?.Name ?? string.Empty,
                    Color = pt.Tag?.Color
                }).ToList()
            };

            return result;
        }

        public async Task<bool> UpdatePlace(int userId, int projectId, PlaceModelDTO place)
        {
            ProjectModel? project = await GetAuthorizedProjectAsync(userId, projectId);

            if (project == null)
            {
                return false;
            }

            PlaceModel? existingPlace = await _databaseManager.GetPlaceById(place.Id);

            if (existingPlace == null || existingPlace.ProjectId != projectId)
            {
                return false;
            }

            existingPlace.Title = place.Title;
            existingPlace.Description = place.Description;
            existingPlace.Latitude = place.Latitude;
            existingPlace.Longitude = place.Longitude;
            existingPlace.VisitDuration = place.VisitDuration;
            existingPlace.Order = place.Order;
            existingPlace.Website = place.Website;
            existingPlace.OpeningHours = place.OpeningHours;

            if (place.PlaceImages != null && place.PlaceImages.Any())
            {
                var existingImages = await _databaseManager.PlaceImages
                    .Where(img => img.PlaceId == existingPlace.Id)
                    .ToListAsync();

                var newImages = place.PlaceImages;

                var existingImageIds = existingImages.Select(img => img.Id).ToHashSet();
                var newImageIds = newImages.Select(img => img.Id).ToHashSet();

                var imagesToRemove = existingImages
                    .Where(img => !newImageIds.Contains(img.Id))
                    .ToList();

                _databaseManager.PlaceImages.RemoveRange(imagesToRemove);

                foreach (var imageDto in newImages)
                {
                    var existingImage = existingImages.FirstOrDefault(img => img.Id == imageDto.Id);

                    if (existingImage != null)
                    {
                        if (existingImage.ImageUrl != imageDto.ImageUrl)
                        {
                            existingImage.ImageUrl = imageDto.ImageUrl;
                            _databaseManager.PlaceImages.Update(existingImage);
                        }
                    }
                    else
                    {
                        _databaseManager.PlaceImages.Add(new PlaceImageModel
                        {
                            PlaceId = existingPlace.Id,
                            ImageUrl = imageDto.ImageUrl
                        });
                    }
                }
            }

            var currentTags = await _databaseManager.PlaceTags
                .Where(pt => pt.PlaceId == existingPlace.Id)
                .Include(pt => pt.Tag)
                .Select(pt => pt.Tag)
                .ToListAsync();

            var newTags = place.Tags;

            var tagsToRemove = currentTags
                .Where(t => !newTags.Any(nt => nt.Name == t?.Name))
                .ToList();

            foreach (var tag in tagsToRemove)
            {
                var placeTagToRemove = await _databaseManager.PlaceTags
                    .FirstOrDefaultAsync(pt => pt.PlaceId == existingPlace.Id && tag != null && pt.TagId == tag.Id);

                if (placeTagToRemove != null)
                {
                    _databaseManager.PlaceTags.Remove(placeTagToRemove);
                }
            }

            foreach (var newTag in newTags)
            {
                var existingTag = await _databaseManager.Tags
                    .FirstOrDefaultAsync(t => t.Name == newTag.Name);

                if (existingTag == null)
                {
                    existingTag = new Tag
                    {
                        Name = newTag.Name,
                        Color = newTag.Color
                    };

                    await _databaseManager.Tags.AddAsync(existingTag);
                    await _databaseManager.SaveChangesAsync();
                }
                else
                {
                    existingTag.Name = newTag.Name;
                    existingTag.Color = newTag.Color;
                    _databaseManager.Tags.Update(existingTag);
                    await _databaseManager.SaveChangesAsync();
                }

                var placeTag = await _databaseManager.PlaceTags
                    .FirstOrDefaultAsync(pt => pt.PlaceId == existingPlace.Id && pt.TagId == existingTag.Id);

                if (placeTag == null)
                {
                    placeTag = new PlaceTagModel
                    {
                        PlaceId = existingPlace.Id,
                        TagId = existingTag.Id
                    };

                    await _databaseManager.PlaceTags.AddAsync(placeTag);
                    await _databaseManager.SaveChangesAsync();
                }
            }

            try
            {
                await _databaseManager.UpdatePlaceAsync(existingPlace);
                return true;
            }
            catch (Exception)
            {
                return false;
            }
        }

        public async Task<bool> UpdateUserProfilePicture(int userId, string imageUrl)
        {
            User? user = await _databaseManager.GetUserById(userId);

            if (user == null)
            {
                return false;
            }

            user.ProfileImageUrl = imageUrl;

            return await _databaseManager.UpdateUserAsync(user);
        }

        public async Task<bool> UpdateProjectPicture(int projectId, string imageUrl)
        {
            ProjectModel? project = await _databaseManager.GetProjectById(projectId);

            if (project == null)
            {
                return false;
            }

            project.ImageUrl = imageUrl;

            return await _databaseManager.UpdateProjectAsync(project);
        }

        public async Task<string?> GetOldProfilePictureUrl(int userId)
        {
            User? user = await _databaseManager.GetUserById(userId);

            if (user == null)
            {
                return null;
            }

            if (user.ProfileImageUrl == _defaultProfileImageUrl)
            {
                return null;
            }

            return user.ProfileImageUrl;
        }

        public async Task<string?> GetPlaceImageUrlById(int imageId, int projectId, int placeId, int userId)
        {
            ProjectModel? project = await GetAuthorizedProjectAsync(userId, projectId);
            if (project == null)
            {
                return null;
            }

            PlaceImageModel? image = await _databaseManager.GetPlaceImageById(imageId, placeId);
            return image?.ImageUrl;
        }

        public async Task<bool> UpdatePlaceImageById(int imageId, string newImageUrl)
        {
            return await _databaseManager.UpdatePlaceImage(imageId, newImageUrl);
        }

        public async Task<bool> AddNewPlaceImage(int projectId, int placeId, int userId, string imageUrl)
        {
            ProjectModel? project = await GetAuthorizedProjectAsync(userId, projectId);
            if (project == null)
            {
                return false;
            }

            return await _databaseManager.InsertPlaceImage(placeId, imageUrl);
        }
        public async Task<ProjectModel?> GetProjectById(int userId, int projectId)
        {
            return await _databaseManager.Projects
                                 .Where(p => p.UserId == userId && p.Id == projectId)
                                 .FirstOrDefaultAsync();
        }
        public async Task<ItineraryWithDaysAndPlacesDto?> GetItinerary(int userId, int projectId)
        {
            return await _databaseManager.GetItineraryWithDaysAndPlaces(userId, projectId);
        }
        public async Task<bool> RemovePlaceFromDay(int userId, int projectId, int dayId, int placeId)
        {
            try
            {
                var itineraryDay = await _databaseManager.ItineraryDays
                .Include(d => d.ItineraryDayPlaces)
                .FirstOrDefaultAsync(d => d.Id == dayId && d.Itinerary.ProjectId == projectId);

                if (itineraryDay == null)
                {
                    return false;
                }

                var placeToRemove = itineraryDay.ItineraryDayPlaces.FirstOrDefault(p => p.PlaceId == placeId);
                if (placeToRemove == null)
                {
                    return false;
                }
                int removedPlaceOrder = placeToRemove.Order;

                _databaseManager.ItineraryDayPlaces.Remove(placeToRemove);

                foreach (var place in itineraryDay.ItineraryDayPlaces)
                {
                    if (place.Order > removedPlaceOrder)
                    {
                        place.Order--;
                    }
                }

                await _databaseManager.SaveChangesAsync();

                return true;
            }
            catch (Exception)
            {
                return false;
            }
        }

        public async Task<bool> AddPlaceToDay(int userId, int projectId, int dayId, int placeId, int order)
        {
            ProjectModel? project = await GetAuthorizedProjectAsync(userId, projectId);

            if (project == null)
            {
                return false;
            }

            PlaceModel? place = await _databaseManager.GetPlaceById(placeId);

            if (place == null || place.ProjectId != projectId)
            {
                return false;
            }

            ItineraryDay? itineraryDay = await _databaseManager.GetItineraryDayById(dayId);

            if (itineraryDay == null)
            {
                return false;
            }
            try
            {
                ItineraryDayPlaceModel placeToAdd = new ItineraryDayPlaceModel { ItineraryDayId = dayId, PlaceId = placeId, Order = order };

                itineraryDay.ItineraryDayPlaces.Add(placeToAdd);

                await _databaseManager.SaveChangesAsync();
                return true;
            }
            catch (Exception)
            {
                return false;
            }
        }

        public async Task<bool> UpdateProjectAsync(int userId, ProjectModel updated_project)
        {
            ProjectModel? project = await GetAuthorizedProjectAllAsync(userId, updated_project.Id);

            if (project == null)
            {
                return false;
            }

            project.Title = updated_project.Title;
            project.StartDate = updated_project.StartDate;
            project.EndDate = updated_project.EndDate;

            var itinerary = project.Itineraries.FirstOrDefault();

            if (itinerary != null)
            {
                itinerary.StartDate = updated_project.StartDate;
                itinerary.EndDate = updated_project.EndDate;

                await UpdateItineraryDays(itinerary, updated_project.StartDate, updated_project.EndDate);
            }

            return await _databaseManager.UpdateProjectAsync(project);
        }

        private async Task UpdateItineraryDays(Itinerary itinerary, DateTime newStartDate, DateTime newEndDate)
        {
            Itinerary? itinerary_days = await _databaseManager.GetItineraryByProjectIdAsync(itinerary.Project.UserId, itinerary.Project.Id);
            if (itinerary_days == null)
            {
                return;
            }
            var existingDays = itinerary_days.ItineraryDays;

            for (DateTime date = newStartDate; date <= newEndDate; date = date.AddDays(1))
            {
                if (!existingDays.Any(d => d.DayDate == date))
                {
                    itinerary.ItineraryDays.Add(new ItineraryDay
                    {
                        Itinerary = itinerary,
                        DayDate = date,
                        StartTime = new TimeSpan(10, 0, 0),
                        EndTime = new TimeSpan(16, 0, 0)
                    });
                }
            }

            itinerary_days = await _databaseManager.GetItineraryByProjectIdAsync(itinerary.Project.UserId, itinerary.Project.Id);

            existingDays = itinerary_days!.ItineraryDays;

            var daysToRemove = existingDays
               .Where(day => day.DayDate < newStartDate || day.DayDate > newEndDate)
               .ToList();

            var firstDay = existingDays.FirstOrDefault(d => d.DayDate == newStartDate)
            ?? itinerary.ItineraryDays.FirstOrDefault(d => d.DayDate == newStartDate);

            var lastDay = existingDays.FirstOrDefault(d => d.DayDate == newEndDate)
                        ?? itinerary.ItineraryDays.FirstOrDefault(d => d.DayDate == newEndDate);


            List<ItineraryDayPlaceModel> tempDays = new List<ItineraryDayPlaceModel>();

            foreach (var day in daysToRemove)
            {
                //var placesToMove = day.ItineraryDayPlaces.ToList();

                ItineraryDay? targetDay;

                if (day.DayDate < newStartDate)
                {
                    targetDay = firstDay;
                }
                else
                {
                    targetDay = lastDay;
                }

                if (targetDay != null)
                {
                    int maxOrder = await _databaseManager.GetMaxOrderNumberAsync(targetDay.Id);

                    foreach (var item in day.ItineraryDayPlaces)
                    {
                        ItineraryDayPlaceModel? dayPlace = await _databaseManager.GetItineraryDayPlaceAsync(item.PlaceId, item.ItineraryDayId);
                        if (dayPlace != null)
                        {
                            _databaseManager.ItineraryDayPlaces.Remove(dayPlace);

                            // if (!tempDays.Any(x => x.PlaceId == item.PlaceId && x.ItineraryDayId == targetDay.Id))
                            //{
                            //     var newPlace = new ItineraryDayPlaceModel
                            //     {
                            //         PlaceId = item.PlaceId,
                            //          ItineraryDayId = item.ItineraryDayId,
                            //          Order = ++maxOrder
                            //      };
                            //
                            //      tempDays.Add(newPlace);
                            //  }
                        }
                    }
                }
                await _databaseManager.RemoveItineraryDayAsync(day.Id);
            }
            //K přiřazení míst k novým dnům
            //foreach (var item in tempDays)
            //{
            //    _databaseManager.ItineraryDayPlaces.Add(item);
            //    await _databaseManager.SaveChangesAsync();
            //}

            await _databaseManager.SaveChangesAsync();

            foreach (var day in itinerary.ItineraryDays)
            {
                if (day.ItineraryDayPlaces != null && day.ItineraryDayPlaces.Any())
                {
                    CorrectOrderForDay(day.ItineraryDayPlaces);
                }
            }

            await _databaseManager.SaveChangesAsync();
        }

        public async Task<string?> GetProjectImageUrlAsync(int projectId)
        {
            ProjectModel? project = await _databaseManager.GetProjectById(projectId);

            if (project == null)
            {
                return null;
            }

            string? imageUrl = project.ImageUrl;

            if (string.IsNullOrEmpty(imageUrl))
            {
                return null;
            }

            Uri blobUri = new Uri(imageUrl);
            string blobName = blobUri.AbsolutePath.TrimStart('/');
            blobName = blobName.Replace(_containerRoot, "");

            return _uploadService.GenerateSasToken(blobName);
        }

        public async Task<bool> UpdatePlaceOrders(int userId, int projectId, int dayId, List<ItineraryDayPlaceModel> placeOrders)
        {
            try
            {
                var itineraryDay = await _databaseManager.ItineraryDays
                    .Include(d => d.ItineraryDayPlaces)
                    .FirstOrDefaultAsync(d => d.Id == dayId && d.Itinerary.ProjectId == projectId);

                if (itineraryDay == null)
                {
                    return false;
                }

                foreach (var placeOrder in placeOrders)
                {
                    var existingPlace = itineraryDay.ItineraryDayPlaces
                        .FirstOrDefault(p => p.PlaceId == placeOrder.PlaceId);
                    if (existingPlace != null)
                    {
                        existingPlace.Order = placeOrder.Order;
                    }
                }

                await _databaseManager.SaveChangesAsync();

                return true;
            }
            catch (Exception)
            {
                return false;
            }
        }
        private static void CorrectOrderForDay(List<ItineraryDayPlaceModel> places)
        {
            var orderSet = new HashSet<int>();
            foreach (var place in places)
            {
                if (place.Order <= 0)
                {
                    place.Order = 1;
                }

                orderSet.Add(place.Order);
            }

            int maxOrder = orderSet.Count > 0 ? orderSet.Max() : 0;

            // Nalezení chybějících čísel v pořadí
            var missingOrders = new List<int>();
            for (int i = 1; i <= maxOrder; i++)
            {
                if (!orderSet.Contains(i))
                {
                    missingOrders.Add(i);
                }
            }

            // Posunutí míst pro opravu duplicitních pořadí
            var orderCount = new Dictionary<int, int>();
            foreach (var place in places)
            {
                if (orderCount.ContainsKey(place.Order))
                {
                    orderCount[place.Order]++;
                }
                else
                {
                    orderCount[place.Order] = 1;
                }
            }

            // Posunout duplicitní pořadí
            int nextOrder = 1;
            foreach (var place in places)
            {
                while (orderCount[place.Order] > 1)
                {
                    while (orderCount.ContainsKey(nextOrder))
                    {
                        nextOrder++;
                    }

                    if (place.Order != nextOrder)
                    {
                        orderCount[place.Order]--;
                        place.Order = nextOrder;
                        orderCount[nextOrder] = 1;
                    }
                }
            }
        }
        public string? GetOldProjectImageUrl(ProjectModel project)
        {
            if (project.ImageUrl == _defaultProjectImageUrl)
            {
                return null;
            }

            return project.ImageUrl;
        }

        public async Task<bool> UpdateDayTimes(int userId, int projectId, int dayId, string startTime, string endTime)
        {
            return await _databaseManager.UpdateDayTimes(userId, projectId, dayId, startTime, endTime);
        }

        public async Task<bool> AddPlacesToDay(int userId, int projectId, int dayId, List<PlaceOrderModel> places)
        {
            ProjectModel? project = await GetAuthorizedProjectAsync(userId, projectId);

            if (project == null)
            {
                return false;
            }

            ItineraryDay? itineraryDay = await _databaseManager.GetItineraryDayById(dayId);

            if (itineraryDay == null)
            {
                return false;
            }

            var existingPlaces = await _databaseManager.GetItineraryDayPlacesByDayId(dayId);
            if (existingPlaces.Any())
            {
                bool removalSuccess = await _databaseManager.RemoveItineraryDayPlaces(existingPlaces);
                if (!removalSuccess)
                {
                    return false;
                }
            }

            foreach (var placeOrder in places)
            {
                PlaceModel? place = await _databaseManager.GetPlaceById(placeOrder.PlaceId);
                if (place == null || place.ProjectId != projectId)
                {
                    return false;
                }

                ItineraryDayPlaceModel placeToAdd = new ItineraryDayPlaceModel
                {
                    ItineraryDayId = dayId,
                    PlaceId = placeOrder.PlaceId,
                    Order = placeOrder.Order
                };

                itineraryDay.ItineraryDayPlaces.Add(placeToAdd);
            }
            await _databaseManager.SaveChangesAsync();
            return true;
        }

        public async Task<List<ItineraryDayTransportSegment>> GetTransportSegmentsForProject(int userId, int projectId, List<int> dayIds)
        {
            ProjectModel? project = await GetAuthorizedProjectAsync(userId, projectId);

            if (project == null)
            {
                return [];
            }

            return await _databaseManager.GetTransportSegmentsForProject(userId, projectId, dayIds);
        }
    }
}