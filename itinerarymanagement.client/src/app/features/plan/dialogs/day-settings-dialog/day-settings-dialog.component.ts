import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogClose, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { MatIconButton, MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { MatFormField, MatLabel } from '@angular/material/input';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/autocomplete';

@Component({
    selector: 'app-day-settings-dialog',
    templateUrl: './day-settings-dialog.component.html',
    styleUrls: ['./day-settings-dialog.component.css'],
    standalone: true,
    imports: [MatDialogTitle, MatIconButton, MatDialogClose, MatIcon, CdkScrollable, MatDialogContent, FormsModule, ReactiveFormsModule, MatFormField, MatLabel, MatSelect, MatOption, MatDialogActions, MatButton]
})
export class DaySettingsDialogComponent {
  private readonly fb = inject(FormBuilder);
  public dialogRef = inject(MatDialogRef<DaySettingsDialogComponent>);
  public data = inject<{ startTime: string; endTime: string }>(MAT_DIALOG_DATA);

  public hours: string[] = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);

  public daySettingsForm: FormGroup = this.fb.group({
    startTime: [this.formatTime(this.data.startTime) || '00:00', Validators.required],
    endTime: [this.formatTime(this.data.endTime) || '00:00', Validators.required]
  });

  private formatTime(time: string): string {
    if (!time) return '';
    return time.substring(0, 5);
  }
  public onCancel(): void {
    this.dialogRef.close();
  }
}
