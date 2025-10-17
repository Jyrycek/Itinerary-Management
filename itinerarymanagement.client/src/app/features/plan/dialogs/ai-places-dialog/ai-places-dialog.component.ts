import { Component, inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogTitle, MatDialogClose, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIconButton, MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { MatFormField, MatLabel, MatInput, MatHint, MatError } from '@angular/material/input';

@Component({
    selector: 'app-ai-places-dialog',
    templateUrl: './ai-places-dialog.component.html',
    styleUrls: ['./ai-places-dialog.component.css'],
    standalone: true,
    imports: [MatDialogTitle, MatIconButton, MatDialogClose, MatIcon, CdkScrollable, MatDialogContent, FormsModule, ReactiveFormsModule, MatFormField, MatLabel, MatInput, MatHint, MatError, MatDialogActions, MatButton]
})
export class AiPlacesDialogComponent {
  private readonly fb = inject(FormBuilder);
  public dialogRef = inject(MatDialogRef<AiPlacesDialogComponent>);
  private readonly data = inject<{ query: string }>(MAT_DIALOG_DATA);

  public aiQueryForm: FormGroup = this.fb.group({
    query: [
      this.data.query,
      [
        Validators.required,
        Validators.maxLength(200),
        Validators.pattern(/^[a-zA-Z0-9\s.,()\-\u00C0-\u017F]+$/)
      ]
    ]
  });

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    if (this.aiQueryForm.valid) {
      this.dialogRef.close(this.aiQueryForm.value.query);
    }
  }
}
