import { ChangeDetectorRef, Component, Input, output, OnInit, inject } from '@angular/core';
import { PlaceDTO, PlaceImage } from '../../../../models/project/place-project';
import { environment } from '../../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatButton } from '@angular/material/button';

@Component({
    selector: 'app-wikipedia-popup',
    templateUrl: './wikipedia-popup.component.html',
    styleUrl: './wikipedia-popup.component.css',
    standalone: true,
    imports: [MatIcon, MatProgressSpinner, MatButton]
})
export class WikipediaPopupComponent implements OnInit {
  public readonly apiUrl: string = environment.apiUrl + '/dashboard/project/thumbnail/popup/image-thumbnail';

  private readonly http = inject(HttpClient);
  private readonly cdr = inject(ChangeDetectorRef);

  public isLoading = true;

  @Input() title = '';
  @Input() summary = '';
  @Input() images: PlaceImage[] = [];
  @Input() areCordCertain = true;
  @Input() coordinates: [number, number] = [0, 0];
  @Input() openingHours?: string = '';
  @Input() website?: string = '';

  readonly placeAdded = output<PlaceDTO>();

  public currentImageIndex = 0;

  ngOnInit() {
    if (this.images && this.images[this.currentImageIndex]) {
      this.fetchImage(this.images[this.currentImageIndex].imageUrl, 200, 100, 200, 100);
    }
  }

  async addPlaceToMap() {
    const newPlace = new PlaceDTO(
      this.title,
      this.summary,
      this.coordinates[1],
      this.coordinates[0],
      1,
      this.images,
      60,
      [],
      this.website,
      this.openingHours
    );

    this.placeAdded.emit(newPlace);
  }


  public imageSrc: string | null = null;

  public fetchImage(imageUrl: string, width = 200, height = 100, maxWidth = 200, maxHeight = 100): void {
    if (!imageUrl) {
      this.imageSrc = null;
      return;
    }

    const url = `${this.apiUrl}?width=${width}&height=${height}&maxWidth=${maxWidth}&maxHeight=${maxHeight}`;
    const body = { imageUrl };

    this.http.post(url, body, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        if (blob.size === 0) {
          this.imageSrc = null;
          return;
        }
        const objectURL = URL.createObjectURL(blob);

        this.imageSrc = objectURL;
        this.cdr.detectChanges();
      },
      error: () => {
        this.imageSrc = null;
      }
    });
  }


  nextImage() {
    if (this.images && this.images.length > 1) {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.images.length;
      this.isLoading = true;
      this.imageSrc = null;
      this.fetchImage(this.images[this.currentImageIndex].imageUrl, 200, 100, 200, 100);
      this.cdr.detectChanges();
    }
  }

  prevImage() {
    if (this.images && this.images.length > 1) {
      this.currentImageIndex = (this.currentImageIndex - 1 + this.images.length) % this.images.length;
      this.isLoading = true;
      this.imageSrc = null;
      this.fetchImage(this.images[this.currentImageIndex].imageUrl, 200, 100, 200, 100);
      this.cdr.detectChanges();
    }
  }


  onImageLoaded() {
    this.isLoading = false;
    this.cdr.detectChanges();
  }

  onImageError() {
    this.isLoading = false; 
  }
}
