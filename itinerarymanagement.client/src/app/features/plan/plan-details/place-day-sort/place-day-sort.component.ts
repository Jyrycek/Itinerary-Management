import { ChangeDetectorRef, Component, ElementRef, OnInit, NgZone, inject, viewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Place } from '../../../../models/project/place-project';
import { MapService } from '../../../../core/services/map/map.service';
import { Utils } from '../../../../shared/utils/utils';
import { PlaceManagementService } from '../../../../core/services/plan/place-management.service';
import { DataService } from '../../../../core/services/data.service';
import { DistanceService } from '../../../../core/services/common/distance.service';
import { ItineraryManagementService } from '../../../../core/services/plan/itinerary-management.service';
import { FormGroup, FormsModule } from '@angular/forms';
import { Tag } from '../../../../models/project/place-tag';
import { firstValueFrom } from 'rxjs';
import { PlaceService } from '../../../../core/services/plan/place.service';
import { NotificationService } from '../../../../core/services/common/notification.service';
import mapboxgl from 'mapbox-gl';
import { ItineraryDayComponent } from '../itinerary-day-list/itinerary-day/itinerary-day.component';
import { ACO } from '../../../../models/aco/aco-sort';
import { ColorUtil } from '../../../../shared/utils/color-util';
import { Coordinate } from '../../../../models/route/route-coordinate';
import { RouteService } from '../../../../core/services/map/route.service';
import { environment } from '../../../../../environments/environment';
import { PlaceDetailDialogComponent } from '../../dialogs/place-detail-dialog/place-detail-dialog.component';
import { PlaceItinerarySharedService } from '../../../../core/services/plan/place-itinerary-shared.service';
import { ItineraryDay } from '../../../../models/project/itinerary-day';
import { NgClass, NgStyle, DecimalPipe } from '@angular/common';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatIconButton, MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatCardActions } from '@angular/material/card';
import { MatTooltip } from '@angular/material/tooltip';
import { TimeFormatPipe } from '../../../../shared/pipes/time-format.pipe';

@Component({
    selector: 'app-place-day-sort',
    templateUrl: './place-day-sort.component.html',
    styleUrl: './place-day-sort.component.css',
    standalone: true,
    imports: [NgClass, MatProgressSpinner, MatIconButton, MatIcon, MatCard, NgStyle, MatButton, MatCardHeader, MatCardTitle, MatCardContent, MatCardActions, MatTooltip, FormsModule, DecimalPipe, TimeFormatPipe]
})
export class PlaceDaySortComponent implements OnInit {
  public mapService = inject(MapService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly ngZone = inject(NgZone);
  private readonly dialog = inject(MatDialog);
  private readonly dialogRef = inject(MatDialogRef<ItineraryDayComponent>);
  private readonly data = inject<{ places: Place[] }>(MAT_DIALOG_DATA);

  readonly distanceService = inject(DistanceService);
  readonly placeItinerarySharedService = inject(PlaceItinerarySharedService);
  readonly dataService = inject(DataService);
  readonly notificationService = inject(NotificationService);
  readonly placeManagementService = inject(PlaceManagementService);
  readonly itineraryManagementService = inject(ItineraryManagementService);
  readonly placeService = inject(PlaceService);
  readonly routeService = inject(RouteService);

  public apiUrl: string = environment.apiUrl + '/dashboard/project/thumbnail/';

  public isMapVisible = false;

  isPlacesAdded: Record<number, boolean> = {};

  public isLoadingPlaceConnections = true; //Proměnná pro určení, zda se načítá spojení míst v mapě
  public isLoadingPlaceSort = true;

  readonly tagInputDialog = viewChild<ElementRef<HTMLInputElement>>('tagInputDialog');


  ngOnInit(): void {
    this.ngZone.runOutsideAngular(() => {
      this.initializeMap();
    });

    this.mapService.loading$.subscribe(isLoading => {
      this.isLoadingPlaceConnections = isLoading;
    });
  }
  get itineraryDays(): ItineraryDay[] {
    return this.dataService.itineraryDays;
  }
  set itineraryDays(value: ItineraryDay[]) {
    this.dataService.itineraryDays = value;
  }
  get places(): Place[] {
    return this.dataService.places;
  }
  set places(value: Place[]) {
    this.dataService.places = value;
  }
  get projectId(): string {
    return this.dataService.projectId;
  }
  get allTags(): Tag[] {
    return this.dataService.tags;
  }
  set allTags(value: Tag[]) {
    this.dataService.tags = value;
  }
  get editingPlaceForm(): FormGroup {
    return this.placeManagementService.editingPlaceForm;
  }
  set editingPlaceForm(value: FormGroup) {
    this.placeManagementService.editingPlaceForm = value;
  }

  closeDialog(): void {
    const map = this.mapService.getDialogSortMap();
    if (map != null || map != undefined) {
      map.remove();
      this.mapService.setDialogSortMap(undefined);
    }
    this.mapService.loadPlacesOnMainMap();

    this.dialogRef.close();
  }

  public decimalToDMS(decimal: number, isLatitude: boolean): string {
    return Utils.decimalToDMS(decimal, isLatitude);
  }

  public markPlaceOnMap(coordinates?: [number, number]) {
    this.mapService.markPlaceOnDialogSortMap(coordinates);
  }

  public async initializeMap() {
    mapboxgl.accessToken = MapService.mapboxKey;

    const temp_map = new mapboxgl.Map({
      container: 'dialogSortMap',
      style: this.mapService.currentMapSortStyle,
      center: [0, 0],
      zoom: 1
    });
    this.mapService.setDialogSortMap(temp_map);

    this.mapService.getDialogSortMap()!.addControl(new mapboxgl.NavigationControl());
    this.mapService.getDialogSortMap()!.addControl(new mapboxgl.FullscreenControl());
    this.mapService.getDialogSortMap()!.addControl(new mapboxgl.ScaleControl());
    this.mapService.getDialogSortMap()!.addControl(new mapboxgl.GeolocateControl());

  }
  get markers(): Record<string, mapboxgl.Marker> {
    return this.dataService.markers;
  }
  set markers(value: Record<string, mapboxgl.Marker>) {
    this.dataService.markers = value;
  }

  public trackByIndex(index: number): number {
    return index;
  }

  prevImage(place: Place) {
    if (place.placeImages.length === 0) return;
    place.currentShownImageIndex = (place.currentShownImageIndex - 1 + place.placeImages.length) % place.placeImages.length;
  }

  nextImage(place: Place) {
    if (place.placeImages.length === 0) return;
    place.currentShownImageIndex = (place.currentShownImageIndex + 1) % place.placeImages.length;
  }
  

  public toggleMap() {
    this.isMapVisible = !this.isMapVisible;
    const toggleButton = document.querySelector('.toggle-map-button');
    if (!toggleButton) {
      return;
    }

    if (this.isMapVisible) {
      toggleButton.classList.add('map-open');
    } else {
      toggleButton.classList.remove('map-open');
    }
  }

  public optimizedItineraryDays: ItineraryDay[] = [];

  public async runAcoOptimization() {
    const places: Place[] = this.data.places;
    if (!places || places.length === 0) return;

    const visitDurations = places.map(p => p.visitDuration ?? 0);

    this.isLoadingPlaceSort = true;

    // Počkáme na optimalizaci pomocí ACO
    this.optimizedItineraryDays = await this.optimizeItinerary(places, visitDurations);

    await this.optimizeDailyRoutes();
    await this.showItineraryOnMap(this.optimizedItineraryDays);
    this.setMapSortView(this.optimizedItineraryDays);

    this.isLoadingPlaceSort = false;
    this.cdr.detectChanges();
  }

  private setMapSortView(itineraryDays: ItineraryDay[]) {
    const bounds = new mapboxgl.LngLatBounds();

    itineraryDays.forEach(day => {
      day.places.forEach(place => {
        bounds.extend([place.longitude, place.latitude]);
      });
    });

    if (bounds.isEmpty()) return;
    const map = this.mapService.getDialogSortMap();
    if (!map) return;

    map.fitBounds(bounds, {
      padding: { top: 50, bottom: 20, left: 20, right: 20 },
      maxZoom: 15,
      duration: 1000
    });
  }

  private async optimizeDailyRoutes() {
    const promises = this.optimizedItineraryDays.map(async (itineraryDay) => {
      const bestPath = await this.distanceService.getBestPathWithStartEnd(itineraryDay);

      if (bestPath) {
        itineraryDay.places = bestPath.map(index => itineraryDay.places[index]);
      }
    });

    await Promise.all(promises);
  }

  private convertTimeToHours(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours + minutes / 60;
  }

  private async optimizeItinerary(places: Place[], visitDurations: number[]): Promise<ItineraryDay[]> {
    const days = this.itineraryDays.length;

    const placeCoordinates: Coordinate[] = places.map(place => ({
      latitude: place.latitude,
      longitude: place.longitude,
    }));

    try {
      const distanceMatrix = await firstValueFrom(this.routeService.calculateDistanceMatrix(placeCoordinates));

      const dayTimes = this.itineraryDays.map(day => ({
        start: this.convertTimeToHours(day.startTime),
        end: this.convertTimeToHours(day.endTime),
      }));


      const aco = new ACO(distanceMatrix, visitDurations, days, dayTimes);
      const bestSolution = aco.run();
      bestSolution.forEach(route => route.pop());

      const itineraryDays = this.itineraryDays.map(day =>
        new ItineraryDay(day.id, day.dayDate, [], day.dayPlaces, day.startTime, day.endTime)
      );

      bestSolution.forEach((dayRoute, dayIndex) => {
        const sortedPlaces = dayRoute.map((index, orderIndex) => {
          const place = places[index];

          const newPlace = Object.create(Object.getPrototypeOf(place), Object.getOwnPropertyDescriptors(place));
          newPlace.order = orderIndex + 1;

          return newPlace;
        });

        itineraryDays[dayIndex].places = sortedPlaces;
      });

      return itineraryDays;
    } catch (error) {
      console.error('Error optimizing itinerary:', error);
      return [];
    }
  }

  public dayColors: Record<string, string> = {};

  private async showItineraryOnMap(itineraryDays: ItineraryDay[]) {
    const promises = itineraryDays.map((day) => {

      const color = ColorUtil.getRandomColor(this.dayColors);

      if (!this.dayColors[day.id]) {
        this.dayColors[day.id] = color;
      }

      return this.mapService.connectPlacesPerDayDialogMapSort(day, color);
    });

    await Promise.all(promises);
  }

  public calculateDistances(lat1: number, lon1: number, lat2: number, lon2: number) {
    return DistanceService.haversineDistance(lat1, lon1, lat2, lon2);
  }

  public async onItineraryDaySelectionChange(day: ItineraryDay): Promise<void> {
    if (this.isPlacesAdded[day.id]) return;

    const optimized_day_id = this.optimizedItineraryDays.findIndex(d => d.id == day.id);
    const origin_day_id = this.itineraryDays.findIndex(d => d.id === day.id);

    try {
      await this.itineraryManagementService.addPlacesToDay(day);

      if (optimized_day_id !== -1 && origin_day_id !== -1) {
        this.itineraryDays[origin_day_id].places = [...this.optimizedItineraryDays[optimized_day_id].places];
      }

      this.isPlacesAdded[day.id] = true;

    } catch (error) {
      console.error("Chyba při přidávání míst:", error);
    }
  }

  calculateArrivalTime(day: any, index: number): string {
    const speed = 8; // km/h
    let totalTravelTimeMinutes = 0;

    const [startHour, startMinute] = day.startTime.split(':').map(Number);
    const startTime = new Date();
    startTime.setHours(startHour, startMinute, 0, 0);

    for (let i = 0; i < index; i++) {
      const distance = this.calculateDistances(
        day.places[i].latitude, day.places[i].longitude,
        day.places[i + 1].latitude, day.places[i + 1].longitude
      );

      totalTravelTimeMinutes += (distance / speed) * 60;

      totalTravelTimeMinutes += day.places[i].visitDuration ?? 0;
    }

    startTime.setMinutes(startTime.getMinutes() + Math.round(totalTravelTimeMinutes));

    const currentDate = new Date();
    const dayDifference = Math.floor((startTime.getTime() - currentDate.getTime()) / (1000 * 3600 * 24));
    const dayOffset = dayDifference > 0 ? ` (+${dayDifference} den)` : '';

    return `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}${dayOffset}`;
  }

  calculateTravelTime(lat1: number, lon1: number, lat2: number, lon2: number): string {
    const speed = 8; // km/h
    const distance = this.calculateDistances(lat1, lon1, lat2, lon2);
    const timeInHours = distance / speed;
    const timeInMinutes = timeInHours * 60;

    if (timeInHours >= 1) {
      const hours = Math.floor(timeInHours);
      const minutes = Math.round((timeInMinutes % 60));
      return `${hours} h ${minutes} min`;
    } else {
      return `${Math.round(timeInMinutes)} min`;
    }
  }

  public highlightedPlaceyId: number | null = null;

  public highlightMarkers(placeId: number | null, dayId: number) {

    this.mapService.placeMarkers.forEach((markers) => {
      markers.forEach((marker) => {
        const element = marker.getElement();
        if (element) {
          element.style.filter = '';
        }
      });
    });

    if (placeId !== null && this.mapService.placeMarkers.has(placeId)) {
      this.mapService.placeMarkers.get(placeId)?.forEach((marker) => {
        const element = marker.getElement();
        if (!element) return;
        const highlightColor = this.dayColors[dayId.toString()] || 'black';
        element.style.filter = `drop-shadow(0px 0px 9px ${highlightColor})`;
      });
    }
  }
  public openPlaceDetailDialog(place: Place): void {
    this.dialog.open(PlaceDetailDialogComponent, {
      minWidth: '60vw',
      data: place,
      autoFocus: false,
      panelClass: 'custom-width-rewritter'
    });
  }
}

