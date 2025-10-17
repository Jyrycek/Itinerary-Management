using ItineraryManagement.Server.Exceptions;
using SendGrid;
using SendGrid.Helpers.Mail;

namespace ItineraryManagement.Server.Services
{
    public class EmailService
    {
        private readonly string _sendGridApiKey;
        private readonly string _emailFrom;
        private readonly string _templatePath;

        public EmailService(IConfiguration configuration)
        {
            _sendGridApiKey = configuration["SENDGRIDAPIKEY"]
                ?? throw new ArgumentNullException(nameof(configuration), "Chyba připojovacího řetězce SENDGRIDAPIKEY v key vault");
            _emailFrom = configuration["EmailSender"]
                ?? throw new ArgumentNullException(nameof(configuration), "Chyba připojovacího řetězce EmailSender v key vault");

            _templatePath = Path.Combine(AppContext.BaseDirectory, "EmailTemplates", "reset-password.html");
        }

        public async Task SendPasswordResetEmailAsync(string toEmail, string link)
        {
            var client = new SendGridClient(_sendGridApiKey);
            var from = new EmailAddress(_emailFrom, "Itineráře - obnovení hesla");
            var subject = "Obnovení hesla";
            var to = new EmailAddress(toEmail);

            string htmlTemplate = await File.ReadAllTextAsync(_templatePath);

            string htmlContent = htmlTemplate.Replace("{{resetLink}}", link);

            var plainTextContent = $"Dobrý den,\n\nObdrželi jsme žádost o obnovení hesla pro váš účet. Pokud jste to byli vy, klikněte prosím na následující odkaz pro nastavení nového hesla:\n{link}\n\nPokud jste žádost o obnovení hesla neprováděli, můžete tento e-mail ignorovat.\n\nDěkujeme, že používáte naši službu.";

            var msg = MailHelper.CreateSingleEmail(from, to, subject, plainTextContent, htmlContent);

            var response = await client.SendEmailAsync(msg);

            if (response.StatusCode != System.Net.HttpStatusCode.Accepted)
            {
                throw new EmailSendingException($"Email not sent to {toEmail}. Status code: {response.StatusCode}", toEmail, response.StatusCode);
            }
        }
    }
}
