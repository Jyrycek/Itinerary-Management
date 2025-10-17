import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogTitle, MatDialogClose, MatDialogContent } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { UserService } from '../../core/services/user.service';
import { HttpErrorResponse } from '@angular/common/http';
import { MatIconButton, MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { MatFormField, MatLabel, MatInput, MatError } from '@angular/material/input';

@Component({
    selector: 'app-change-password',
    templateUrl: './change-password.component.html',
    styleUrls: ['./change-password.component.css'],
    standalone: true,
    imports: [MatDialogTitle, MatIconButton, MatDialogClose, MatIcon, CdkScrollable, MatDialogContent, FormsModule, ReactiveFormsModule, MatFormField, MatLabel, MatInput, MatError, MatButton]
})
export class ChangePasswordComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  public dialogRef = inject(MatDialogRef<ChangePasswordComponent>);

  changePasswordForm: FormGroup = this.fb.group({});
  error: string | null = null;

  ngOnInit(): void {
    this.changePasswordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(5)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(5)]]
    }, { validators: this.passwordsMatch });
  }

  private passwordsMatch(group: FormGroup) {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { mismatch: true };
  }

  get currentPassword() { return this.changePasswordForm.get('currentPassword'); }
  get newPassword() { return this.changePasswordForm.get('newPassword'); }
  get confirmPassword() { return this.changePasswordForm.get('confirmPassword'); }

  async onSubmit() {

    if (this.changePasswordForm.invalid) {
      const errors = this.changePasswordForm.errors;
      if (errors?.['mismatch']) {
        this.error = 'Hesla se neshodují';
      } else {
        this.error = 'Prosím, vyplňte všechny požadované údaje správně.';
      }
      return;
    }

    const { currentPassword, newPassword } = this.changePasswordForm.value;

    try {
      await firstValueFrom(this.userService.changePassword(currentPassword, newPassword));
      this.dialogRef.close(true);
    } catch (err) {
      if (err instanceof HttpErrorResponse) {
        this.error = err.error.message;
      } else {
        this.error = "Nastala neznámá chyba";
      }
    }
  }
}
