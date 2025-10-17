namespace ItineraryManagement.Server.Models.Wikipedia
{
    public class WikipediaArticle
    {
        public string? Title { get; set; }
        public string? Extract { get; set; }
        public Thumbnail? Thumbnail { get; set; }
    }
    public class Thumbnail
    {
        public string? Source { get; set; }
    }
}
