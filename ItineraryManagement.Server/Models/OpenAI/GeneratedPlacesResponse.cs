namespace ItineraryManagement.Server.Models.OpenAI
{
    public class GeneratedPlacesResponse
    {
        public List<GeneratedPlaces> Places { get; set; }
    }

    public class GeneratedPlaces
    {
        public string Name { get; set; }
        public double Longitude { get; set; }
        public double Latitude { get; set; }
        public string Description { get; set; }
    }
}
