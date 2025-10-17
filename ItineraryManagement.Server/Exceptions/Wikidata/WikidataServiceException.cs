namespace ItineraryManagement.Server.Exceptions.Wikidata
{
    public class WikidataServiceException : Exception
    {
        public WikidataServiceException(string message, Exception? innerException = null) : base(message, innerException)
        {
        }
    }
}
