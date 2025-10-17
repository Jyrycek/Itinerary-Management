import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'timeFormat', standalone: true })
export class TimeFormatPipe implements PipeTransform {
  transform(timeString: string | null): string {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
  }
}
