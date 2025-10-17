import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NotificationService } from '../../../core/services/common/notification.service';
import { UserService } from '../../../core/services/user.service';
import { firstValueFrom } from 'rxjs/internal/firstValueFrom';
import { MatCard, MatCardHeader, MatCardTitle, MatCardContent } from '@angular/material/card';
import { MatFormField, MatLabel, MatPrefix, MatInput, MatError } from '@angular/material/input';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
    selector: 'app-password-reset',
    templateUrl: './password-reset.component.html',
    styleUrls: ['./password-reset.component.css'],
    standalone: true,
    imports: [MatCard, MatCardHeader, MatCardTitle, MatCardContent, FormsModule, ReactiveFormsModule, MatFormField, MatLabel, MatIcon, MatPrefix, MatInput, MatError, MatButton, TranslatePipe]
})
export class PasswordResetComponent implements OnInit {
  resetForm: FormGroup;
  token: string | null = null;
  email: string | null = null;
  error: string | null = null;

  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);
  private readonly notificationService = inject(NotificationService);

  constructor() {
    this.resetForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(5)]],
      confirmPassword: ['', Validators.required]
    }, { validator: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || null;
      this.email = params['email'] || null;
    });
  }

  get password() {
    return this.resetForm.get('password');
  }

  get confirmPassword() {
    return this.resetForm.get('confirmPassword');
  }

  private passwordMatchValidator(formGroup: FormGroup): void {
    const password = formGroup.get('password')?.value;
    const confirmPassword = formGroup.get('confirmPassword')?.value;
    if (password !== confirmPassword) {
      formGroup.get('confirmPassword')?.setErrors({ 'mismatch': true });
    } else {
      formGroup.get('confirmPassword')?.setErrors(null);
    }
  }

  async resetPassword(): Promise<void> {
    if (this.resetForm.invalid) return;

    const newPassword = this.password?.value;

    try {
      await firstValueFrom(this.userService.resetPassword(this.token!, this.email!, newPassword));
      this.notificationService.showNotification("Heslo bylo úspěšně změněno");
      this.router.navigate(['/login']);
    } catch (err: unknown) {
      this.error = (err instanceof Error && err.message) || 'Došlo k chybě při resetování hesla. Zkuste to prosím znovu.';
      console.error('Error:', err);
    }
  }
}
