import { Component, inject } from '@angular/core';
import { MatDialogRef, MatDialogTitle, MatDialogClose, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { MatIconButton, MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { CdkScrollable } from '@angular/cdk/scrolling';

@Component({
    selector: 'app-confirm-dialog',
    templateUrl: './confirm-dialog.component.html',
    styleUrl: './confirm-dialog.component.css',
    standalone: true,
    imports: [MatDialogTitle, MatIconButton, MatDialogClose, MatIcon, CdkScrollable, MatDialogContent, MatDialogActions, MatButton]
})
export class ConfirmDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<ConfirmDialogComponent>);

  onSave(): void {
    this.dialogRef.close('save');
  }

  onDiscard(): void {
    this.dialogRef.close('discard');
  }

  onCancel(): void {
    this.dialogRef.close('cancel');
  }
}
