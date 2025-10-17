import { ChangeDetectorRef, Component, ElementRef, OnInit, signal, viewChild, inject } from '@angular/core';
import { MapService } from '../../../../core/services/map/map.service';
import { DataService } from '../../../../core/services/data.service';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Tag, TagDTO } from '../../../../models/project/place-tag';
import { Subscription, catchError, concatMap, firstValueFrom, from, map, of, startWith } from 'rxjs';
import { PlaceService } from '../../../../core/services/plan/place.service';
import { NotificationService } from '../../../../core/services/common/notification.service';
import { Utils } from '../../../../shared/utils/utils';
import { FileUploadService } from '../../../../core/services/common/file-upload.service';
import { CdkDragDrop, CdkDropList, CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
import { MatAutocompleteSelectedEvent, MatAutocompleteTrigger, MatAutocomplete, MatOption } from '@angular/material/autocomplete';
import { MatChipInputEvent, MatChipGrid, MatChipRow, MatChipRemove, MatChipInput } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { EditTagDialogComponent } from '../../dialogs/edit-tag-dialog/edit-tag-dialog.component';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { PlaceManagementService } from '../../../../core/services/plan/place-management.service';
import { ScrollService } from '../../../../core/services/common/scroll.service';
import { PlaceDetailDialogComponent } from '../../dialogs/place-detail-dialog/place-detail-dialog.component';
import { environment } from '../../../../../environments/environment';
import { ItineraryDay } from '../../../../models/project/itinerary-day';
import { Place, PlaceDTO } from '../../../../models/project/place-project';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle, MatCardActions } from '@angular/material/card';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { NgClass, NgStyle, AsyncPipe } from '@angular/common';
import { MatTooltip } from '@angular/material/tooltip';
import { MatFormField, MatLabel, MatInput, MatError } from '@angular/material/input';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { MatCheckbox } from '@angular/material/checkbox';

@Component({
    selector: 'app-place-list',
    templateUrl: './place-list.component.html',
    styleUrl: './place-list.component.css',
    standalone: true,
    imports: [MatButton, CdkDropList, MatIconButton, MatIcon, CdkDrag, MatCard, MatCardContent, MatProgressSpinner, NgClass, MatTooltip, FormsModule, ReactiveFormsModule, MatCardHeader, MatCardTitle, MatFormField, MatLabel, MatInput, MatError, MatChipGrid, MatChipRow, NgStyle, MatChipRemove, MatChipInput, MatAutocompleteTrigger, MatAutocomplete, MatOption, CdkDragHandle, MatCardActions, MatMenuTrigger, MatMenu, MatMenuItem, MatCheckbox, AsyncPipe]
})
export class PlaceListComponent implements OnInit {
  public mapService = inject(MapService);

  private readonly dialog = inject(MatDialog);
  private readonly dataService = inject(DataService);
  private readonly placeService = inject(PlaceService);
  private readonly notificationService = inject(NotificationService);
  private readonly fileUploadService = inject(FileUploadService);
  private readonly placeManagementService = inject(PlaceManagementService);
  private readonly scrollService = inject(ScrollService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly autocompleteTrigger = viewChild(MatAutocompleteTrigger);
  readonly tagInput = viewChild<ElementRef<HTMLInputElement>>('tagInput');

  public apiUrl: string = environment.apiUrl + '/dashboard/project/thumbnail/';

  public allTags$ = this.dataService.tags$;
  public places$ = this.dataService.places$;
  public itineraryDays$ = this.dataService.itineraryDays$;

  public isLoadingDescription = false;

  readonly separatorKeysCodes: number[] = [ENTER, COMMA];

  editingTagnew = new FormControl();

  public clickedPlusIndex: number | null = null;
  public hoverIndex: number | null = null;

  editingTag = signal<string>('');

  private subscriptions = new Subscription();


  get places(): Place[] {
    return this.dataService.places;
  }
  set places(value: Place[]) {
    this.dataService.places = value;
  }
  get isAddingPlaceFormBetween(): boolean {
    return this.dataService.isAddingPlaceFormBetween;
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
  get editingPlaceIndex(): number | null {
    return this.dataService.editingPlaceIndex;
  }
  set editingPlaceIndex(value: number | null) {
    this.dataService.editingPlaceIndex = value;
  }
  get addingEditingPlaceIndex(): number | null {
    return this.dataService.addingEditingPlaceIndex;
  }
  set addingEditingPlaceIndex(value: number | null) {
    this.dataService.addingEditingPlaceIndex = value;
  }
  get actualOrderNumber(): number | null {
    return this.dataService.actualOrderNumber;
  }
  set actualOrderNumber(value: number | null) {
    this.dataService.actualOrderNumber = value;
  }
  get isMarkingMode(): boolean {
    return this.dataService.isMarkingMode;
  }
  set isMarkingMode(value: boolean) {
    this.dataService.isMarkingMode = value;
  }
  get currentMarker(): mapboxgl.Marker | null {
    return this.dataService.currentMarker;
  }
  set currentMarker(value: mapboxgl.Marker | null) {
    this.dataService.currentMarker = value;
  }
  get allTags(): Tag[] {
    return this.dataService.tags;
  }
  set allTags(value: Tag[]) {
    this.dataService.tags = value;
  }
  get itineraryDays(): ItineraryDay[] {
    return this.dataService.itineraryDays;
  }
  set itineraryDays(value: ItineraryDay[]) {
    this.dataService.itineraryDays = value;
  }
  get editingPlaceForm(): FormGroup {
    return this.placeManagementService.editingPlaceForm;
  }
  set editingPlaceForm(value: FormGroup) {
    this.placeManagementService.editingPlaceForm = value;
  }
  get isAddingPlaceFormOnTop(): boolean {
    return this.dataService.isAddingPlaceFormOnTop;
  }
  set isAddingPlaceFormOnTop(value: boolean) {
    this.dataService.isAddingPlaceFormOnTop = value;
  }
  get projectId(): string {
    return this.dataService.projectId;
  }

  ngOnInit(): void {
    this.mapService.placeEdited.subscribe((place: Place) => {
      this.scrollService.scrollToPlace(place.id);
      const index = this.places.findIndex(x => x.id == place.id);
      this.placeManagementService.startEditingPlace(index);//todo
    });

    this.subscriptions.add(
      this.placeManagementService.showAddPlace$.subscribe(async coords => {
        await this.placeManagementService.showAddPlaceFormPlus(0, coords.lat, coords.lng);
        this.scrollService.scrollToPlace(0);
      })
    );

    this.mapService.placeDeleted.subscribe((place: Place) => {
      const index = this.places.findIndex(x => x.id == place.id);
      this.placeManagementService.deletePlace(index);//todo
    });
  }

  private _filterTags(value: string): { name: string, color: string }[] {
    if (typeof value !== 'string') {
      return [];
    }
    const filterValue = value.toLowerCase();
    return this.allTags.filter(tag => tag.name.toLowerCase().includes(filterValue));
  }

  readonly filteredEditTags = this.editingTagnew.valueChanges.pipe(
    startWith(''),
    map(value => this._filterTags(value))
  );

  public addingBetweenError = '';

  trackByIndex(index: number): number {
    return index;
  }

  markPlaceOnMap(coordinates?: [number, number]) {
    this.mapService.markPlaceOnMap(coordinates);
  }

  drop(event: CdkDragDrop<string[]>) {

    const previousIndex = event.previousIndex;
    const currentIndex = event.currentIndex;

    const item = this.places[previousIndex];

    if (this.isAddingPlaceFormBetween && this.addingEditingPlaceIndex !== null) {
      if (this.addingEditingPlaceIndex == currentIndex) {
        if (currentIndex < previousIndex) {
          this.addingEditingPlaceIndex = currentIndex + 1;
        } else {
          this.addingEditingPlaceIndex = currentIndex - 1;
        }

        this.dataService.placeDataBefEditing = { ...this.places[currentIndex] };
        this.actualOrderNumber = this.places[currentIndex].order;
      }

      item.order = currentIndex + 1;

    } else if (this.isEditingPlaceForm && this.editingPlaceIndex !== null) {
      if (this.editingPlaceIndex == currentIndex) {
        if (currentIndex < previousIndex) {
          this.editingPlaceIndex = currentIndex + 1;
        } else {
          this.editingPlaceIndex = currentIndex - 1;
        }
        this.dataService.placeDataBefEditing = { ...this.places[currentIndex] };
        this.actualOrderNumber = this.places[currentIndex].order;
      }

      item.order = currentIndex + 1;

    } else {
      item.order = currentIndex + 1;
    }

    if (previousIndex < currentIndex) {
      for (let i = previousIndex + 1; i <= currentIndex; i++) {
        this.places[i].order--;
      }
    } else if (previousIndex > currentIndex) {
      for (let i = previousIndex - 1; i >= currentIndex; i--) {
        this.places[i].order++;
      }
    }

    this.places.sort((a, b) => a.order - b.order);

    this.mapService.loadPlacesOnMainMap();
    this.cdr.detectChanges();

    from(this.places).pipe(
      concatMap((place, index) => {
        if (index !== this.editingPlaceIndex) {
          return this.placeService.updatePlace(+this.projectId, place);
        } else {
          const tempPlace: Place = this.dataService.placeDataBefEditing;
          tempPlace.order = place.order;
          return this.placeService.updatePlace(+this.projectId, tempPlace);
        }
      }),
      catchError(err => {
        console.error('Error updating place order:', err);
        return of(err);
      })
    ).subscribe();
  }

  public getMarkerByPlaceId(placeId: number) {
    return this.mapService.placeMarkersMap.get(placeId) || null;
  }


  public toggleMarkingMode(index?: number) {
    this.mapService.toggleMarkingMode(index);
  }

  async addPlace(newPlace: PlaceDTO): Promise<void> {
    try {
      await this.placeManagementService.updateOrderValues();
      const added_place = await firstValueFrom(this.placeService.addPlace(+this.projectId, newPlace));

      this.places.push(added_place);
      this.places = this.places.sort((a, b) => a.order - b.order);

      this.isAddingPlaceFormBetween = false;
      this.isAddingPlaceFormOnTop = false;
      this.actualOrderNumber = null;

      this.editingPlaceIndex = null;
      //this.clickedPlusIndex = null;

      this.notificationService.showNotification('Místo bylo úspěšně přidáno!');

      await this.mapService.loadPlacesOnMainMap();
      await this.placeManagementService.loadProjectPlaces();

      this.placeManagementService.resetForm();
      //opravit chybu kdy se obrázek nezobrazuje při přidání místa bez obrázku - pak smazat tento radek
    } catch (err) {
      this.notificationService.showNotification('Nepovedlo se přidat místo!', 'error');
      let errorMessage = 'Nepovedlo se přidat místo!';

      if (err instanceof Error) {
        errorMessage = err.message;
      }

      if (this.isAddingPlaceFormBetween) {
        this.addingBetweenError = errorMessage;
      }
    } finally {
      this.mapService.disableMarking();
    }
  }


  public isDraggingAllowed(index: number | null): boolean {
    if (this.isAddingPlaceFormBetween && this.addingEditingPlaceIndex == index) {
      return false;
    } else if (this.isEditingPlaceForm && this.editingPlaceIndex == index) {
      return false;
    }
    return true;
  }

  async onFileChange(event: any, idPlace: number, idImage: number): Promise<void> {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    if (!this.fileUploadService.validateFile(selectedFile)) return;

    const placeId = this.places[idPlace].id;

    try {
      await firstValueFrom(this.placeService.uploadPlaceImage(+this.projectId, placeId, idImage, selectedFile));
      this.notificationService.showNotification('Obrázek úspěšně nahrán!', 'success');

      await this.placeManagementService.loadProjectPlaces();

    } catch (error) {
      this.notificationService.showNotification('Chyba při nahrávání obrázku.', 'error');
      console.error('Error uploading image', error);
    }

  }

  public decimalToDMS(decimal: number, isLatitude: boolean): string {
    return Utils.decimalToDMS(decimal, isLatitude);
  }
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
    this.editingTag.set('');
  }
  closeAutocomplete(): void {
    const autocompleteTrigger = this.autocompleteTrigger();
    if (autocompleteTrigger) {
      autocompleteTrigger.closePanel();
    }
  }

  public removeEditTag(tag: Tag, index: number): void {
    const tagsArray = this.places[index].tags;
    if (!tagsArray) {
      return;
    }
    const tagIndex = tagsArray.indexOf(tag);

    if (tagIndex >= 0) {
      tagsArray.splice(tagIndex, 1);
    }
  }

  selectedEditTag(event: MatAutocompleteSelectedEvent, index: number): void {
    const selectedTag = event.option.value as TagDTO;

    this.places[index].tags = this.places[index].tags || [];
    this.places[index].tags = this.places[index].tags!.filter((tag) => tag.name !== selectedTag.name);

    this.places[index].tags!.push(new Tag(0, selectedTag.name, selectedTag.color));

    this.editingTag.set('');
    const tagInput = this.tagInput();
    if (tagInput) {
      tagInput.nativeElement.value = '';
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

  public async togglePlaceInDay(place: Place, day: ItineraryDay): Promise<void> {
    try {
      if (day.placeSelections[place.id]) {
        if (!day.places.includes(place)) {
          const maxOrder = day.places.length > 0 ? Math.max(...day.places.map(p => p.order)) : 0;

          const newOrder = maxOrder + 1;

          await firstValueFrom(this.placeService.addPlaceToDay(+this.projectId!, day.id, place.id, newOrder));

          place.order = newOrder;
          day.places.push(place);

          this.notificationService.showNotification('Místo bylo přidáno do dne');
        }
      } else {
        await firstValueFrom(this.placeService.removePlaceFromDay(+this.projectId!, day.id, place.id));

        day.places = day.places.filter(p => p.id !== place.id);
        this.notificationService.showNotification('Místo bylo odstraněno ze dne');
      }
    } catch (error) {
      console.error('Chyba při úpravě místa v dni:', error);
      this.notificationService.showNotification('Došlo k chybě při úpravě místa.', 'error');
    }
  }

  public deletePlace(index: number) {
    this.placeManagementService.deletePlace(index);
  }
  public cancelEditingPlace(index: number) {
    this.placeManagementService.cancelEditingPlace(index);
  }
  public editPlace(index: number) {
    this.placeManagementService.editPlace(index);
  }
  public async showAddPlaceFormPlus(index: number, latitude = 0, longitude = 0) {
    this.placeManagementService.showAddPlaceFormPlus(index, latitude, longitude);
  }

  public savePlace(index: number) {
    this.placeManagementService.savePlace(index);
  }

  public async generateDescription(): Promise<void> {
    const title: string = this.editingPlaceForm.get('title')?.value;
    const latitude: number = this.editingPlaceForm.get('latitude')?.value;
    const longitude: number = this.editingPlaceForm.get('longitude')?.value;

    if (!title || !latitude || !longitude) {
      this.notificationService.showNotification('Vyplňte prosím název a souřadnice!', 'error');
      return;
    }
    this.isLoadingDescription = true;

    try {
      const data = await firstValueFrom(this.placeService.generateResponse(title, longitude, latitude));
      const generatedDescription = data.response;

      this.editingPlaceForm.patchValue({
        description: generatedDescription
      });
    } catch (err) {
      console.error('Error generating description:', err);
    } finally {
      this.isLoadingDescription = false;
    }
  }

  truncateDescription(description: string): string {
    const maxLength = 200;

    if (!description) {
      return '';
    }

    if (description.length > maxLength) {
      return description.substring(0, maxLength) + '...';
    }
    return description;
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

  public onImageLoaded(place: Place): void {
    place.loadingImage = false;
    this.cdr.detectChanges();
  }
}
