using ItineraryManagement.Server.Helpers;

namespace ItineraryManagement.Server.Models.Route
{
    public class RouteRequest
    {
        public float StartLat { get; set; }
        public float StartLon { get; set; }
        public float EndLat { get; set; }
        public float EndLon { get; set; }
        public VehicleType VehicleType { get; set; } = VehicleType.Pedestrian;
    }
}
