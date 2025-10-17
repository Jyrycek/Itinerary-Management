import { inject, Injectable } from '@angular/core';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  private readonly maxFileSize = 20 * 1024 * 1024; // 20 MB
  private readonly allowedFileTypes = ['image/jpeg', 'image/png', 'image/jpg'];

  private readonly notificationService = inject(NotificationService);

  validateFile(file: File): boolean {
    if (!this.allowedFileTypes.includes(file.type)) {
      this.notificationService.showNotification('Nepovolený formát souboru! Povolené formáty jsou JPEG a PNG', 'error');
      return false;
    }

    if (file.size > this.maxFileSize) {
      this.notificationService.showNotification('Obrázek je větší než 20MB', 'error');
      return false;
    }

    return true;
  }
}
