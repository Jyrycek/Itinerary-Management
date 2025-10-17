import { Injectable, inject } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  private readonly toastr = inject(ToastrService);

  public showNotification(message: string, type: 'success' | 'error' | 'info' = 'success'): void {
    if (type === 'success') {
      this.toastr.success(message, 'Úspěch!', {
        positionClass: 'toast-top-center',
        timeOut: 2500,
        progressBar: true,
        toastClass: 'ngx-toastr toast-top-center custom-toast'
      });
    } else if (type === 'error') {
      this.toastr.error(message, 'Chyba!', {
        positionClass: 'toast-top-center',
        timeOut: 3000,
        progressBar: true,
        toastClass: 'ngx-toastr toast-top-center custom-toast'
      });
    } else if (type === 'info') {
      this.toastr.info(message, 'Informace', {
        positionClass: 'toast-top-center',
        timeOut: 2500,
        progressBar: true,
        toastClass: 'ngx-toastr toast-top-center custom-toast'
      });
    }
  }
}
