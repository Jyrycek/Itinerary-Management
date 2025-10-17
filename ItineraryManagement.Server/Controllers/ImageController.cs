using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
using SixLabors.ImageSharp.Formats.Webp;
using ItineraryManagement.Server.Services;
using ItineraryManagement.Server.Models;
using SkiaSharp;
using Svg.Skia;
using Microsoft.Extensions.Options;

namespace ItineraryManagement.Server.Controllers
{
    [Route("api/dashboard/project/thumbnail/"), ApiController]
    public class ImageController : ControllerBase
    {
        private readonly IMemoryCache _cache;
        private readonly DatabaseManager _databaseManager;
        private readonly UploadService _uploadService;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ImageService _imageService;

        private readonly AppSettings _appSettings;
        public ImageController(IMemoryCache cache, DatabaseManager databaseManager, UploadService uploadService, IHttpClientFactory httpClientFactory, ImageService imageService, IOptions<AppSettings> config)
        {
            _cache = cache;
            _databaseManager = databaseManager;
            _uploadService = uploadService;
            _httpClientFactory = httpClientFactory;
            _imageService = imageService;
            _appSettings = config.Value;
        }

        [HttpGet("{imageId}")]
        public async Task<IActionResult> GetThumbnail(int imageId, int width = 300, int height = 200, int maxWidth = 0, int maxHeight = 0, [FromHeader(Name = "Referer")] string? referer = null)
        {
            if (string.IsNullOrEmpty(referer) || !_appSettings.AllowedReferers.Any(r => referer.StartsWith(r)))
            {
                return Unauthorized("Neplatný referer");
            }

            try
            {
                string defaultThumbnailCacheKey = $"Thumbnail_{imageId}_300x300";
                string requestedThumbnailCacheKey = $"Thumbnail_{imageId}_{width}x{height}_max{maxWidth}x{maxHeight}";

                if (_cache.TryGetValue(requestedThumbnailCacheKey, out byte[]? cachedThumbnail))
                {
                    if (cachedThumbnail == null) return NotFound();

                    return File(cachedThumbnail, "image/webp");
                }

                if (_cache.TryGetValue(defaultThumbnailCacheKey, out byte[]? cachedDefaultThumbnail))
                {
                    if (cachedDefaultThumbnail == null) return NotFound();

                    using var defaultStream = new MemoryStream(cachedDefaultThumbnail);
                    using var defaultImage = await SixLabors.ImageSharp.Image.LoadAsync(defaultStream);

                    (width, height) = _imageService.CalculateResizeDimensions(defaultImage.Width, defaultImage.Height, width, height, maxWidth, maxHeight);

                    defaultImage.Mutate(x => x.Resize(width, height));

                    using var thumbnailStream = new MemoryStream();
                    await defaultImage.SaveAsWebpAsync(thumbnailStream, new WebpEncoder());

                    byte[] thumbnailBytes = thumbnailStream.ToArray();
                    _cache.Set(requestedThumbnailCacheKey, thumbnailBytes, TimeSpan.FromMinutes(15));

                    return File(thumbnailBytes, "image/webp");
                }

                var image = _databaseManager.PlaceImages.FirstOrDefault(img => img.Id == imageId);

                if (image == null || string.IsNullOrEmpty(image.ImageUrl))
                {
                    return NotFound();
                }

                string imageUrl = image.ImageUrl;
                if (imageUrl.EndsWith(".svg", StringComparison.OrdinalIgnoreCase))
                {
                    string svgCacheKey = $"Thumbnail_{imageId}_SVG_{width}x{height}";

                    if (_cache.TryGetValue(svgCacheKey, out byte[]? cachedSvgThumbnail))
                    {
                        if (cachedSvgThumbnail == null)
                            return NotFound();

                        return File(cachedSvgThumbnail, "image/webp");
                    }

                    var client = _httpClientFactory.CreateClient();
                    client.DefaultRequestHeaders.Add("User-Agent", "ItineraryManagement/1.0");

                    string svgData = await client.GetStringAsync(imageUrl);

                    // Načtení SVG pomocí SkiaSharp
                    using var svg = new SKSvg();
                    svg.Load(svgData);

                    var picture = svg.Picture;
                    if (picture == null)
                    {
                        return BadRequest("SVG soubor neobsahuje platný obrázek.");
                    }

                    var bounds = picture.CullRect;
                    int originalWidth = (int)bounds.Width;
                    int originalHeight = (int)bounds.Height;

                    (width, height) = _imageService.CalculateResizeDimensions(originalWidth, originalHeight, width, height, maxWidth, maxHeight);

                    using var bitmap = new SKBitmap(width, height);
                    using (var canvas = new SKCanvas(bitmap))
                    {
                        canvas.Clear(SKColors.Transparent);
                        canvas.DrawPicture(picture);
                    }

                    using var imageStream = new MemoryStream();
                    using (var skData = bitmap.Encode(SKEncodedImageFormat.Png, 100))
                    {
                        skData.SaveTo(imageStream);
                    }

                    imageStream.Seek(0, SeekOrigin.Begin);

                    using var imageSharpImage = await SixLabors.ImageSharp.Image.LoadAsync(imageStream);
                    using var webpStream = new MemoryStream();

                    await imageSharpImage.SaveAsWebpAsync(webpStream, new WebpEncoder());

                    byte[] svgThumbnail = webpStream.ToArray();

                    _cache.Set(requestedThumbnailCacheKey, svgThumbnail, TimeSpan.FromMinutes(15));
                    _cache.Set(svgCacheKey, svgThumbnail, TimeSpan.FromMinutes(15));

                    return File(svgThumbnail, "image/webp");
                }


                if (imageUrl.StartsWith("https://jirigengelastorage.blob.core.windows.net/webimages/"))
                {
                    Uri blobUri = new Uri(imageUrl);
                    string blobName = blobUri.AbsolutePath.TrimStart('/');
                    blobName = blobName.Replace(_appSettings.BlobStorage.ContainerRoot, "");

                    string sasTokenUrl = _uploadService.GenerateSasToken(blobName);
                    imageUrl = sasTokenUrl;
                }

                byte[]? originalImageBytes;
                if (!_cache.TryGetValue($"OriginalImage_{imageId}", out originalImageBytes) || originalImageBytes == null)
                {
                    var client = _httpClientFactory.CreateClient();
                    client.DefaultRequestHeaders.Add("User-Agent", "ItineraryManagement/1.0");

                    originalImageBytes = await client.GetByteArrayAsync(imageUrl);
                    _cache.Set($"OriginalImage_{imageId}", originalImageBytes, TimeSpan.FromMinutes(10));
                }

                if (originalImageBytes == null)
                {
                    return BadRequest("Image data is null");
                }

                using var originalStream = new MemoryStream(originalImageBytes);
                using var imageSharp = await SixLabors.ImageSharp.Image.LoadAsync(originalStream);

                int defaultWidth = 300;
                int defaultHeight = (int)(defaultWidth / ((float)imageSharp.Width / imageSharp.Height));
                (width, height) = _imageService.CalculateResizeDimensions(imageSharp.Width, imageSharp.Height, width, height, maxWidth, maxHeight);

                imageSharp.Mutate(x => x.Resize(defaultWidth, defaultHeight));

                using var defaultThumbnailStream = new MemoryStream();
                await imageSharp.SaveAsWebpAsync(defaultThumbnailStream, new WebpEncoder());

                byte[] defaultThumbnailBytes = defaultThumbnailStream.ToArray();
                _cache.Set(defaultThumbnailCacheKey, defaultThumbnailBytes, TimeSpan.FromMinutes(30));

                if (width == 300 && height == defaultHeight)
                {
                    return File(defaultThumbnailBytes, "image/webp");
                }

                using var defaultStream2 = new MemoryStream(defaultThumbnailBytes);
                using var defaultImage2 = await SixLabors.ImageSharp.Image.LoadAsync(defaultStream2);

                defaultImage2.Mutate(x => x.Resize(width, height));

                using var thumbnailStream2 = new MemoryStream();
                await defaultImage2.SaveAsWebpAsync(thumbnailStream2, new WebpEncoder());

                byte[] finalThumbnailBytes = thumbnailStream2.ToArray();
                _cache.Set(requestedThumbnailCacheKey, finalThumbnailBytes, TimeSpan.FromMinutes(15));

                return File(finalThumbnailBytes, "image/webp");
            }
            catch
            {
                var image = _databaseManager.PlaceImages.FirstOrDefault(img => img.Id == imageId);
                if (image == null || string.IsNullOrEmpty(image.ImageUrl))
                {
                    return NotFound("Obrázek nenalezen.");
                }

                string imageUrl = image.ImageUrl;

                if (imageUrl.StartsWith($"{_appSettings.BlobStorage.BaseUrl}/{_appSettings.BlobStorage.ContainerRoot}"))
                {
                    Uri blobUri = new Uri(imageUrl);
                    string blobName = blobUri.AbsolutePath.TrimStart('/');
                    blobName = blobName.Replace(_appSettings.BlobStorage.ContainerRoot, "");

                    imageUrl = _uploadService.GenerateSasToken(blobName);
                }

                try
                {
                    var fallbackClient = _httpClientFactory.CreateClient();
                    fallbackClient.DefaultRequestHeaders.Add("User-Agent", "ItineraryManagement/1.0");

                    var response = await fallbackClient.GetAsync(imageUrl);
                    if (!response.IsSuccessStatusCode)
                    {
                        return NotFound("Nepodařilo se načíst původní obrázek");
                    }

                    byte[] originalImage = await response.Content.ReadAsByteArrayAsync();
                    string contentType = response.Content.Headers.ContentType?.MediaType ?? "application/octet-stream";

                    _cache.Set($"OriginalImage_{imageId}", originalImage, TimeSpan.FromMinutes(10));

                    return File(originalImage, contentType);
                }
                catch
                {
                    return NotFound("Nepodařilo se načíst původní obrázek");
                }
            }
        }


        [HttpPost("popup/image-thumbnail")]
        public async Task<IActionResult> GetImageThumbnail([FromBody] ImageRequest request, int width = 300, int height = 200, int maxWidth = 0, int maxHeight = 0)
        {
            string imageUrl = request.ImageUrl;

            if (string.IsNullOrEmpty(imageUrl))
            {
                return BadRequest("URL obrázku není platná.");
            }

            string cacheKey = $"ImageThumbnail_{imageUrl}_{width}x{height}_max{maxWidth}x{maxHeight}";

            if (_cache.TryGetValue(cacheKey, out byte[]? cachedThumbnail))
            {
                if (cachedThumbnail != null)
                {
                    return File(cachedThumbnail, "image/webp");
                }
                else
                {
                    return NotFound();
                }
            }

            try
            {
                var client = _httpClientFactory.CreateClient();
                client.DefaultRequestHeaders.Add("User-Agent", "ItineraryManagement/1.0");

                imageUrl = Uri.UnescapeDataString(imageUrl);

                byte[] imageBytes = await client.GetByteArrayAsync(imageUrl);

                using var imageStream = new MemoryStream(imageBytes);

                SixLabors.ImageSharp.Image image;
                try
                {
                    image = await SixLabors.ImageSharp.Image.LoadAsync(imageStream);
                }
                catch (SixLabors.ImageSharp.UnknownImageFormatException)
                {
                    return BadRequest("Neplatný formát obrázku nebo obrázek nelze načíst.");
                }
                catch (Exception ex)
                {
                    return StatusCode(500, $"Neočekávaná chyba při načítání obrázku: {ex.Message}");
                }

                int originalWidth = image.Width;
                int originalHeight = image.Height;
                float aspectRatio = (float)originalWidth / originalHeight;

                if (maxWidth > 0 || maxHeight > 0)
                {
                    if (maxWidth > 0 && maxHeight > 0)
                    {
                        float scale = Math.Min((float)maxWidth / originalWidth, (float)maxHeight / originalHeight);
                        width = (int)(originalWidth * scale);
                        height = (int)(originalHeight * scale);
                    }
                    else if (maxWidth > 0)
                    {
                        width = maxWidth;
                        height = (int)(maxWidth / aspectRatio);
                    }
                    else if (maxHeight > 0)
                    {
                        height = maxHeight;
                        width = (int)(maxHeight * aspectRatio);
                    }
                }

                image.Mutate(x => x.Resize(width, height));

                using var thumbnailStream = new MemoryStream();
                await image.SaveAsWebpAsync(thumbnailStream, new WebpEncoder());

                byte[] thumbnailBytes = thumbnailStream.ToArray();

                _cache.Set(cacheKey, thumbnailBytes, TimeSpan.FromMinutes(15));

                return File(thumbnailBytes, "image/webp");
            }
            catch
            {
                try
                {
                    var fallbackClient = _httpClientFactory.CreateClient();
                    fallbackClient.DefaultRequestHeaders.Add("User-Agent", "ItineraryManagement/1.0");

                    imageUrl = Uri.UnescapeDataString(imageUrl);
                    var response = await fallbackClient.GetAsync(imageUrl);

                    if (!response.IsSuccessStatusCode)
                    {
                        return NotFound("Nepodařilo se načíst původní obrázek");
                    }

                    byte[] originalImage = await response.Content.ReadAsByteArrayAsync();
                    string? contentType = response.Content.Headers.ContentType?.MediaType ?? "application/octet-stream";

                    _cache.Set($"OriginalImage_{imageUrl}", originalImage, TimeSpan.FromMinutes(10));

                    return File(originalImage, contentType);
                }
                catch (Exception ex)
                {
                    return NotFound("Nepodařilo se načíst ani původní obrázek " + ex);
                }
            }
        }

    }
}
