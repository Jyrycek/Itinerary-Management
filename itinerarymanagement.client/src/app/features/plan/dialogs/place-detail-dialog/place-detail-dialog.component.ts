import { Component, OnInit, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogContent, MatDialogClose, MatDialogActions } from '@angular/material/dialog';
import { Place } from '../../../../models/project/place-project';
import { ItineraryDay } from '../../../../models/project/itinerary-day';
import { DataService } from '../../../../core/services/data.service';
import { MapService } from '../../../../core/services/map/map.service';
import { environment } from '../../../../../environments/environment';
import { Lightbox } from 'ngx-lightbox';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { MatIconButton, MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { NgStyle } from '@angular/common';
import mapboxgl from 'mapbox-gl';

@Component({
    selector: 'app-place-detail-dialog',
    templateUrl: './place-detail-dialog.component.html',
    styleUrl: './place-detail-dialog.component.css',
    standalone: true,
    imports: [CdkScrollable, MatDialogContent, MatIconButton, MatDialogClose, MatIcon, NgStyle, MatDialogActions, MatButton]
})
export class PlaceDetailDialogComponent implements OnInit {
  private readonly dataService = inject(DataService);
  private readonly lightbox = inject(Lightbox);
  public dialogRef = inject(MatDialogRef<PlaceDetailDialogComponent>);
  public place = inject<Place>(MAT_DIALOG_DATA);

  selectedPlace: Place = this.place;
  assignedDays: ItineraryDay[] = [];
  map: mapboxgl.Map | null = null;
  album: { src: string; caption: string; thumb: string }[] = [];

  public apiUrl: string = environment.apiUrl + '/dashboard/project/thumbnail/';

  constructor() {
    if (this.itineraryDays) {
      this.assignedDays = this.itineraryDays.filter(day =>
        day.places?.some(p => p.id === this.place.id)
      ) || [];
    }

    this.album = this.place.placeImages.map(image => ({
      src: image.imageUrl,
      caption: this.place.title,
      thumb: this.apiUrl + image.id + '?width=0&height=0&maxWidth=300&maxHeight=300' 
    }));
  }

  ngOnInit(): void {
    if (!this.place || !this.place.latitude || !this.place.longitude) return;

    mapboxgl.accessToken = MapService.mapboxKey;

    this.map = new mapboxgl.Map({
      container: 'map-dialog',
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [this.place.longitude, this.place.latitude],
      zoom: 12
    });

    new mapboxgl.Marker()
      .setLngLat([this.place.longitude, this.place.latitude])
      .addTo(this.map);
  }

  get itineraryDays(): ItineraryDay[] {
    return this.dataService.itineraryDays;
  }

  formatLatitude(latitude: number): string {
    return latitude >= 0 ? `${latitude}° N` : `${Math.abs(latitude)}° S`;
  }

  formatLongitude(longitude: number): string {
    return longitude >= 0 ? `${longitude}° E` : `${Math.abs(longitude)}° W`;
  }

  formatVisitDuration(durationInMinutes: number): string {
    const hours = Math.floor(durationInMinutes / 60);
    const minutes = durationInMinutes % 60;

    let result = '';

    if (hours > 0) {
      result += `${hours} hodin${hours > 1 ? 'y' : ''}`;
    }

    if (minutes > 0) {
      if (result) {
        result += ' ';
      }
      result += `${minutes} minut${minutes > 1 ? 'y' : ''}`;
    }

    return result || 'Není specifikováno';
  }

  getAssignedDaysString(): string {
    return this.assignedDays.map(day => day.formattedFullDate).join(', ');
  }

  openLightbox(index: number): void {
      this.lightbox.open(this.album, index);
  }

  closeLightbox(): void {
    this.lightbox.close();
  }
}
