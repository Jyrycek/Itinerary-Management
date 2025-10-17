import { ChangeDetectorRef, Component, Input, output, inject } from '@angular/core';
import { Place } from '../../../models/project/place-project';
import { environment } from '../../../../environments/environment';
import { PlaceDetailDialogComponent } from '../../plan/dialogs/place-detail-dialog/place-detail-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatIconButton } from '@angular/material/button';

@Component({
    selector: 'app-map-popup',
    templateUrl: './map-popup.component.html',
    styleUrl: './map-popup.component.css',
    standalone: true,
    imports: [MatIcon, MatProgressSpinner, MatIconButton]
})
export class MapPopupComponent {
  public apiUrl: string = environment.apiUrl + '/dashboard/project/thumbnail/';

  @Input() place: Place | null = null;
  @Input() showButtons = true;

  readonly editPlace = output<Place>();
  readonly deletePlace = output<Place>();
  readonly hidePlace = output<Place>();

  public dialog = inject(MatDialog);
  private readonly cdr = inject(ChangeDetectorRef);

  public isLoading = true;

  public currentImageIndex = 0;

  public onEditPlace() {
    if (!this.place) return;
    this.editPlace.emit(this.place);
  }

  public onDeletePlace() {
    if (!this.place) return;
    this.deletePlace.emit(this.place);
  }

  public onClosePopup() {
    if (!this.place) return;
    this.hidePlace.emit(this.place);
  }

  nextImage() {
    if (this.place?.placeImages && this.place.placeImages.length > 1) {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.place.placeImages.length;
      this.isLoading = true;
      this.cdr.detectChanges();
    }
  }

  prevImage() {
    if (this.place?.placeImages && this.place.placeImages.length > 1) {
      this.currentImageIndex = (this.currentImageIndex - 1 + this.place.placeImages.length) % this.place.placeImages.length;
      this.isLoading = true;
      this.cdr.detectChanges();
    }
  }

  public openPlaceDetailDialog(place: Place): void {
    this.dialog.open(PlaceDetailDialogComponent, {
      minWidth: '60vw',
      data: place,
      autoFocus: false
    });
  }

  onImageLoaded() {
    this.isLoading = false;
    this.cdr.detectChanges();
  }

  onImageError() {
    this.isLoading = false;
  }
}
