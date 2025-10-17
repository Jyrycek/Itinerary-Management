import { Component, OnInit, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FileUploadService } from '../../../core/services/common/file-upload.service';
import { NotificationService } from '../../../core/services/common/notification.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { firstValueFrom } from 'rxjs';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIconButton, MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { NgClass } from '@angular/common';
import { MatTooltip } from '@angular/material/tooltip';
import { MatFormField, MatLabel, MatInput, MatPrefix, MatError, MatSuffix } from '@angular/material/input';
import { MatDateRangeInput, MatStartDate, MatEndDate, MatDatepickerToggle, MatDateRangePicker } from '@angular/material/datepicker';
import { MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
    selector: 'app-create-plan',
    templateUrl: './create-plan.component.html',
    styleUrl: './create-plan.component.css',
    standalone: true,
  imports: [FormsModule, ReactiveFormsModule, MatIconButton, MatIcon, NgClass, MatTooltip, MatFormField, MatLabel, MatInput, MatPrefix, MatError, MatDateRangeInput, MatStartDate, MatEndDate, MatDatepickerToggle, MatSuffix, MatDateRangePicker, MatButton, TranslatePipe, MatNativeDateModule ],
    providers: [
      provideNativeDateAdapter(),
  ]
})

export class CreatePlanComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly fileUploadService = inject(FileUploadService);
  private readonly notificationService = inject(NotificationService);
  private readonly dashboardService = inject(DashboardService);

  public dialogRef = inject(MatDialogRef<CreatePlanComponent>);
  public planData = inject<any>(MAT_DIALOG_DATA);

  isEditMode = false;
  imageUrl: string | null = null;
  projectId: number | undefined;

  public planForm: FormGroup = this.fb.group({
    destination: ['', [Validators.required, Validators.maxLength(100)]],
    dateRange: this.fb.group(
      {
        startDate: [null, Validators.required],
        endDate: [null, Validators.required]
      },
      { validators: this.dateRangeValidator }
    )
  });


  ngOnInit(): void {
    if (!this.planData) return;

    this.isEditMode = true;
    this.imageUrl = this.planData.imageUrl || null;
    this.projectId = this.planData.id;

    this.planForm.patchValue({
      destination: this.planData.title,
      dateRange: {
        startDate: new Date(this.planData.startDate),
        endDate: new Date(this.planData.endDate)
      }
    });

  }

  private dateRangeValidator(formGroup: FormGroup): Record<string, boolean> | null {
    const startDate = formGroup.get('startDate')?.value;
    const endDate = formGroup.get('endDate')?.value;
    return startDate && endDate && startDate > endDate ? { 'invalidDateRange': true } : null;
  }

  startPlanning(): void {
    if (!this.planForm.valid) return;

    const formValue = this.planForm.value;
    this.dialogRef.close({
      destination: formValue.destination,
      startDate: formValue.dateRange.startDate,
      endDate: formValue.dateRange.endDate
    });

  }

  public async onFileChange(event: any) {
    const selectedFile = event.target.files[0];

    if (!selectedFile) return;
    if (!this.fileUploadService.validateFile(selectedFile)) return;

    try {
      const uploadedImageUrl: any = await firstValueFrom(this.dashboardService.uploadProjectImage(this.projectId!, selectedFile));
      this.notificationService.showNotification('Projektový obrázek byl úspěšně změněn');

      this.imageUrl = uploadedImageUrl.imageUrl;

    } catch (err) {
      this.notificationService.showNotification('Nastala chyba při změně obrázku projektu', 'error');
      console.error('Error uploading image', err);
    }
  }
}
