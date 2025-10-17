namespace ItineraryManagement.Server.Exceptions
{
    public class TokenExpiredException : Exception
    {
        public TokenExpiredException() : base("Platnost odkazu pro obnovení vypršela") { }
    }
}
