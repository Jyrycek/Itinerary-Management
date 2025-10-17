using System.Net;

namespace ItineraryManagement.Server.Exceptions
{
    public class EmailSendingException: Exception
    {
        public string RecipientEmail { get; }
        public HttpStatusCode StatusCode { get; }

        public EmailSendingException(string message, string recipientEmail, HttpStatusCode statusCode)
            : base(message)
        {
            RecipientEmail = recipientEmail;
            StatusCode = statusCode;
        }

        public EmailSendingException(string message, string recipientEmail, HttpStatusCode statusCode, Exception innerException)
            : base(message, innerException)
        {
            RecipientEmail = recipientEmail;
            StatusCode = statusCode;
        }
    }
}
