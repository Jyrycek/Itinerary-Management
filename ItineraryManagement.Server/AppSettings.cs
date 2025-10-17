namespace ItineraryManagement.Server
{
    public class AppSettings
    {
        public required string JwtPrivateKey { get; set; }
        public required string PasswordKey { get; set; }
        public ImagesConfig Images { get; set; } = new();
        public BlobStorageConfig BlobStorage { get; set; } = new();
        public List<string> AllowedReferers { get; set; } = new();

    }
    public class ImagesConfig
    {
        public string DefaultProfileImageUrl { get; set; } = string.Empty;
        public string DefaultProjectImageUrl { get; set; } = string.Empty;
        public string DefaultPlaceImageUrl { get; set; } = string.Empty;
    }
    public class BlobStorageConfig
    {
        public string BaseUrl { get; set; } = string.Empty;
        public string ContainerRoot { get; set; } = string.Empty;
        public string ContainerRootWithoutSlash { get; set; } = string.Empty;
        public string ProfileImagesPath { get; set; } = string.Empty;
        public string PlaceImagesPath { get; set; } = string.Empty;
        public string ProjecteImagesPath { get; set; } = string.Empty;
    }


}
