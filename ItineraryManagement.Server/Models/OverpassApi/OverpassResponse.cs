using Newtonsoft.Json;

namespace ItineraryManagement.Server.Models.OverpassApi
{
    public class OverpassResponse
    {
        public List<Element>? Elements { get; set; }
    }
    public class Element
    {
        public string? Id { get; set; }
        public string? Type { get; set; }
        public double? Lat { get; set; }
        public double? Lon { get; set; }
        public Tags? Tags { get; set; }
        public List<string>? Nodes { get; set; }
        public bool AreCoordinatesCertain { get; set; } = true;
    }
    public class Tags
    {
        public bool isPageId { get; set; } = false;
        private string? _wikipedia;
        public string? Name { get; set; }

        [JsonProperty("name:en")]
        public string? NameEn { get; set; }

        [JsonProperty("name:cs")]
        public string? NameCz { get; set; }
        public string? Description { get; set; }
        [JsonProperty("description:en")]
        public string? DescriptionEn { get; set; }
        [JsonProperty("opening_hours")]
        public string? OpeningHours { get; set; }
        public string? Website { get; set; }
        public string? Wikidata { get; set; }
        public string? Wikipedia
        {
            get => _wikipedia;
            set
            {
                _wikipedia = value;
                if (!string.IsNullOrEmpty(value) && value.Contains(":"))
                {
                    lang = value.Split(':')[0];
                    _wikipedia = value.Split(':')[1];
                }
                else
                {
                    lang = null;
                }
            }
        }
        public string? lang { get; set; }
    }
}
