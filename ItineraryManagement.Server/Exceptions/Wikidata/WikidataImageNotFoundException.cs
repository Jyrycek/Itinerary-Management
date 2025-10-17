namespace ItineraryManagement.Server.Exceptions.Wikidata
{
    public class WikidataImageNotFoundException : Exception 
    {
        public WikidataImageNotFoundException(string placeName): base($"No image found for place: {placeName}")
        {
        }
    }
}
