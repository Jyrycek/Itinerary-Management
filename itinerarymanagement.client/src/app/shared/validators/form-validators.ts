import { AbstractControl, ValidatorFn } from '@angular/forms';

export class FormValidators {
  public static latitude(): ValidatorFn {
    return (control: AbstractControl): Record<string, boolean> | null => {
      const value = parseFloat(control.value);
      if (isNaN(value) || value < -90 || value > 90) {
        return { latitudeInvalid: true };
      }
      return null;
    };
  }

  public static longitude(): ValidatorFn {
    return (control: AbstractControl): Record<string, boolean> | null => {
      const value = parseFloat(control.value);
      if (isNaN(value) || value < -180 || value > 180) {
        return { longitudeInvalid: true };
      }
      return null;
    };
  }
  public static hexColor(): ValidatorFn {
    return (control: AbstractControl): Record<string, any> | null => {
      const value = control.value;
      const isValidHex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(value);
      return isValidHex ? null : { invalidHexColor: { value } };
    };
  }
}
