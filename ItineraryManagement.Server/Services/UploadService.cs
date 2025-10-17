using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Azure.Storage.Sas;
using SixLabors.ImageSharp.Formats.Webp;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
using Microsoft.Extensions.Options;

namespace ItineraryManagement.Server.Services
{
    public class UploadService
    {
        private readonly string _storageConnectionString;
        private readonly string _containerRoot;
        private readonly string _containerRootWithoutSlash;
        private readonly string _profileImagesPath;
        private readonly string _placeImagesPath;

        public UploadService(IConfiguration configuration, IOptions<AppSettings> config)
        {
            _storageConnectionString = configuration["AccountStorage"]
                ?? throw new ArgumentNullException(nameof(configuration), "Chyba připojovacího řetězce blob service");

            var blobConfig = config.Value.BlobStorage;
            _containerRoot = blobConfig.ContainerRoot;
            _profileImagesPath = blobConfig.ProfileImagesPath;
            _placeImagesPath = blobConfig.PlaceImagesPath;
            _containerRootWithoutSlash = blobConfig.ContainerRootWithoutSlash;
        }

        public static bool ValidateImage(IFormFile file, out string validationMessage)
        {
            if (file == null || file.Length == 0)
            {
                validationMessage = "Nebyl nahrán obrázek";
                return false;
            }

            if (file.Length > 20 * 1024 * 1024)
            {
                validationMessage = "Maximální velikost souboru překročena";
                return false;
            }

            var allowedTypes = new[] { "image/jpeg", "image/png", "image/jpg" };
            if (!allowedTypes.Contains(file.ContentType))
            {
                validationMessage = "Použijte obrázek typu jpeg nebo png";
                return false;
            }

            validationMessage = string.Empty;
            return true;
        }

        public async Task<string> UploadAsync(Stream fileStream, string fileName, string contentType)
        {
            using var image = await SixLabors.ImageSharp.Image.LoadAsync(fileStream);

            image.Mutate(x => x.Resize(300, 300));

            using var webpStream = new MemoryStream();
            await image.SaveAsWebpAsync(webpStream, new WebpEncoder());

            webpStream.Position = 0;

            var container = new BlobContainerClient(_storageConnectionString, _containerRootWithoutSlash);
            var createResponse = await container.CreateIfNotExistsAsync();
            if (createResponse != null && createResponse.GetRawResponse().Status == 201)
            {
                await container.SetAccessPolicyAsync(PublicAccessType.Blob);
            }

            var blob = container.GetBlobClient(fileName);
            await blob.DeleteIfExistsAsync(DeleteSnapshotsOption.IncludeSnapshots);
            await blob.UploadAsync(webpStream, new BlobHttpHeaders { ContentType = "image/webp" });

            return blob.Uri.ToString();
        }

        public async Task DeleteAsync(string fileName)
        {
            var container = new BlobContainerClient(_storageConnectionString, $"{_containerRoot}{_profileImagesPath}/");
            var blob = container.GetBlobClient($"{fileName}");

            await blob.DeleteIfExistsAsync(DeleteSnapshotsOption.IncludeSnapshots);
        }

        public async Task DeletePlaceImageAsync(string fileName)
        {
            var container = new BlobContainerClient(_storageConnectionString, $"{_containerRoot}{_placeImagesPath}/");
            var blob = container.GetBlobClient($"{fileName}");

            await blob.DeleteIfExistsAsync(DeleteSnapshotsOption.IncludeSnapshots);
        }

        public string GenerateSasToken(string blobName)
        {
            var container = new BlobContainerClient(_storageConnectionString, _containerRootWithoutSlash);
            var blobClient = container.GetBlobClient(blobName);

            if (!blobClient.CanGenerateSasUri)
                throw new InvalidOperationException("Blob client nemá povolenou možnost generovat SAS token");

            BlobSasBuilder sasBuilder = new BlobSasBuilder()
            {
                BlobContainerName = container.Name,
                BlobName = blobClient.Name,
                Resource = "b",
                ExpiresOn = DateTimeOffset.UtcNow.AddMinutes(90)
            };

            sasBuilder.SetPermissions(BlobSasPermissions.Read);

            Uri sasUri = blobClient.GenerateSasUri(sasBuilder);
            return sasUri.ToString();
        }
    }
}
