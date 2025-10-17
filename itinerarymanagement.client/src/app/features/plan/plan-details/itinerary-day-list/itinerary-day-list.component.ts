import { CdkDragDrop, moveItemInArray, CdkDropList, CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
import { Component, ElementRef, viewChild, OnInit, inject } from '@angular/core';
import { ItineraryDay } from '../../../../models/project/itinerary-day';
import { MatDialog } from '@angular/material/dialog';
import { MapService } from '../../../../core/services/map/map.service';
import { DataService, TransportSegmentsByDay } from '../../../../core/services/data.service';
import { DistanceService } from '../../../../core/services/common/distance.service';
import { PlaceManagementService } from '../../../../core/services/plan/place-management.service';
import { ItineraryManagementService } from '../../../../core/services/plan/itinerary-management.service';
import { Utils } from '../../../../shared/utils/utils';
import { Place } from '../../../../models/project/place-project';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { ItineraryDayComponent } from './itinerary-day/itinerary-day.component';
import { firstValueFrom } from 'rxjs';
import { DaySettingsDialogComponent } from '../../dialogs/day-settings-dialog/day-settings-dialog.component';
import { NotificationService } from '../../../../core/services/common/notification.service';
import { PlaceService } from '../../../../core/services/plan/place.service';
import { environment } from '../../../../../environments/environment';
import { PlaceDetailDialogComponent } from '../../dialogs/place-detail-dialog/place-detail-dialog.component';
import { PlaceItinerarySharedService } from '../../../../core/services/plan/place-itinerary-shared.service';
import { TransportMode } from '../../../../models/project/ItineraryDayTransportSegment';
import { MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatCardActions } from '@angular/material/card';
import { NgStyle, NgClass, DecimalPipe } from '@angular/common';
import { MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIcon } from '@angular/material/icon';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { MatCheckbox } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { TimeFormatPipe } from '../../../../shared/pipes/time-format.pipe';

@Component({
    selector: 'app-itinerary-day-list',
    templateUrl: './itinerary-day-list.component.html',
    styleUrl: './itinerary-day-list.component.css',
    standalone: true,
    imports: [MatCard, NgStyle, MatCardHeader, MatCardTitle, MatIconButton, MatTooltip, MatIcon, MatMenuTrigger, MatMenu, MatMenuItem, MatCheckbox, FormsModule, NgClass, MatProgressSpinner, MatCardContent, CdkDropList, CdkDrag, CdkDragHandle, MatCardActions, DecimalPipe, TimeFormatPipe]
})
export class ItineraryDayListComponent implements OnInit {
  public readonly apiUrl: string = environment.apiUrl + '/dashboard/project/thumbnail/';

  private readonly mapService = inject(MapService);
  private readonly dataService = inject(DataService);
  private readonly distanceService = inject(DistanceService);
  private readonly placeManagementService = inject(PlaceManagementService);
  private readonly itineraryManagementService = inject(ItineraryManagementService);
  private readonly notificationService = inject(NotificationService);
  private readonly placeService = inject(PlaceService);
  private readonly placeItinerarySharedService = inject(PlaceItinerarySharedService);
  public dialog = inject(MatDialog);

  transportOptions = [
    { id: 1, label: 'Chůze', icon: 'directions_walk' },
    { id: 2, label: 'Auto', icon: 'directions_car' },
    { id: 3, label: 'Kolo', icon: 'directions_bike' },
  ];

  weatherCodeIcons: Record<number, string> = {
    0: '☀️', // jasná obloha
    1: '🌤️', // převážně jasno
    2: '⛅',  // polojasno
    3: '☁️', // zataženo
    45: '🌫️', // mlha
    48: '🌫️', // mlha
    51: '🌦️', // slabý déšť
    53: '🌧️', // déšť
    55: '🌧️', // déšť
    61: '🌧️', // déšť
    63: '🌧️', // déšť
    65: '🌧️', // déšť
    71: '❄️', // slabý sníh
    73: '❄️', // sníh
    75: '❄️', // sníh
    80: '🌧️', // přeháňky
    81: '🌧️', // přeháňky
    82: '🌧️', // přeháňky
    95: '⛈️', // bouřky
    96: '⛈️', // bouřky s kroupami
    99: '⛈️'  // bouřky s kroupami
  };

  weatherByDayId: Record<number, any> = {};

  ngOnInit() {
    this.loadWeatherForItineraryDays();
  }

  get isAddingPlaceFormOnTop(): boolean {
    return this.dataService.isAddingPlaceFormOnTop;
  }
  set isAddingPlaceFormOnTop(value: boolean) {
    this.dataService.isAddingPlaceFormOnTop = value;
  }
  get itineraryDays(): ItineraryDay[] {
    return this.dataService.itineraryDays;
  }
  get places(): Place[] {
    return this.dataService.places;
  }
  get projectId(): string {
    return this.dataService.projectId;
  }
  get addingEditingPlaceIndex(): number | null {
    return this.dataService.addingEditingPlaceIndex;
  }
  set addingEditingPlaceIndex(value: number | null) {
    this.dataService.addingEditingPlaceIndex = value;
  }

  get editingPlaceIndex(): number | null {
    return this.dataService.editingPlaceIndex;
  }
  set editingPlaceIndex(value: number | null) {
    this.dataService.editingPlaceIndex = value;
  }
  get transportSegments(): TransportSegmentsByDay {
    return this.dataService.transportSegments;
  }
  public trackByIndex(index: number): number {
    return index;
  }
  public decimalToDMS(decimal: number, isLatitude: boolean): string {
    return Utils.decimalToDMS(decimal, isLatitude);
  }

  public async dropPlace(event: CdkDragDrop<any[]>, day: ItineraryDay) {
    const originalPlaces = [...day.places];

    moveItemInArray(day.places, event.previousIndex, event.currentIndex);
    day.places.forEach((place: Place, index: number) => {
      place.order = index + 1;
    });

    try {
      await firstValueFrom(this.placeManagementService.updatePlaceOrders(day, +this.projectId));
      this.distanceService.recalculateDistances(day);
    } catch (error) {
      day.places = originalPlaces;
      console.error('Chyba při aktualizaci pořadí míst:', error);
    }
  }

  public markPlaceOnMap(coordinates?: [number, number]) {
    this.mapService.markPlaceOnMap(coordinates);
  }

  public removePlaceFromDay(day: ItineraryDay, place: Place) {
    this.itineraryManagementService.removePlaceFromDay(day, place);
  }

  public calculateDistances(lat1: number, lon1: number, lat2: number, lon2: number) {
    return DistanceService.haversineDistance(lat1, lon1, lat2, lon2);
  }

  public toggleDayContent(day: ItineraryDay): void {
    this.placeItinerarySharedService.toggleDayContent(day);
  }
  public isDayContentVisible(day: ItineraryDay): boolean {
    return this.placeItinerarySharedService.isDayContentVisible(day);
  }

  openDayDialog(day: ItineraryDay) {
    if (this.editingPlaceIndex) {
      this.placeManagementService.cancelEditingPlace(this.editingPlaceIndex);

    } else if (this.addingEditingPlaceIndex) {
      this.placeManagementService.cancelAddingEditingPlace(this.addingEditingPlaceIndex);
    } else if (this.isAddingPlaceFormOnTop) {
      this.placeManagementService.cancelAddingEditingPlace(0);
    }

    this.dialog.open(ItineraryDayComponent, {
      width: '100vw',
      height: '100%',
      panelClass: 'full-screen-dialog',
      data: { day },
      disableClose: true,
      hasBackdrop: false
    });
  }

  openRouteSettingsDialog(dayId: number, ): void {
    this.itineraryManagementService.openRouteSettingsDialog(dayId, false);
  }

  readonly tagInputDialog = viewChild<ElementRef<HTMLInputElement>>('tagInputDialog');
  selectedEditTag(event: MatAutocompleteSelectedEvent, index: number): void {
    this.itineraryManagementService.selectedEditTag(event, index, this.tagInputDialog());
  }
  public togglePlaceInDay(place: Place, day: ItineraryDay) {
    this.itineraryManagementService.togglePlaceInDay(place, day);
  }

  prevImage(place: Place) {
    if (place.placeImages.length === 0) return;
    place.currentShownImageIndex = (place.currentShownImageIndex - 1 + place.placeImages.length) % place.placeImages.length;
  }

  nextImage(place: Place) {
    if (place.placeImages.length === 0) return;
    place.currentShownImageIndex = (place.currentShownImageIndex + 1) % place.placeImages.length;
  }

  public async openDaySettingsDialog(day: ItineraryDay) {
    const dialogRef = this.dialog.open(DaySettingsDialogComponent, {
      width: '350px',
      data: {
        startTime: day.startTime,
        endTime: day.endTime
      }
    });

    try {
      const result = await firstValueFrom(dialogRef.afterClosed());

      if (result) {
        const start = this.parseTime(result.startTime);
        const end = this.parseTime(result.endTime);

        if (start >= end) {
          this.notificationService.showNotification('Počáteční čas nemůže být později nebo stejný než konečný!', 'info');
          return;
        }

        day.startTime = result.startTime;
        day.endTime = result.endTime;

        await firstValueFrom(this.placeService.updateDayTimes(+this.projectId, day.id, result.startTime, result.endTime));
        this.notificationService.showNotification('Čas úspěšně aktualizován', 'success');
        day.startTime = result.startTime;
        day.endTime = result.endTime;
      }
    } catch {
      this.notificationService.showNotification('Chyba při aktualizaci času', 'error');
    }
  }

  private parseTime(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  public highlightedDayId: number | null = null;

  public highlightMarkersByPlace(placeIds: number[] | null) {
    this.mapService.placeMarkersMap.forEach((marker, id) => {
      const element = marker.getElement();
      if (!element) return;

      element.style.filter = placeIds?.includes(id)
        ? `drop-shadow(0px 0px 8px black)` : '';
    });
  }

  public openPlaceDetailDialog(place: Place): void {
    this.dialog.open(PlaceDetailDialogComponent, {
      minWidth: '60vw',
      data: place,
      autoFocus: false
    });
  }

  getActiveMode(day: ItineraryDay, index: number): number | null {
    const daySegments = this.transportSegments.get(day.id);
    if (!daySegments) return null;

    const orderedPlaces = [...day.places].sort((a, b) => a.order - b.order);
    const fromPlace = orderedPlaces[index];
    const toPlace = orderedPlaces[index + 1];

    if (!fromPlace || !toPlace) return null;

    const segment = daySegments.find(s =>
      (s.fromPlaceId === fromPlace.id && s.toPlaceId === toPlace.id) ||
      (s.fromPlaceId === toPlace.id && s.toPlaceId === fromPlace.id)
    );
    return segment?.transportModeId ?? null;
  }

  onSelectTransportMode(day: ItineraryDay, index: number, modeId: number): void {
    const daySegments = this.transportSegments.get(day.id) || [];

    const orderedPlaces = [...day.places].sort((a, b) => a.order - b.order);
    const fromPlace = orderedPlaces[index];
    const toPlace = orderedPlaces[index + 1];

    if (!fromPlace || !toPlace) return;

    const existingSegmentIndex = daySegments.findIndex(s =>
      (s.fromPlaceId === fromPlace.id && s.toPlaceId === toPlace.id) ||
      (s.fromPlaceId === toPlace.id && s.toPlaceId === fromPlace.id)
    );

    const mode = this.transportOptions.find(o => o.id === modeId);
    const transportMode: TransportMode | undefined = mode ? { id: mode.id, name: mode.label } : undefined;

    if (existingSegmentIndex !== -1) {
      daySegments[existingSegmentIndex].transportModeId = modeId;
      daySegments[existingSegmentIndex].transportMode = transportMode;
    } else {
      daySegments.push({
        itineraryDayId: day.id,
        fromPlaceId: fromPlace.id,
        toPlaceId: toPlace.id,
        transportModeId: modeId,
        transportMode: transportMode
      });
    }

    this.transportSegments.set(day.id, daySegments);
    this.dataService.transportSegments = new Map(this.transportSegments);
  }


  private loadWeatherForItineraryDays() {
    const today = new Date();
    const maxDate = new Date();
    maxDate.setDate(today.getDate() + 15);

    this.itineraryDays.forEach(day => {
      const coords = this.getAverageCoordinates(day);
      if (!coords) return;

      const date = new Date(day.dayDate);

      if (date < today) return;

      if (date > maxDate) return;

      const [lat, lon] = coords;
      const dateStr = date.toISOString().split('T')[0];

      this.placeService.getWeatherForecast(lat, lon, dateStr).subscribe(forecast => {
        if (forecast?.daily?.weathercode?.length > 0) {
          const weather = {
            code: forecast.daily.weathercode[0],
            tempMin: forecast.daily.temperature_2m_min[0],
            tempMax: forecast.daily.temperature_2m_max[0]
          };
          this.weatherByDayId[day.id] = weather;
        }
      });
    });
  }


  private getAverageCoordinates(day: ItineraryDay): [number, number] | null {
    if (!day.places || day.places.length === 0) return null;

    let sumLat = 0;
    let sumLon = 0;
    day.places.forEach(place => {
      sumLat += place.latitude;
      sumLon += place.longitude;
    });

    return [sumLat / day.places.length, sumLon / day.places.length];
  }

  getWeatherIconClass(code: number): string {
    const map: Record<number, string> = {
      0: 'wi-day-sunny',
      1: 'wi-day-sunny-overcast',
      2: 'wi-day-cloudy',
      3: 'wi-cloudy',

      45: 'wi-fog',
      48: 'wi-fog',

      51: 'wi-sprinkle',
      53: 'wi-sprinkle',
      55: 'wi-showers',

      56: 'wi-sleet',
      57: 'wi-sleet',

      61: 'wi-rain',
      63: 'wi-rain',
      65: 'wi-rain',

      66: 'wi-rain-mix',
      67: 'wi-rain-mix',

      71: 'wi-snow',
      73: 'wi-snow',
      75: 'wi-snow-wind',

      77: 'wi-snowflake-cold',

      80: 'wi-showers',
      81: 'wi-showers',
      82: 'wi-rain-wind',

      85: 'wi-snow',
      86: 'wi-snow-wind',

      95: 'wi-thunderstorm',
      96: 'wi-thunderstorm',
      99: 'wi-thunderstorm'
    };

    return map[code] || 'wi-na';
  }
}
