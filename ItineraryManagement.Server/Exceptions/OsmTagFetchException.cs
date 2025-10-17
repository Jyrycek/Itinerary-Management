namespace ItineraryManagement.Server.Exceptions
{
    public class OsmTagFetchException : Exception
    {
        public OsmTagFetchException() { }

        public OsmTagFetchException(string message) : base(message) { }

        public OsmTagFetchException(string message, Exception inner) : base(message, inner) { }
    }

}
