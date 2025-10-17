import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth.service';
import { User } from '../../../models/user/user';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NotificationService } from '../../../core/services/common/notification.service';
import { firstValueFrom } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { MatCard, MatCardHeader, MatCardTitle, MatCardContent } from '@angular/material/card';
import { MatFormField, MatLabel, MatPrefix, MatInput, MatError } from '@angular/material/input';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
    selector: 'app-register',
    templateUrl: './register.component.html',
    styleUrl: './register.component.css',
    standalone: true,
    imports: [MatCard, MatCardHeader, MatCardTitle, MatCardContent, FormsModule, ReactiveFormsModule, MatFormField, MatLabel, MatIcon, MatPrefix, MatInput, MatError, MatButton, TranslatePipe]
})
export class RegisterComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notificationService = inject(NotificationService);

  user: User = new User("", "", "", "", "");
  registerForm: FormGroup = this.fb.group({});
  error = "";

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      password: ['', [Validators.required, Validators.minLength(5)]],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]]
    });
  }
  get username() { return this.registerForm.get('username'); }
  get password() { return this.registerForm.get('password'); }
  get firstName() { return this.registerForm.get('firstName'); }
  get lastName() { return this.registerForm.get('lastName'); }
  get email() { return this.registerForm.get('email'); }

  async register() {
    if (this.registerForm.valid) {
      const user: User = this.registerForm.value;
      try {
        await firstValueFrom(this.authService.register(user));
        this.router.navigate(['/login']);
        this.notificationService.showNotification("Registrace proběhla úspěšně");

      } catch (err: unknown) {
        if (err instanceof HttpErrorResponse) {
          if (err.error && err.error.message) {
            this.error = err.error.message;
          } else {
            this.error = "Nastala interní chyba při registraci";
          }
        } else {
          this.error = "Nastala interní chyba při registraci";
        }
        this.notificationService.showNotification("Registrace nebyla úspěšná", "error");
      }
    } else {
      this.error = "Vyplňte formulář";
    }
  }
}
