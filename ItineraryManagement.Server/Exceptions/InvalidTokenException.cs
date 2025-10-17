namespace ItineraryManagement.Server.Exceptions
{
    public class InvalidTokenException : Exception
    {
        public InvalidTokenException(string message) : base(message) { }
    }
}
