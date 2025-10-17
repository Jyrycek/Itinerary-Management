namespace ItineraryManagement.Server.Services
{
    public class ImageService
    {
        public (int width, int height) CalculateResizeDimensions(int originalWidth, int originalHeight, int width, int height, int maxWidth, int maxHeight)
        {
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
            return (width, height);
        }
    }
}
