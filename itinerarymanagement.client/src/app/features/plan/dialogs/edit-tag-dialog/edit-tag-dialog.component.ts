import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogClose, MatDialogContent } from '@angular/material/dialog';
import { Tag } from '../../../../models/project/place-tag';
import { FormValidators } from '../../../../shared/validators/form-validators';
import { MatIconButton, MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { MatFormField, MatLabel, MatInput, MatError } from '@angular/material/input';

@Component({
    selector: 'app-edit-tag-dialog',
    templateUrl: './edit-tag-dialog.component.html',
    styleUrl: './edit-tag-dialog.component.css',
    standalone: true,
    imports: [MatDialogTitle, MatIconButton, MatDialogClose, MatIcon, CdkScrollable, MatDialogContent, FormsModule, ReactiveFormsModule, MatFormField, MatLabel, MatInput, MatError, MatButton]
})
export class EditTagDialogComponent {
  private readonly fb = inject(FormBuilder);
  public dialogRef = inject(MatDialogRef<EditTagDialogComponent>);
  public data = inject<Tag>(MAT_DIALOG_DATA);

  public colorHex = this.data.color || '#000000';
  public editForm: FormGroup = this.fb.group({
    name: [this.data.name, Validators.required],
    colorHex: [this.data.color || this.colorHex, [Validators.required, FormValidators.hexColor()]]
  });

  public error = '';
  get name() { return this.editForm.get('name'); }
  get colorHexControl() { return this.editForm.get('colorHex'); }

  public onColorHexChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.colorHex = input.value;
    this.editForm.get('colorHex')?.setValue(this.colorHex, { emitEvent: true });
  }

  public onColorPickerChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.colorHex = input.value;
    this.editForm.get('colorHex')?.setValue(this.colorHex, { emitEvent: true });
  }

  public saveChanges(): void {
    if (this.editForm.valid) {
      this.dialogRef.close(this.editForm.value);
    }
  }
}
