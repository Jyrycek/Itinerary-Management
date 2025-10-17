import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'customDate', standalone: true })
export class ProfileDatePipe implements PipeTransform {
  transform(value: string | Date): string {
    if (!value) return '';

    const date = new Date(value);
    return date.toLocaleDateString('cs-CZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
