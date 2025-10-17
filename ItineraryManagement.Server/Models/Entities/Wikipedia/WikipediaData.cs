using ItineraryManagement.Server.Controllers;

namespace ItineraryManagement.Server.Models.Wikipedia
{
    public class WikipediaData
    {
        public WikipediaArticle? Article { get; set; }
        public List<string>? WikidataImage { get; set; }
    }
}
