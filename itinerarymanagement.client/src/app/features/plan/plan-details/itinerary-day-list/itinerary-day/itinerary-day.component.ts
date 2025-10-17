import { ChangeDetectorRef, Component, ElementRef, inject, OnInit, NgZone, signal, viewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MapService } from '../../../../../core/services/map/map.service';
import { Utils } from '../../../../../shared/utils/utils';
import { PlaceManagementService } from '../../../../../core/services/plan/place-management.service';
import { CdkDragDrop, moveItemInArray, CdkDropList, CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
import { DataService } from '../../../../../core/services/data.service';
import { DistanceService } from '../../../../../core/services/common/distance.service';
import { ItineraryManagementService } from '../../../../../core/services/plan/itinerary-management.service';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { firstValueFrom, map, startWith } from 'rxjs';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatAutocompleteSelectedEvent, MatAutocompleteTrigger, MatAutocomplete, MatOption } from '@angular/material/autocomplete';
import { MatChipInputEvent, MatChipGrid, MatChipRow, MatChipRemove, MatChipInput } from '@angular/material/chips';
import { EditTagDialogComponent } from '../../../dialogs/edit-tag-dialog/edit-tag-dialog.component';
import { PlaceService } from '../../../../../core/services/plan/place.service';
import { NotificationService } from '../../../../../core/services/common/notification.service';
import mapboxgl from 'mapbox-gl';
import { environment } from '../../../../../../environments/environment';
import { PlaceDetailDialogComponent } from '../../../dialogs/place-detail-dialog/place-detail-dialog.component';
import { PlaceItinerarySharedService } from '../../../../../core/services/plan/place-itinerary-shared.service';
import { Tag } from '../../../../../models/project/place-tag';
import { Place } from '../../../../../models/project/place-project';
import { ItineraryDay } from '../../../../../models/project/itinerary-day';
import { NgClass, NgStyle, AsyncPipe } from '@angular/common';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatIconButton, MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle, MatCardActions } from '@angular/material/card';
import { MatFormField, MatLabel, MatInput, MatError } from '@angular/material/input';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { MatCheckbox } from '@angular/material/checkbox';
import { TimeFormatPipe } from '../../../../../shared/pipes/time-format.pipe';

@Component({
    selector: 'app-itinerary-day',
    templateUrl: './itinerary-day.component.html',
    styleUrl: './itinerary-day.component.css',
    standalone: true,
    imports: [NgClass, MatProgressSpinner, MatIconButton, MatIcon, MatButton, MatTooltip, MatCard, MatCardContent, FormsModule, ReactiveFormsModule, MatCardHeader, MatCardTitle, MatFormField, MatLabel, MatInput, MatError, MatChipGrid, MatChipRow, NgStyle, MatChipRemove, MatChipInput, MatAutocompleteTrigger, MatAutocomplete, MatOption, MatCardActions, MatMenuTrigger, MatMenu, MatMenuItem, MatCheckbox, CdkDropList, CdkDrag, CdkDragHandle, AsyncPipe, TimeFormatPipe]
})
export class ItineraryDayComponent implements OnInit {
  public apiUrl: string = environment.apiUrl + '/dashboard/project/thumbnail/';

  public place: Place = new Place(0, '', '', 0, 0, 0, [], 0, []);
  public selectedDay?: ItineraryDay;
  public isLoadingDescription = false;
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];
  editingTag = signal<string>('');

  public isMapVisible = false;

  public isLoadingPlaceConnections = true; //Proměnná pro určení, zda se načítá spojení míst v mapě

  readonly tagInputDialog = viewChild<ElementRef<HTMLInputElement>>('tagInputDialog');

  public readonly mapService = inject(MapService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly ngZone = inject(NgZone);
  public readonly dialogRef = inject(MatDialogRef<ItineraryDayComponent>);
  public readonly dialog = inject(MatDialog);
  private readonly distanceService = inject(DistanceService);
  private readonly placeItinerarySharedService = inject(PlaceItinerarySharedService);
  private readonly dataService = inject(DataService);
  private readonly notificationService = inject(NotificationService);
  private readonly placeManagementService = inject(PlaceManagementService);
  private readonly itineraryManagementService = inject(ItineraryManagementService);
  private readonly placeService = inject(PlaceService);
  public readonly data = inject(MAT_DIALOG_DATA) as { day: ItineraryDay };

  ngOnInit(): void {
    this.selectedDay = this.data?.day;
    this.ngZone.runOutsideAngular(() => {
      this.initializeMap();
    });

    this.mapService.loading$.subscribe(isLoading => {
      this.isLoadingPlaceConnections = isLoading;
    });
  }

  get isAddingPlaceFormOnTop(): boolean {
    return this.dataService.isAddingPlaceFormOnTop;
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
  get addingEditingPlaceIndex(): number | null {
    return this.dataService.addingEditingPlaceIndex;
  }
  set addingEditingPlaceIndex(value: number | null) {
    this.dataService.addingEditingPlaceIndex = value;
  }
  get isAddingPlaceFormBetween(): boolean {
    return this.dataService.isAddingPlaceFormBetween;
  }
  get currentMarker(): mapboxgl.Marker | null {
    return this.dataService.currentMarker;
  }
  set currentMarker(value: mapboxgl.Marker | null) {
    this.dataService.currentMarker = value;
  }
  set isAddingPlaceFormBetween(value: boolean) {
    this.dataService.isAddingPlaceFormBetween = value;
  }
  get isEditingPlaceForm(): boolean {
    return this.dataService.isEditingPlaceForm;
  }
  set isEditingPlaceForm(value: boolean) {
    this.dataService.isEditingPlaceForm = value;
  }
  get actualOrderNumber(): number | null {
    return this.dataService.actualOrderNumber;
  }
  set actualOrderNumber(value: number | null) {
    this.dataService.actualOrderNumber = value;
  }
  get editingPlaceIndex(): number | null {
    return this.dataService.editingPlaceIndex;
  }
  set editingPlaceIndex(value: number | null) {
    this.dataService.editingPlaceIndex = value;
  }
  get isMarkingMode(): boolean {
    return this.dataService.isMarkingMode;
  }
  set isMarkingMode(value: boolean) {
    this.dataService.isMarkingMode = value;
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
    this.cancelEditingPlace(0);
    const map = this.mapService.getDialogMap();
    if (map != null || map != undefined) {
      map.remove();
      this.mapService.setDialogMap(undefined);
    }
    this.mapService.loadPlacesOnMainMap();

    this.dialogRef.close();
  }

  public cancelEditingPlace(index: number) {
    this.placeManagementService.cancelEditingPlace(index);
    if (!this.isAddingPlaceFormOnTop) {
      this.mapService.loadPlacesOnDialogMap(this.selectedDay!, this.mapService.getDialogMap()!);
    }
  }

  public showAddPlaceFormPlus(index: number, latitude = 0, longitude = 0) {
    this.placeManagementService.showAddPlaceFormPlus(index, latitude, longitude);
    this.mapService.loadPlacesOnDialogMap(this.selectedDay!, this.mapService.getDialogMap()!);
  }

  public decimalToDMS(decimal: number, isLatitude: boolean): string {
    return Utils.decimalToDMS(decimal, isLatitude);
  }

  public toggleMarkingMode(index?: number) {
    if (index == 0 && this.selectedDay) {
      const maxOrder = Math.max(...this.selectedDay.places.map(place => place.order));
      index = maxOrder + 1;
      this.actualOrderNumber = index;
    }
    this.mapService.toggleMarkingModeDialog(index);
  }
  public createMarker(coords: mapboxgl.LngLat, map: mapboxgl.Map, actualOrderNumber: number | null): mapboxgl.Marker {
    let marker: mapboxgl.Marker | null = null;

    this.ngZone.runOutsideAngular(() => {
      const el = document.createElement('div');
      el.className = 'marker';

      if (actualOrderNumber !== null) {
        el.textContent = actualOrderNumber.toString();
      } else {
        el.textContent = '';
      }

      marker = new mapboxgl.Marker(el, { anchor: 'bottom' })
        .setLngLat([coords.lng, coords.lat])
        .setOffset([0, -5])
        .addTo(map);
    });

    if (!marker) {
      throw new Error();
    }

    return marker;
  }

  // Funkce pro nastavení zobrazení mapy na základě míst
  private setMapView(places: Place[]) {
    const bounds = new mapboxgl.LngLatBounds();

    places.forEach(place => {
      bounds.extend([place.longitude, place.latitude]);
    });

    if (bounds.isEmpty()) return;
    const map = this.mapService.getDialogMap();
    if (!map) return;


    map.fitBounds(bounds, {
      padding: { top: 50, bottom: 20, left: 20, right: 20 },
      maxZoom: 15,
      duration: 1000
    });
  }

  public togglePlaceInDay(place: Place, day: ItineraryDay) {
    this.itineraryManagementService.togglePlaceInDay(place, day);
  }

  public async savePlace(index: number): Promise<void> {
    await this.placeManagementService.savePlace(index);

    if (!this.selectedDay) return;
    const maxOrder = Math.max(...this.selectedDay.places.map(place => place.order), 0);
    const temp_place = { ...this.places[index], order: maxOrder + 1 } as Place;

    this.selectedDay.placeSelections[temp_place.id] = true;

    await this.itineraryManagementService.togglePlaceInDay(temp_place, this.selectedDay);
    this.mapService.loadPlacesOnDialogMap(this.selectedDay, this.mapService.getDialogMap()!);
  }

  public markDialogPlaceOnMap(coordinates?: [number, number]) {
    this.mapService.markPlaceOnMap(coordinates, this.mapService.getDialogMap()!);
  }
  toggleDayContent(day: ItineraryDay): void {
    this.placeItinerarySharedService.toggleDayContent(day);
  }
  public markPlaceOnMap(coordinates?: [number, number]) {
    this.mapService.markPlaceOnMap(coordinates);
  }

  removePlaceFromDay(day: ItineraryDay, place: Place) {
    this.itineraryManagementService.removePlaceFromDay(day, place);
  }

  editingTagnew = new FormControl();
  readonly filteredEditTags = this.editingTagnew.valueChanges.pipe(
    startWith(''),
    map(value => this._filterTags(value))
  );

  private _filterTags(value: string): { name: string, color: string }[] {
    if (typeof value !== 'string') {
      return [];
    }
    const filterValue = value.toLowerCase();
    return this.allTags.filter(tag => tag.name.toLowerCase().includes(filterValue));
  }

  public async initializeMap() {
    mapboxgl.accessToken = MapService.mapboxKey;

    const temp_map = new mapboxgl.Map({
      container: 'dialogMap',
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [0, 0],
      zoom: 1
    });
    this.mapService.setDialogMap(temp_map);

    this.mapService.getDialogMap()!.addControl(new mapboxgl.NavigationControl());
    this.mapService.getDialogMap()!.addControl(new mapboxgl.FullscreenControl());
    this.mapService.getDialogMap()!.addControl(new mapboxgl.ScaleControl());
    this.mapService.getDialogMap()!.addControl(new mapboxgl.GeolocateControl());

    this.mapService.getDialogMap()!.on('click', (event) => {
      if (!this.isMarkingMode) return;

      const coords = event.lngLat;
      const placeId = this.mapService.updateCoordinates(coords);
      this.currentMarker = this.createMarker(coords, this.mapService.getDialogMap()!, (this.actualOrderNumber == 0) ? null : this.actualOrderNumber);

      this.markers[placeId] = this.currentMarker;
      this.isMarkingMode = false;
      const mapElement = this.mapService.getDialogMap()!.getCanvas();
      mapElement.style.cursor = '';
    });

    this.mapService.getDialogMap()!.on('load', async () => {
      const places = this.selectedDay!.places;
      if (places.length > 0) {
        this.mapService.loadPlacesOnDialogMap(this.selectedDay!, this.mapService.getDialogMap()!);
        this.mapService.setMapDialogMapView(places);
      }
    });
  }
  get markers(): Record<string, mapboxgl.Marker> {
    return this.dataService.markers;
  }
  set markers(value: Record<string, mapboxgl.Marker>) {
    this.dataService.markers = value;
  }

 
  public async openRouteSettingsDialog(day: ItineraryDay) {
    this.itineraryManagementService.openRouteSettingsDialog(day.id, true, day);
  }

  readonly autocompleteTrigger = viewChild(MatAutocompleteTrigger);
  public editTag(event: MatChipInputEvent, index: number): void {
    const input = event.chipInput;
    const value = event.value.trim();
    if (value) {
      if (this.places[index] && this.places[index].tags) {
        this.places[index].tags!.push(new Tag(0, value, "#000000"));
      } else if (this.places[index]) {
        this.places[index].tags = [new Tag(0, value, "#000000")];
      }
    }
    const autocompleteTrigger = this.autocompleteTrigger();
    if (autocompleteTrigger) {
      autocompleteTrigger.closePanel();
    }
    if (input) {
      input.clear();
    }
    this.cdr.detectChanges();
    this.editingTag.set('');
  }

  public trackByIndex(index: number): number {
    return index;
  }

  public removeEditTag(tag: Tag, index: number): void {
    const tagsArray = this.places[index].tags;
    if (!tagsArray) return;

    const tagIndex = tagsArray.indexOf(tag);

    if (tagIndex >= 0) {
      tagsArray.splice(tagIndex, 1);
    }
  }
  public async openEditTagDialog(tag: Tag, placeIndex: number, tagIndex: number): Promise<void> {
    const theTag = this.allTags.find(t => t.name === tag.name && t.color === tag.color) || tag;
    const dialogRef = this.dialog.open(EditTagDialogComponent, {
      width: '300px',
      data: theTag,
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result && theTag) {
        const updatedTag = new Tag(theTag.id, result.name, result.colorHex);
        if (this.places[placeIndex]?.tags) {
          this.places[placeIndex].tags[tagIndex] = updatedTag;
        }

      }
    });
  }
  selectedEditTag(event: MatAutocompleteSelectedEvent, index: number): void {
    this.itineraryManagementService.selectedEditTag(event, index, this.tagInputDialog());
  }
  async dropPlaceDialog(event: CdkDragDrop<any[]>, day: ItineraryDay) {
    const originalPlaces = [...day.places];

    moveItemInArray(day.places, event.previousIndex, event.currentIndex);

    day.places.forEach((place: Place, index: number) => {
      place.order = index + 1;
    });

    const hasChanged = originalPlaces.some((place, index) => place.id !== day.places[index].id);

    if (!hasChanged) return;

    try {

      await firstValueFrom(this.placeManagementService.updatePlaceOrders(day, +this.projectId));
      this.distanceService.recalculateDistances(day);
      this.mapService.loadPlacesOnMainMap();
      this.mapService.loadPlacesOnDialogMap(day, this.mapService.getDialogMap()!);

    } catch (error) {

      day.places = originalPlaces;
      console.error("Chyba při aktualizaci pořadí míst", error);
    }
  }

  public async generateDescription(isEditing: boolean, place: Place | null): Promise<void> {
    const title: string = this.editingPlaceForm.get('title')?.value;
    const latitude: number = this.editingPlaceForm.get('latitude')?.value;
    const longitude: number = this.editingPlaceForm.get('longitude')?.value;

    if (!title || !latitude || !longitude) {
      this.notificationService.showNotification('Vyplňte prosím název a souřadnice!', 'error');
      return;
    }

    this.isLoadingDescription = true;

    try {
      const data: any = await firstValueFrom(this.placeService.generateResponse(title, longitude, latitude));
      const generatedDescription = data.response;

      if (place && this.selectedDay) {
        this.editingPlaceForm.patchValue({
          description: generatedDescription
        });
      }
    } catch (err) {
      console.error("Error generating description:", err);
    } finally {
      this.isLoadingDescription = false;
    }
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

  public openPlaceDetailDialog(place: Place): void {
    this.dialog.open(PlaceDetailDialogComponent, {
      minWidth: '60vw',
      data: place,
      autoFocus: false,
      panelClass: 'custom-width-rewritter'
    });
  }
}
