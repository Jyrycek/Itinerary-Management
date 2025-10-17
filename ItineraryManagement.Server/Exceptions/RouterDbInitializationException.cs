using ItineraryManagement.Server.Helpers;

namespace ItineraryManagement.Server.Exceptions
{
    public class RouterDbInitializationException : Exception
    {
        public VehicleType VehicleType { get; }
        public RouterDbInitializationException(VehicleType vehicleType, string message, Exception innerException) : base(message, innerException)
        {
            VehicleType = vehicleType;
        }
    }
}
