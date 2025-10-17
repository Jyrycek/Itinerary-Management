using System.ComponentModel.DataAnnotations;

namespace ItineraryManagement.Server.Helpers
{
    [AttributeUsage(AttributeTargets.Property, AllowMultiple = false)]
    public class DateGreaterThanAttribute : ValidationAttribute
    {
        private readonly string _startDateProperty;

        public DateGreaterThanAttribute(string startDateProperty)
        {
            _startDateProperty = startDateProperty;
        }

        protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
        {
            var startDateProperty = validationContext.ObjectType.GetProperty(_startDateProperty);

            if (startDateProperty == null)
            {
                return new ValidationResult($"Property {_startDateProperty} not found.");
            }

            var startDate = startDateProperty.GetValue(validationContext.ObjectInstance) as DateTime?;
            var endDate = value as DateTime?;

            if (startDate.HasValue && endDate.HasValue && endDate <= startDate)
            {
                return new ValidationResult(ErrorMessage ?? "End date must be greater than start date.");
            }

            return ValidationResult.Success;
        }
    }
}