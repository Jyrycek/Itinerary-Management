import { Component, inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogTitle, MatDialogClose, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Place } from '../../../../models/project/place-project';
import { DataService } from '../../../../core/services/data.service';
import { MatIconButton, MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { MatFormField, MatLabel } from '@angular/material/input';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/autocomplete';

@Component({
    selector: 'app-route-settings-dialog',
    templateUrl: './route-settings-dialog.component.html',
    styleUrls: ['./route-settings-dialog.component.css'],
    standalone: true,
    imports: [MatDialogTitle, MatIconButton, MatDialogClose, MatIcon, CdkScrollable, MatDialogContent, FormsModule, ReactiveFormsModule, MatFormField, MatLabel, MatSelect, MatOption, MatDialogActions, MatButton]
})
export class RouteSettingsDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dataService = inject(DataService);
  private readonly dialogRef = inject(MatDialogRef<RouteSettingsDialogComponent>);
  private readonly data = inject(MAT_DIALOG_DATA);

  routeForm: FormGroup;
  places : Place[] = this.data.places;

  constructor() {
    const lastSelection = this.dataService.getLastSelection();

    this.routeForm = this.fb.group({
      startLocation: [lastSelection?.startLocation || null],
      endLocation: [lastSelection?.endLocation || null],
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
