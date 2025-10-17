using ItineraryManagement.Server.Exceptions;
using NetTopologySuite.Geometries;
using NetTopologySuite.IO;
using System.Text.Json;

namespace ItineraryManagement.Server.Services
{
    public class GeoService
    {
        private readonly Geometry? _czechRepublicPolygon;

        private const double MinLat = 48.55;
        private const double MaxLat = 51.06;
        private const double MinLon = 12.09;
        private const double MaxLon = 18.86;

        public GeoService(string geoJsonFilePath)
        {
            try
            {
                var reader = new GeoJsonReader();

                var geoJsonText = File.ReadAllText(geoJsonFilePath);
                var featureCollection = JsonSerializer.Deserialize<JsonElement>(geoJsonText);

                if (featureCollection.TryGetProperty("geometry", out var geometry))
                {
                    _czechRepublicPolygon = reader.Read<Geometry>(geometry.ToString());
                }
                else if (featureCollection.TryGetProperty("features", out var features))
                {
                    var geometryJson = features[0].GetProperty("geometry").ToString();
                    _czechRepublicPolygon = reader.Read<Geometry>(geometryJson);
                }else
                {
                    throw new GeoLoadingException("Soubor GeoJSON neobsahuje platný vstup");
                }
            }
            catch (Exception ex)
            {
                throw new GeoLoadingException($"Chyba při načítání GeoJSON souboru '{geoJsonFilePath}'", ex);
            }
        }

        public bool IsInsideCzechRepublic(double latitude, double longitude)
        {
            if (_czechRepublicPolygon != null)
            {
                var point = new Point(longitude, latitude);
                if (_czechRepublicPolygon.Contains(point))
                {
                    return true;
                }
                
                return false;
                
            }
            return latitude >= MinLat && latitude <= MaxLat && longitude >= MinLon && longitude <= MaxLon;
        }
    }
}
