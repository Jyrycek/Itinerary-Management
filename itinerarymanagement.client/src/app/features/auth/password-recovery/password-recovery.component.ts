import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth/auth.service';
import { Router } from '@angular/router';
import { NotificationService } from '../../../core/services/common/notification.service';
import { UserService } from '../../../core/services/user.service';
import { firstValueFrom } from 'rxjs/internal/firstValueFrom';
import { MatCard, MatCardHeader, MatCardTitle, MatCardContent } from '@angular/material/card';
import { MatFormField, MatLabel, MatPrefix, MatInput, MatError } from '@angular/material/input';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
    selector: 'app-password-recovery',
    templateUrl: './password-recovery.component.html',
    styleUrls: ['./password-recovery.component.css'],
    standalone: true,
    imports: [MatCard, MatCardHeader, MatCardTitle, MatCardContent, FormsModule, ReactiveFormsModule, MatFormField, MatLabel, MatIcon, MatPrefix, MatInput, MatError, MatButton, TranslatePipe]
})
export class PasswordRecoveryComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notificationService = inject(NotificationService);
  private readonly userService = inject(UserService);

  forgotPasswordForm: FormGroup;
  error: string | null = null;

  constructor() {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  get email() {
    return this.forgotPasswordForm.get('email');
  }

  async requestPasswordReset(): Promise<void> {
    if (this.forgotPasswordForm.invalid) return;

    const email = this.email?.value;

    try {
      await firstValueFrom(this.userService.requestPasswordReset(email));
      this.notificationService.showNotification("Email pro obnovu hesla byl úspěšně odeslán");
      this.router.navigate(['/login']);
    } catch (err: unknown) {
      this.error = (err instanceof Error && err.message) || 'Došlo k neznámé chybě.';
      console.error('Error:', err);
    }
  }
}
