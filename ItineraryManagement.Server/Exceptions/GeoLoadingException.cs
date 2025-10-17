namespace ItineraryManagement.Server.Exceptions
{
    public class GeoLoadingException : Exception
    {
        public GeoLoadingException(string message, Exception? innerException = null)
            : base(message, innerException)
        {
        }
    }
}
