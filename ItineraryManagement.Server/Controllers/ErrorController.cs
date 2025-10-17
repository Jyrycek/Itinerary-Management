using Microsoft.AspNetCore.Mvc;

namespace ItineraryManagement.Server.Controllers
{
    [ApiController, Route("")]
    public class ErrorController : ControllerBase
    {
        [HttpGet("error")]
        public IActionResult HandleError()
        {
            return Problem("Na serveru došlo k chybě. Zkuste to prosím znovu později.");
        }
    }
}
