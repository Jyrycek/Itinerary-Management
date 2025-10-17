using ItineraryManagement.Server.Models.Coordinate;
using ItineraryManagement.Server.Models.Route;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ItineraryManagement.Server.Services;

namespace ItineraryManagement.Server.Controllers
{
    [Route("api/route"), ApiController, Authorize]
    public class RouteController : ControllerBase
    {
        private readonly RouteService _routeService;

        public RouteController(RouteService routeService)
        {
            _routeService = routeService;
        }

        [HttpPost("get-route")]
        public async Task<IActionResult> GetRoute([FromBody] RouteRequest request)
        {
            List<RouteResponse>? route = await _routeService.GetRoute(request.StartLat, request.StartLon, request.EndLat, request.EndLon, request.VehicleType);

            if (route == null || route.Count == 0)
            {
                return BadRequest("Route not found");
            }

            return Ok(route);
        }

        [HttpPost("calculate-distance-matrix")]
        public async Task<ActionResult> CalculateDistanceMatrix([FromBody] List<CoordinateRequest> coordinates)
        {
            if (coordinates == null || coordinates.Count < 2)
            {
                return BadRequest("At least two coordinates are required to calculate routes");
            }

            int n = coordinates.Count;
            var distanceMatrix = new double[n][];

            for (int i = 0; i < n; i++)
            {
                distanceMatrix[i] = new double[n];
                for (int j = 0; j < n; j++)
                {
                    if (i == j) distanceMatrix[i][j] = 0;
                    else distanceMatrix[i][j] = double.MaxValue;
                }
            }

            for (int i = 0; i < n; i++)
            {
                for (int j = i + 1; j < n; j++)
                {
                    var start = coordinates[i];
                    var end = coordinates[j];

                    var route = await _routeService.GetRoute(start.Latitude, start.Longitude, end.Latitude, end.Longitude);

                    if (route != null)
                    {
                        double routeDistance = 0;
                        for (int k = 1; k < route.Count; k++)
                        {
                            routeDistance += RouteService.HaversineDistance(route[k - 1].Latitude, route[k - 1].Longitude, route[k].Latitude, route[k].Longitude);
                        }

                        distanceMatrix[i][j] = routeDistance;
                        distanceMatrix[j][i] = routeDistance;
                    }
                }
            }

            return Ok(distanceMatrix);
        }
    }
}
