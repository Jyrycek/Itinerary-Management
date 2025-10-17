import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogTitle, MatDialogClose, MatDialogContent } from '@angular/material/dialog';
import { UserJson } from '../../models/user/user';
import { firstValueFrom } from 'rxjs';
import { UserService } from '../../core/services/user.service';
import { HttpErrorResponse } from '@angular/common/http';
import { MatIconButton, MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { MatFormField, MatPrefix, MatLabel, MatInput, MatError } from '@angular/material/input';

@Component({
    selector: 'app-edit-profile',
    templateUrl: './edit-profile.component.html',
    styleUrls: ['./edit-profile.component.css'],
    standalone: true,
    imports: [MatDialogTitle, MatIconButton, MatDialogClose, MatIcon, CdkScrollable, MatDialogContent, FormsModule, ReactiveFormsModule, MatFormField, MatPrefix, MatLabel, MatInput, MatError, MatButton]
})
export class EditProfileComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly dialogRef = inject(MatDialogRef<EditProfileComponent>);
  private readonly data = inject(MAT_DIALOG_DATA);

  editForm: FormGroup = this.fb.group({});
  error = '';

  ngOnInit(): void {
    this.editForm = this.fb.group({
      firstName: [this.data.firstName, Validators.required],
      lastName: [this.data.lastName, Validators.required],
      email: [this.data.email, [Validators.required, Validators.email]]
    });
  }

  get firstName() { return this.editForm.get('firstName'); }
  get lastName() { return this.editForm.get('lastName'); }
  get email() { return this.editForm.get('email'); }

  async saveChanges(): Promise<void> {
    if (this.editForm.valid) {
      const updatedUser: UserJson = this.editForm.value;
      updatedUser.username = this.data.username;

      try {
        await firstValueFrom(this.userService.updateUser(updatedUser));
        this.dialogRef.close(updatedUser);
      } catch (err) {
        if (err instanceof HttpErrorResponse && err.error && err.error.message) {
          this.error = err.error.message;
        } else {
          this.error = 'Chyba při aktualizaci uživatelských údajů.';
        }
      }
    } else {
      this.error = 'Vyplňte formulář správně.';
    }
  }
}
