import { Component, inject, OnInit } from '@angular/core';
import { Router } from "@angular/router";
import { AuthService } from '../../../core/services/auth/auth.service';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MatCard, MatCardHeader, MatCardTitle, MatCardContent } from '@angular/material/card';
import { MatFormField, MatLabel, MatPrefix, MatInput, MatError } from '@angular/material/input';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';
import { TranslatePipe } from '@ngx-translate/core';
import { HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrl: './login.component.css',
    standalone: true,
    imports: [MatCard, MatCardHeader, MatCardTitle, MatCardContent, FormsModule, ReactiveFormsModule, MatFormField, MatLabel, MatIcon, MatPrefix, MatInput, MatError, MatButton, TranslatePipe]
})
export class LoginComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  loginForm: FormGroup = this.fb.group({});
  error = "";

  ngOnInit() {
    console.log('Production:', environment.production);
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      password: ['', [Validators.required, Validators.minLength(5)]]
    });
  }
  get username() { return this.loginForm.get('username'); }
  get password() { return this.loginForm.get('password'); }

  async login(): Promise<void> {
    if (this.loginForm.valid) {
      const username = this.loginForm.get('username')?.value;
      const password = this.loginForm.get('password')?.value;

      try {
        await firstValueFrom(this.authService.login(username, password));
        this.router.navigate(['/dashboard']);
      } catch (err: unknown) {
        if (err instanceof HttpErrorResponse && err.error.message) {
          this.error = err.error?.message
        } else {
          this.error = "Nastala interní chyba při přihlašování";
        }
      }
    } else {
      this.error = "Vyplňte formulář";
    }

  }
}
