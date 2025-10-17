using ItineraryManagement.Server.Models;
using ItineraryManagement.Server.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace ItineraryManagement.Server
{
    /// <summary>
    /// Spravuje připojení k databázi a konfiguraci entit.
    /// Třída dědí z <see cref="DbContext"/> a poskytuje DbSety pro entity jako jsou uživatelé, projekty, místa, tagy a itineráře.
    /// Vytváří databázové tabulky a relace mezi nimi podle konfigurace modelu.
    /// Poskytuje metody pro práci s databází.
    /// </summary>
    public class DatabaseManager : DbContext
    {
        public DatabaseManager(DbContextOptions<DatabaseManager> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<ProjectModel> Projects { get; set; }
        public DbSet<PlaceModel> Places { get; set; }
        public DbSet<Tag> Tags { get; set; }
        public DbSet<PlaceTagModel> PlaceTags { get; set; }
        public DbSet<Itinerary> Itineraries { get; set; }
        public DbSet<ItineraryDay> ItineraryDays { get; set; }
        public DbSet<ItineraryDayPlaceModel> ItineraryDayPlaces { get; set; }
        public DbSet<PlaceImageModel> PlaceImages { get; set; }
        public DbSet<TransportMode> TransportModes { get; set; }
        public DbSet<ItineraryDayTransportSegment> ItineraryDayTransportSegments { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).ValueGeneratedOnAdd();
                entity.Property(e => e.Username).IsRequired().HasMaxLength(255);
                entity.HasIndex(e => e.Username).IsUnique();
                entity.Property(e => e.Email).IsRequired().HasMaxLength(255);
                entity.HasIndex(e => e.Email).IsUnique();
                entity.Property(e => e.PasswordHash).IsRequired().HasMaxLength(255);
                entity.Property(e => e.FirstName).IsRequired().HasMaxLength(255);
                entity.Property(e => e.LastName).IsRequired().HasMaxLength(255);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETDATE()");
                entity.Property(e => e.Role).IsRequired().HasMaxLength(50).HasDefaultValue("user");
                entity.Property(e => e.ProfileImageUrl).HasMaxLength(255);
            });

            modelBuilder.Entity<ProjectModel>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).ValueGeneratedOnAdd();
                entity.Property(e => e.Title).IsRequired().HasMaxLength(255);
                entity.Property(e => e.StartDate).IsRequired();
                entity.Property(e => e.EndDate).IsRequired();
                entity.Property(e => e.ImageUrl);

                entity.HasOne(d => d.User)
                    .WithMany(p => p.projects)
                    .HasForeignKey(d => d.UserId)
                    .OnDelete(DeleteBehavior.Cascade)
                    .HasConstraintName("FK_Projects_Users");
            });

            modelBuilder.Entity<PlaceModel>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).ValueGeneratedOnAdd();
                entity.Property(e => e.Title).IsRequired().HasMaxLength(255);
                entity.Property(e => e.Description);
                entity.Property(e => e.Latitude).HasColumnType("decimal(9, 6)");
                entity.Property(e => e.Longitude).HasColumnType("decimal(9, 6)");
                entity.Property(e => e.Order).IsRequired();
                entity.Property(e => e.VisitDuration).IsRequired(false).HasDefaultValue(60);
                entity.Property(e => e.Website).IsRequired(false);
                entity.Property(e => e.OpeningHours).IsRequired(false);

                entity.HasOne(d => d.Project)
                    .WithMany(p => p.Places)
                    .HasForeignKey(d => d.ProjectId)
                    .OnDelete(DeleteBehavior.Cascade)
                    .HasConstraintName("FK_Places_Projects");
            });

            modelBuilder.Entity<Tag>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).ValueGeneratedOnAdd();
                entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
                entity.Property(e => e.Color);
            });

            modelBuilder.Entity<PlaceTagModel>(entity =>
            {
                entity.HasKey(pt => new { pt.PlaceId, pt.TagId });

                entity.HasOne(pt => pt.Place)
                    .WithMany(p => p.PlaceTags)
                    .HasForeignKey(pt => pt.PlaceId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(pt => pt.Tag)
                    .WithMany(t => t.PlaceTags)
                    .HasForeignKey(pt => pt.TagId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<PlaceImageModel>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).ValueGeneratedOnAdd();
                entity.Property(e => e.ImageUrl).IsRequired().HasMaxLength(255);

                entity.HasOne(d => d.Place)
                    .WithMany(p => p.PlaceImages)
                    .HasForeignKey(d => d.PlaceId)
                    .OnDelete(DeleteBehavior.Cascade)
                    .HasConstraintName("FK_PlaceImages_Places");
            });

            modelBuilder.Entity<Itinerary>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).ValueGeneratedOnAdd();
                entity.Property(e => e.StartDate).IsRequired();
                entity.Property(e => e.EndDate).IsRequired();

                entity.HasOne(i => i.Project)
                    .WithMany(p => p.Itineraries)
                    .HasForeignKey(i => i.ProjectId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<ItineraryDay>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).ValueGeneratedOnAdd();
                entity.Property(e => e.DayDate).IsRequired();
                entity.Property(e => e.StartTime).HasDefaultValue(new TimeSpan(8, 0, 0));
                entity.Property(e => e.EndTime).HasDefaultValue(new TimeSpan(16, 0, 0));

                entity.HasOne(id => id.Itinerary)
                    .WithMany(i => i.ItineraryDays)
                    .HasForeignKey(id => id.ItineraryId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<ItineraryDayPlaceModel>(entity =>
            {
                entity.HasKey(idp => new { idp.ItineraryDayId, idp.PlaceId });

                entity.Property(idp => idp.Order).IsRequired();

                entity.HasOne(idp => idp.ItineraryDay)
                    .WithMany(id => id.ItineraryDayPlaces)
                    .HasForeignKey(idp => idp.ItineraryDayId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(idp => idp.Place)
                    .WithMany(p => p.ItineraryDayPlaces)
                    .HasForeignKey(idp => idp.PlaceId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<TransportMode>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).HasMaxLength(25).IsRequired();
                entity.HasIndex(e => e.Name).IsUnique();
            });

            modelBuilder.Entity<ItineraryDayTransportSegment>(entity =>
            {
                entity.HasKey(e => new { e.ItineraryDayId, e.FromPlaceId, e.ToPlaceId });

                entity.HasOne(e => e.ItineraryDay)
                      .WithMany()
                      .HasForeignKey(e => e.ItineraryDayId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.FromPlace)
                      .WithMany()
                      .HasForeignKey(e => e.FromPlaceId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.ToPlace)
                      .WithMany()
                      .HasForeignKey(e => e.ToPlaceId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.TransportMode)
                      .WithMany(t => t.TransportSegments)
                      .HasForeignKey(e => e.TransportModeId)
                      .OnDelete(DeleteBehavior.Restrict);
            });
        }

        /// <summary>
        /// Přidá nového uživatele do databáze.
        /// </summary>
        /// <param name="user">Uživatel, který má být přidán.</param>
        /// <returns>Vrací true, pokud bylo přidání úspěšné, jinak false.</returns>
        public async Task<bool> AddUserAsync(User user)
        {
            try
            {
                await Users.AddAsync(user);

                await SaveChangesAsync();

                return true;
            }
            catch (Exception)
            {
                return false;
            }
        }

        /// <summary>
        /// Zkontroluje, zda je e-mail již využíván jiným uživatelem.
        /// </summary>
        /// <param name="email">E-mailová adresa určená ke kontrole.</param>
        /// <returns>Vrací true, pokud je e-mail již použit, jinak false.</returns>
        public async Task<bool> IsEmailTakenAsync(string email)
        {
            return await Users.AnyAsync(u => u.Email == email);
        }

        /// <summary>
        /// Zkontroluje, zda je uživatelské jméno již využíváno.
        /// </summary>
        /// <param name="username">Uživatelské jméno určené ke kontrole.</param>
        /// <returns>Vrací true, pokud je uživatelské jméno již použito, jinak false.</returns>
        public async Task<bool> IsUsernameTakenAsync(string username)
        {
            return await Users.AnyAsync(u => u.Username == username);
        }

        /// <summary>
        /// Aktualizuje informace o uživateli v databázi.
        /// </summary>
        /// <param name="user">Objekt upraveného uživatele s aktualizovanými údaji.</param>
        /// <returns>Vrací true, pokud byla aktualizace úspěšná, jinak false.</returns>
        public async Task<bool> UpdateUserAsync(User user)
        {
            try
            {
                Users.Update(user);

                await SaveChangesAsync();

                return true;
            }
            catch (Exception)
            {
                return false;
            }
        }

        /// <summary>
        /// Získá uživatele na základě jeho uživatelského jména.
        /// </summary>
        /// <param name="username">Uživatelské jméno hledaného uživatele.</param>
        /// <returns>Vrací objekt uživatele, pokud je nalezen. Pokud nalezen není, vrátí null.</returns>
        public async Task<User?> GetUserByUsernameAsync(string username)
        {
            return await Users.FirstOrDefaultAsync(u => u.Username == username);
        }

        /// <summary>
        /// Získá uživatele na základě jeho e-mailu.
        /// </summary>
        /// <param name="username">E-mail hledaného uživatele.</param>
        /// <returns>Vrací objekt uživatele, pokud je nalezen. Pokud nalezen není, vrátí null.</returns>
        public async Task<User?> GetUserByUsernameByEmailAsync(string email)
        {
            return await Users.FirstOrDefaultAsync(u => u.Email == email);
        }

        /// <summary>
        /// Načte všechny projekty pro daného uživatele.
        /// </summary>
        /// <param name="userId">ID uživatele, jehož projekty mají být načteny.</param>
        /// <returns>Vrací seznam projektů, které patří danému uživateli, při neúspěchu null</returns>
        public async Task<List<ProjectModel>?> GetProjectsAsync(int userId)
        {
            try
            {
                return await Projects.Where(p => p.UserId == userId)
                                         .AsSingleQuery()
                                         .ToListAsync();
            }
            catch (Exception)
            {
                return null;
            }
        }

        /// <summary>
        /// Načte projekt na základě jeho ID.
        /// </summary>
        /// <param name="id">ID projektu, který má být načten.</param>
        /// <returns>Vrací objekt projektu, pokud je nalezen. Pokud nalezen není, vrátí null.</returns>
        public async Task<ProjectModel?> GetProjectById(int id)
        {
            return await Projects.FirstOrDefaultAsync(p => p.Id == id);
        }

        /// <summary>
        /// Načte projekt včetně jeho itinerářů a dní.
        /// </summary>
        /// <param name="projectId">ID projektu, který má být načten.</param>
        /// <returns>Vrací objekt projektu s itineráři a dny, pokud je nalezen. Pokud nalezen není, vrátí null.</returns>
        public async Task<ProjectModel?> GetProjectByIdAll(int projectId)
        {
            return await Projects
                .Include(p => p.Itineraries)
                .ThenInclude(i => i.ItineraryDays)
                .FirstOrDefaultAsync(p => p.Id == projectId);
        }

        /// <summary>
        /// Načte místo na základě jeho ID.
        /// </summary>
        /// <param name="id">ID místa, které má být načteno.</param>
        /// <returns>Vrací objekt místa, pokud je nalezen. Pokud nalezen není, vrátí null.</returns>
        public async Task<PlaceModel?> GetPlaceById(int id)
        {
            return await Places.FirstOrDefaultAsync(p => p.Id == id);
        }

        /// <summary>
        /// Načte uživatele na základě jeho ID.
        /// </summary>
        /// <param name="id">ID uživatele, který má být načten.</param>
        /// <returns>Vrací objekt uživatele, pokud je nalezen. Pokud nalezen není, vrátí null.</returns>
        public async Task<User?> GetUserById(int id)
        {
            return await Users.FirstOrDefaultAsync(u => u.Id == id);
        }

        /// <summary>
        /// Odstraní projekt a všechny jeho související záznamy.
        /// </summary>
        /// <param name="project">Objekt projektu, který má být odstraněn.</param>
        /// <returns>Vrací true, pokud bylo odstranění úspěšné. Pokud nalezen není, vrátí null.</returns>
        public async Task<bool> RemoveProjectAsync(ProjectModel project)
        {
            var strategy = Database.CreateExecutionStrategy();

            return await strategy.ExecuteAsync(async () =>
            {
                await using var transaction = await Database.BeginTransactionAsync();

                try
                {
                    var itinerariesToRemove = await Itineraries
                        .Where(i => i.ProjectId == project.Id)
                        .ToListAsync();

                    foreach (var itinerary in itinerariesToRemove)
                    {
                        var itineraryDays = await ItineraryDays
                            .Where(d => d.ItineraryId == itinerary.Id)
                            .ToListAsync();

                        var itineraryDayIds = itineraryDays.Select(d => d.Id).ToList();

                        var itineraryDayPlaces = await ItineraryDayPlaces
                            .Where(idp => itineraryDayIds.Contains(idp.ItineraryDayId))
                            .ToListAsync();
                        ItineraryDayPlaces.RemoveRange(itineraryDayPlaces);

                        ItineraryDays.RemoveRange(itineraryDays);
                    }

                    Itineraries.RemoveRange(itinerariesToRemove);

                    var placesToRemove = await Places
                        .Where(p => p.ProjectId == project.Id)
                        .ToListAsync();

                    foreach (var place in placesToRemove)
                    {
                        if (place == null)
                        {
                            continue;
                        }

                        var placeTags = await PlaceTags
                            .Where(pt => pt.PlaceId == place.Id)
                            .ToListAsync();
                        PlaceTags.RemoveRange(placeTags);

                        var itineraryDayPlaces = await ItineraryDayPlaces
                            .Where(idp => idp.PlaceId == place.Id)
                            .ToListAsync();
                        ItineraryDayPlaces.RemoveRange(itineraryDayPlaces);

                        var placeImages = await PlaceImages
                            .Where(pi => pi.PlaceId == place.Id)
                            .ToListAsync();
                        PlaceImages.RemoveRange(placeImages);
                    }

                    Places.RemoveRange(placesToRemove);
                    Projects.Remove(project);

                    await SaveChangesAsync();
                    await transaction.CommitAsync();

                    return true;
                }
                catch
                {
                    await transaction.RollbackAsync();
                    return false;
                }
            });
        }

        /// <summary>
        /// Přidá nový projekt do databáze.
        /// </summary>
        /// <param name="project">Objekt projektu, který má být přidán.</param>
        /// <returns>Vrací přidaný projekt nebo null v případě chyby.</returns>
        public async Task<ProjectModel?> AddProjectAsync(ProjectModel project)
        {
            try
            {
                var entity = await Projects.AddAsync(project);
                await SaveChangesAsync();

                return entity.Entity;
            }
            catch (Exception)
            {
                return null;
            }
        }

        /// <summary>
        /// Načte všechna místa pro daný projekt.
        /// </summary>
        /// <param name="projectId">ID projektu, pro který mají být načtena místa.</param>
        /// <returns>Vrací seznam míst nebo null v případě chyby.</returns>
        public async Task<List<PlaceModel>?> GetPlacesAsync(int projectId)
        {
            try
            {
                return await Places
                        .Include(p => p.Project)
                        .Include(p => p.PlaceImages)
                        .Include(p => p.PlaceTags)
                        .ThenInclude(pt => pt.Tag)
                        .Where(x => x.ProjectId == projectId)
                        .ToListAsync();
            }
            catch (Exception)
            {
                return null;
            }
        }

        /// <summary>
        /// Načte všechny tagy spojené s místy v daném projektu.
        /// </summary>
        /// <param name="projectId">ID projektu, pro který mají být načteny tagy.</param>
        /// <returns>Vrací seznam tagů nebo null v případě chyby.</returns>
        public async Task<List<Tag?>?> GetTagsByProjectIdAsync(int projectId)
        {
            try
            {
                var tags = await Places
                    .AsNoTracking()
                    .Where(p => p.ProjectId == projectId)
                    .SelectMany(p => p.PlaceTags)
                    .Select(pt => pt.Tag)
                    .Distinct()
                    .ToListAsync();

                return tags;
            }
            catch (Exception)
            {
                return null;
            }
        }

        /// <summary>
        /// Odstraní místo a všechny jeho související záznamy.
        /// </summary>
        /// <param name="place">Objekt místa, které má být odstraněno.</param>
        /// <returns>Vrací true, pokud bylo odstranění úspěšné. Pokud nalezen není, vrátí null.</returns>
        public async Task<bool> RemovePlaceAsync(PlaceModel place)
        {
            using var transaction = await Database.BeginTransactionAsync();

            try
            {
                var placeTags = await PlaceTags
                    .Where(pt => pt.PlaceId == place.Id)
                    .ToListAsync();

                PlaceTags.RemoveRange(placeTags);

                var itineraryDayPlaces = await ItineraryDayPlaces
                    .Where(idp => idp.PlaceId == place.Id)
                    .ToListAsync();

                ItineraryDayPlaces.RemoveRange(itineraryDayPlaces);

                var placeImages = await PlaceImages
                       .Where(pi => pi.PlaceId == place.Id)
                       .ToListAsync();
                PlaceImages.RemoveRange(placeImages);

                Places.Remove(place);

                await SaveChangesAsync();

                await transaction.CommitAsync();
                return true;
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                return false;
            }
        }

        /// <summary>
        /// Přidá nové místo do databáze.
        /// </summary>
        /// <param name="place">Objekt místa, které má být přidáno.</param>
        /// <returns>Vrací přidané místo nebo null v případě chyby.</returns>
        public async Task<PlaceModel?> AddPlaceAsync(PlaceModel place)
        {
            try
            {
                var entity = await Places.AddAsync(place);
                await SaveChangesAsync();

                return entity.Entity;
            }
            catch (Exception)
            {
                return null;
            }
        }

        /// <summary>
        /// Aktualizuje informace o místě v databázi.
        /// </summary>
        /// <param name="place">Objekt místa s aktualizovanými údaji.</param>
        /// <returns>Vrací true, pokud byla aktualizace úspěšná. Pokud nalezen není, vrátí null..</returns>
        public async Task<bool> UpdatePlaceAsync(PlaceModel place)
        {
            try
            {
                Places.Update(place);
                await SaveChangesAsync();

                return true;
            }
            catch (Exception)
            {
                return false;
            }

        }

        /// <summary>
        /// Aktualizuje seznam míst v databázi.
        /// </summary>
        /// <param name="places">Seznam objektů míst s aktualizovanými údaji.</param>
        /// <returns>Vrací true, pokud byla všechna místa úspěšně aktualizována. Jinak vrátí false.</returns>
        public async Task<bool> UpdatePlacesAsync(List<PlaceModel> places)
        {
            try
            {
                Places.UpdateRange(places);

                await SaveChangesAsync();

                return true;
            }
            catch (Exception)
            {
                return false;
            }
        }

        /// <summary>
        /// Přidá tag k místu, pokud tento vztah neexistuje.
        /// </summary>
        /// <param name="placeTag">Objekt PlaceTagModel představující vztah mezi místem a tagem.</param>
        /// <returns>Vrací true, pokud bylo přidání úspěšné. Pokud nalezen není, vrátí null.</returns>
        public async Task<bool> AddPlaceTagAsync(PlaceTagModel placeTag)
        {
            try
            {
                var place = await Places.FindAsync(placeTag.PlaceId);
                if (place == null)
                {
                    return false;
                }

                var tag = await Tags.FindAsync(placeTag.TagId);
                if (tag == null)
                {
                    return false;
                }

                var existingPlaceTag = await PlaceTags
                    .FirstOrDefaultAsync(pt => pt.PlaceId == placeTag.PlaceId && pt.TagId == placeTag.TagId);

                if (existingPlaceTag != null)
                {
                    return false;
                }

                await PlaceTags.AddAsync(placeTag);
                await SaveChangesAsync();
                return true;
            }
            catch (Exception)
            {
                return false;
            }
        }

        /// <summary>
        /// Načte itinerář včetně jeho dní a míst pro daný projekt.
        /// </summary>
        /// <param name="userId">ID uživatele.</param>
        /// <param name="projectId">ID projektu, pro který má být načten itinerář.</param>
        /// <returns>Vrací DTO s itinerářem, dny a místy nebo null v případě chyby.</returns>
        public async Task<ItineraryWithDaysAndPlacesDto?> GetItineraryWithDaysAndPlaces(int userId, int projectId)
        {
            return await Itineraries
                .AsNoTracking()
                .Where(i => i.ProjectId == projectId)
                .Select(i => new ItineraryWithDaysAndPlacesDto
                {
                    Id = i.Id,
                    ProjectId = i.ProjectId,
                    StartDate = i.StartDate,
                    EndDate = i.EndDate,
                    ItineraryDays = i.ItineraryDays != null ? i.ItineraryDays.Select(d => new ItineraryDayDto
                    {
                        Id = d.Id,
                        DayDate = d.DayDate,
                        StartTime = d.StartTime,
                        EndTime = d.EndTime,
                        Places = d.ItineraryDayPlaces != null ? d.ItineraryDayPlaces.OrderBy(p => p.Order).Select(p => new PlaceModelDTO
                        {
                            Id = (p.Place != null) ? p.Place.Id : 0,
                            Title = (p.Place != null) ? p.Place.Title : string.Empty,
                            Description = (p.Place != null) ? p.Place.Description : string.Empty,
                            Latitude = (p.Place != null) ? p.Place.Latitude : 0,
                            Longitude = (p.Place != null) ? p.Place.Longitude : 0,
                            VisitDuration = (p.Place != null) ? p.Place.VisitDuration : 0,
                            Order = p.Order,
                            OpeningHours = (p.Place != null) ? p.Place.OpeningHours : "",
                            Website = (p.Place != null) ? p.Place.Website : "",
                            Tags = (p.Place != null && p.Place.PlaceTags != null) ? p.Place.PlaceTags.Select(t => new TagModelDTO
                            {
                                Name = (t.Tag != null) ? t.Tag.Name : string.Empty,
                                Color = (t.Tag != null) ? t.Tag.Color : string.Empty
                            }).ToList() : new List<TagModelDTO>()
                        }).ToList() : new List<PlaceModelDTO>()
                    }).ToList() : new List<ItineraryDayDto>()
                })
                .AsSplitQuery()
                .FirstOrDefaultAsync();
        }

        /// <summary>
        /// Načte místa pro konkrétní den v itineráři pro daný projekt.
        /// </summary>
        /// <param name="userId">ID uživatele, pro ověření uživatelských práv.</param>
        /// <param name="projectId">ID projektu, ve kterém se nachází itinerář.</param>
        /// <param name="dayId">ID konkrétního dne itineráře, pro který se načítají místa.</param>
        /// <returns>Vrací seznam DTO modelů míst (PlaceModelDTO) pro konkrétní den nebo null v případě, že den neexistuje.</returns>
        public async Task<List<PlaceModelDTO>?> GetPlacesDay(int userId, int projectId, int dayId)
        {
            var itineraryDay = await Itineraries
                .AsNoTracking()
                .Where(i => i.ProjectId == projectId)
                .SelectMany(i => i.ItineraryDays)
                .Where(d => d.Id == dayId)
                .Select(d => d.ItineraryDayPlaces != null ? d.ItineraryDayPlaces.OrderBy(p => p.Order).Select(p => new PlaceModelDTO
                {
                    Id = p.Place != null ? p.Place.Id : 0,
                    Title = p.Place != null ? p.Place.Title : string.Empty,
                    Description = p.Place != null ? p.Place.Description : string.Empty,
                    Latitude = p.Place != null ? p.Place.Latitude : 0,
                    Longitude = p.Place != null ? p.Place.Longitude : 0,
                    Order = p.Order,
                    VisitDuration = p.Place != null ? p.Place.VisitDuration : null,
                    OpeningHours = p.Place != null ? p.Place.OpeningHours : string.Empty,
                    Website = p.Place != null ? p.Place.Website : string.Empty,
                    PlaceImages = p.Place != null && p.Place.PlaceImages != null
                        ? p.Place.PlaceImages.Select(pi => new PlaceImageModelDTO
                        {
                            Id = pi.Id,
                            ImageUrl = pi.ImageUrl
                        }).ToList()
                        : new List<PlaceImageModelDTO>(),
                    Tags = p.Place != null && p.Place.PlaceTags != null
                        ? p.Place.PlaceTags.Select(t => new TagModelDTO
                        {
                            Name = t.Tag != null ? t.Tag.Name : string.Empty,
                            Color = t.Tag != null ? t.Tag.Color : string.Empty
                        }).ToList()
                        : new List<TagModelDTO>()
                }).ToList()
                : new List<PlaceModelDTO>())
                .FirstOrDefaultAsync();

            return itineraryDay;
        }


        /// <summary>
        /// Získá den itineráře podle jeho ID.
        /// Pokud den s daným ID neexistuje, vrátí <c>null</c>.
        /// </summary>
        /// <param name="dayId">ID dne itineráře.</param>
        /// <returns>Den itineráře nebo null pokud den s daným ID nebyl nalezen.</returns>
        public async Task<ItineraryDay?> GetItineraryDayById(int dayId)
        {
            return await ItineraryDays.FirstOrDefaultAsync(p => p.Id == dayId);
        }

        /// <summary>
        /// Aktualizuje existující projekt v databázi.
        /// Uloží změny do databáze a vrátí <c>true</c>, pokud byla operace úspěšná.
        /// V případě chyby vrátí <c>false</c>.
        /// </summary>
        /// <param name="project">Projekt, který má být aktualizován.</param>
        /// <returns>True pokud byla aktualizace úspěšná. Pokud úspěšná nebyla, vrátí null.</returns>
        public async Task<bool> UpdateProjectAsync(ProjectModel project)
        {
            try
            {
                Projects.Update(project);
                await SaveChangesAsync();

                return true;
            }
            catch (Exception)
            {
                return false;
            }
        }

        /// <summary>
        /// Zkontroluje, zda je e-mail již přiřazen jinému uživateli.
        /// Pokud e-mail patří jinému uživateli než aktuálně přihlášenému, vrátí <c>true</c>.
        /// </summary>
        /// <param name="email">E-mailová adresa k ověření.</param>
        /// <param name="currentUserId">ID aktuálního uživatele.</param>
        /// <returns>True, pokud e-mail patří jinému uživateli, jinak false.</returns>
        public async Task<bool> IsEmailTakenByAnotherUserAsync(string email, int currentUserId)
        {
            return await Users.AnyAsync(u => u.Email == email && u.Id != currentUserId);
        }

        /// <summary>
        /// Získá itinerář podle ID projektu.
        /// Vrátí itinerář včetně dní a míst pro každý den.
        /// Pokud itinerář neexistuje, vrátí <c>null</c>.
        /// </summary>
        /// <param name="userId">ID uživatele vlastnícího projekt.</param>
        /// <param name="projectId">ID projektu.</param>
        /// <returns>Itinerář nebo null, pokud itinerář s daným ID neexistuje.</returns>
        public async Task<Itinerary?> GetItineraryByProjectIdAsync(int userId, int projectId)
        {
            try
            {
                var itinerary = await Itineraries
                    .AsNoTracking()
                    .Include(i => i.ItineraryDays)
                        .ThenInclude(id => id.ItineraryDayPlaces)
                            .ThenInclude(idp => idp.Place)
                    .FirstOrDefaultAsync(i => i.ProjectId == projectId);

                return itinerary;
            }
            catch (Exception)
            {
                return null;
            }
        }

        /// <summary>
        /// Odstraní den itineráře podle jeho ID.
        /// Pokud den s daným ID existuje, odstraní ho a uloží změny do databáze.
        /// </summary>
        /// <param name="dayId">ID dne itineráře, který má být odstraněn.</param>
        public async Task RemoveItineraryDayAsync(int dayId)
        {
            try
            {
                var day = await ItineraryDays.FirstOrDefaultAsync(p => p.Id == dayId);

                if (day != null)
                {
                    ItineraryDays.Remove(day);

                    await SaveChangesAsync();
                }
            }
            catch (Exception)
            {
                throw new Exception($"Failed to remove itinerary day with ID {dayId}. It may not exist.");
            }
        }

        /// <summary>
        /// Získá místo v daném dni itineráře podle ID místa a ID dne.
        /// Pokud místo v daném dni neexistuje, vrátí <c>null</c>.
        /// </summary>
        /// <param name="placeId">ID místa.</param>
        /// <param name="itineraryDayId">ID dne itineráře.</param>
        /// <returns>Místo v itineráři nebo null, pokud nebylo nalezeno.</returns>
        public async Task<ItineraryDayPlaceModel?> GetItineraryDayPlaceAsync(int placeId, int itineraryDayId)
        {
            return await ItineraryDayPlaces
                .FirstOrDefaultAsync(x => x.PlaceId == placeId && x.ItineraryDayId == itineraryDayId);
        }

        /// <summary>
        /// Získá nejvyšší hodnotu pořadí (Order) pro místa v den itineráře.
        /// Pokud v daném dni neexistují žádná místa, vrátí 0.
        /// </summary>
        /// <param name="id">ID dne itineráře (ItineraryDayId).</param>
        /// <returns>Nejvyšší hodnota pořadí (Order) nebo 0, pokud v daném dni nejsou žádná místa.</returns>
        public async Task<int> GetMaxOrderNumberAsync(int id)
        {
            var places = await ItineraryDayPlaces.Where(p => p.ItineraryDayId == id).ToListAsync();

            if (!places.Any())
            {
                return 0;
            }
            return places.Max(p => p.Order);
        }

        public async Task<bool> UpdatePlaceImage(int imageId, string newImageUrl)
        {
            try
            {
                var image = await PlaceImages.FirstOrDefaultAsync(img => img.Id == imageId);
                if (image == null)
                {
                    return false;
                }
                image.ImageUrl = newImageUrl;
                await SaveChangesAsync();
                return true;
            }
            catch (Exception)
            {
                return false;
            }
        }

        public async Task<bool> InsertPlaceImage(int placeId, string imageUrl)
        {
            try
            {
                var newImage = new PlaceImageModel
                {
                    PlaceId = placeId,
                    ImageUrl = imageUrl
                };
                await PlaceImages.AddAsync(newImage);
                await SaveChangesAsync();
                return true;
            }
            catch (Exception)
            {
                return false;
            }
        }

        public async Task<PlaceImageModel?> GetPlaceImageById(int imageId, int placeId)
        {
            return await PlaceImages.FirstOrDefaultAsync(img => img.Id == imageId && img.PlaceId == placeId);
        }

        public async Task<bool> UpdateDayTimes(int userId, int projectId, int dayId, string startTime, string endTime)
        {
            var day = await ItineraryDays.FirstOrDefaultAsync(d => d.Id == dayId);

            if (day == null)
            {
                return false;
            }

            var projectExists = await Projects.AnyAsync(p => p.Id == projectId);

            if (!projectExists)
            {
                return false;
            }

            if (TimeSpan.TryParse(startTime, out TimeSpan start) && TimeSpan.TryParse(endTime, out TimeSpan end))
            {
                day.StartTime = start;
                day.EndTime = end;
                await SaveChangesAsync();

                return true;
            }
            else
            {
                return false;
            }
        }

        public async Task<List<ItineraryDayPlaceModel>> GetItineraryDayPlacesByDayId(int dayId)
        {
            try
            {
                return await ItineraryDayPlaces
                    .Where(p => p.ItineraryDayId == dayId)
                    .ToListAsync();
            }
            catch (Exception)
            {
                return new List<ItineraryDayPlaceModel>();
            }
        }

        public async Task<bool> RemoveItineraryDayPlaces(List<ItineraryDayPlaceModel> places)
        {
            try
            {
                ItineraryDayPlaces.RemoveRange(places);
                await SaveChangesAsync();
                return true;
            }
            catch (Exception)
            {
                return false;
            }
        }

        public async Task<List<ItineraryDayTransportSegment>> GetTransportSegmentsForProject(int userId, int projectId, List<int> dayIds)
        {
            return await ItineraryDayTransportSegments
                .Include(s => s.TransportMode)
                .Include(s => s.FromPlace)
                .Include(s => s.ToPlace)
                .Where(s =>
                    dayIds.Contains(s.ItineraryDayId) &&
                    s.ItineraryDay != null &&
                    s.ItineraryDay.Itinerary.ProjectId == projectId)
                .ToListAsync();
        }
    }
}
