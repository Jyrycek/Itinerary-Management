namespace ItineraryManagement.Server.Exceptions
{
    public class PasswordAlreadyChangedException : Exception
    {
        public PasswordAlreadyChangedException() : base("Heslo již bylo změněno") { }
    }
}
