using Itinero.Profiles;

namespace ItineraryManagement.Server.Helpers
{
    public enum VehicleType
    {
        Pedestrian,
        Car,
        Bicycle
    }

    public interface IVehicleFactory
    {
        Vehicle GetVehicle(VehicleType type);
        string GetRouterDbPath(VehicleType type);
    }

    public class VehicleFactory : IVehicleFactory
    {
        public Vehicle GetVehicle(VehicleType type) => type switch
        {
            VehicleType.Car => Itinero.Osm.Vehicles.Vehicle.Car,
            VehicleType.Bicycle => Itinero.Osm.Vehicles.Vehicle.Bicycle,
            VehicleType.Pedestrian => Itinero.Osm.Vehicles.Vehicle.Pedestrian,
            _ => Itinero.Osm.Vehicles.Vehicle.Pedestrian
        };

        public string GetRouterDbPath(VehicleType type) => type switch
        {
            VehicleType.Car => "czech-republic-car.routerdb",
            VehicleType.Bicycle => "czech-republic-bicycle.routerdb",
            VehicleType.Pedestrian => "czech-republic-pedestrian.routerdb",
            _ => "czech-republic-pedestrian.routerdb"
        };
    }
}
