using Itinero;
using Itinero.IO.Osm;
using ItineraryManagement.Server.Models.Route;
using Itinero.Profiles;
using ItineraryManagement.Server.Exceptions;
using ItineraryManagement.Server.Helpers;


namespace ItineraryManagement.Server.Services
{
    public class RouteService
    {
        private readonly IVehicleFactory _vehicleFactory = new VehicleFactory();

        private readonly RouterDb _routerDbPedestrian;
        private readonly RouterDb _routerDbCar;
        private readonly RouterDb _routerDbBicycle;


        private const string OsmFilePath = "czech-republic-latest.osm.pbf";
        private readonly GeoService _geoService;

        public RouteService(GeoService geoService)
        {
            _geoService = geoService ?? throw new ArgumentNullException(nameof(geoService));

            var pedestrianTask = Task.Run(() => LoadOrCreateRouterDb(_vehicleFactory.GetRouterDbPath(VehicleType.Pedestrian), VehicleType.Pedestrian));
            var carTask = Task.Run(() => LoadOrCreateRouterDb(_vehicleFactory.GetRouterDbPath(VehicleType.Car), VehicleType.Car));
            var bicycleTask = Task.Run(() => LoadOrCreateRouterDb(_vehicleFactory.GetRouterDbPath(VehicleType.Bicycle), VehicleType.Bicycle));

            Task.WaitAll(pedestrianTask, carTask, bicycleTask);

            _routerDbPedestrian = pedestrianTask.Result;
            _routerDbCar = carTask.Result;
            _routerDbBicycle = bicycleTask.Result;
        }

        private static RouterDb LoadOrCreateRouterDb(string routerDbPath, VehicleType vehicle)
        {
            Vehicle vehicleUsed = vehicle switch
            {
                VehicleType.Car => Itinero.Osm.Vehicles.Vehicle.Car,
                VehicleType.Bicycle => Itinero.Osm.Vehicles.Vehicle.Bicycle,
                VehicleType.Pedestrian => Itinero.Osm.Vehicles.Vehicle.Pedestrian,
                _ => Itinero.Osm.Vehicles.Vehicle.Pedestrian
            };

            try
            {
                if (File.Exists(routerDbPath))
                {
                    using var stream = new FileStream(routerDbPath, FileMode.Open, FileAccess.Read, FileShare.Read, 4096, true);
                    return RouterDb.Deserialize(stream);
                }
                else
                {
                    if (!File.Exists(OsmFilePath))
                    {
                        throw new FileNotFoundException($"OSM file not found at path: {OsmFilePath}");
                    }

                    var routerDb = new RouterDb();

                    using (var stream = new FileStream(OsmFilePath, FileMode.Open, FileAccess.Read, FileShare.Read, 4096, true))
                    {
                        routerDb.LoadOsmData(stream, vehicleUsed);
                    }

                    using (var writeStream = new FileStream(routerDbPath, FileMode.Create, FileAccess.Write, FileShare.None, 4096, true))
                    {
                        routerDb.Serialize(writeStream);
                    }

                    return routerDb;
                }
            }
            catch (Exception ex)
            {
                throw new RouterDbInitializationException(vehicle, $"Error initializing RouterDb for {vehicle}: {ex.Message}", ex);
            }
        }


        public async Task<List<RouteResponse>?> GetRoute(float startLat, float startLon, float endLat, float endLon, VehicleType vehicleType = VehicleType.Pedestrian)
        {
            return await Task.Run(() =>
            {
                RouterDb routerDb = vehicleType switch
                {
                    VehicleType.Car => _routerDbCar,
                    VehicleType.Bicycle => _routerDbBicycle,
                    VehicleType.Pedestrian => _routerDbPedestrian,
                    _ => _routerDbPedestrian
                };

                var router = new Router(routerDb);
                var start = new Itinero.LocalGeo.Coordinate(startLat, startLon);
                var end = new Itinero.LocalGeo.Coordinate(endLat, endLon);

                bool isOutsideCzechRepublic = !_geoService.IsInsideCzechRepublic(startLat, startLon);

                if (isOutsideCzechRepublic)
                {
                    return new List<RouteResponse>
                    {
                    new RouteResponse { Latitude = startLat, Longitude = startLon },
                    new RouteResponse { Latitude = endLat, Longitude = endLon }
                    };
                }

                var vehicle = _vehicleFactory.GetVehicle(vehicleType);

                var result = router.TryCalculate(vehicle.Fastest(), start, end);

                if (!result.IsError)
                {
                    return result.Value.Shape.Select(point => new RouteResponse
                    {
                        Latitude = point.Latitude,
                        Longitude = point.Longitude
                    }).ToList();
                }

                return new List<RouteResponse>
                {
                new RouteResponse { Latitude = startLat, Longitude = startLon },
                new RouteResponse { Latitude = endLat, Longitude = endLon }
                };
            });
        }

        public static double HaversineDistance(double lat1, double lon1, double lat2, double lon2)
        {
            const double R = 6371;
            var dLat = (lat2 - lat1) * (Math.PI / 180);
            var dLon = (lon2 - lon1) * (Math.PI / 180);

            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                    Math.Cos(lat1 * (Math.PI / 180)) * Math.Cos(lat2 * (Math.PI / 180)) *
                    Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

            return R * 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        }
    }
}
