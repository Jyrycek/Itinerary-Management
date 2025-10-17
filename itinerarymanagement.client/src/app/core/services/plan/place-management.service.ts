import { Injectable, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, Observable, Subject, catchError, firstValueFrom, throwError } from 'rxjs';
import { FormValidators } from '../../../shared/validators/form-validators';
import { PlaceService } from './place.service';
import { Place, PlaceDTO } from '../../../models/project/place-project';
import { DataService } from '../data.service';
import { ItineraryDay } from '../../../models/project/itinerary-day';
import { MapService } from '../map/map.service';
import { Tag } from '../../../models/project/place-tag';
import { NotificationService } from '../common/notification.service';
import { Utils } from '../../../shared/utils/utils';
import { ConfirmDialogComponent } from '../../../features/plan/dialogs/confirm-dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { PlaceItinerarySharedService } from './place-itinerary-shared.service';

@Injectable({
  providedIn: 'root'
})
export class PlaceManagementService {
  private readonly placeService = inject(PlaceService);
  private readonly dataService = inject(DataService);
  private readonly mapService = inject(MapService);
  private readonly notificationService = inject(NotificationService);
  private readonly dialog = inject(MatDialog);
  private readonly placeItinerarySharedService = inject(PlaceItinerarySharedService);
  private readonly fb = inject(FormBuilder);

  private _editingPlaceFormSubject = new BehaviorSubject<FormGroup>(this.createPlaceForm());
  public editingPlaceForm$ = this._editingPlaceFormSubject.asObservable();

  //test
  private addPlaceSource = new Subject<{ lat: number, lng: number }>();
  showAddPlace$ = this.addPlaceSource.asObservable();


  showAddPlace(lat: number, lng: number) {
    this.addPlaceSource.next({ lat, lng });
  }
  get isAddingPlaceFormBetween(): boolean {
    return this.dataService.isAddingPlaceFormBetween;
  }
  set isAddingPlaceFormBetween(value: boolean) {
    this.dataService.isAddingPlaceFormBetween = value;
  }
  set isEditingPlaceForm(value: boolean) {
    this.dataService.isEditingPlaceForm = value;
  }
  get isEditingPlaceForm() {
    return this.dataService.isEditingPlaceForm;
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
  get places(): Place[] {
    return this.dataService.places;
  }
  set places(value: Place[]) {
    this.dataService.places = value;
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
  get isAddingPlaceFormOnTop(): boolean {
    return this.dataService.isAddingPlaceFormOnTop;
  }
  set isAddingPlaceFormOnTop(value: boolean) {
    this.dataService.isAddingPlaceFormOnTop = value;
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
    return this._editingPlaceFormSubject.value;
  }
  set editingPlaceForm(newPlaces: FormGroup) {
    this._editingPlaceFormSubject.next(newPlaces);
  }
  public resetForm() {
    this.editingPlaceForm.reset();
  }
  get currentMarker(): mapboxgl.Marker | null {
    return this.dataService.currentMarker;
  }
  set currentMarker(value: mapboxgl.Marker | null) {
    this.dataService.currentMarker = value;
  }
  get itineraryDays(): ItineraryDay[] {
    return this.dataService.itineraryDays;
  }
  set itineraryDays(value: ItineraryDay[]) {
    this.dataService.itineraryDays = value;
  }
  get placeDataBefEditing(): any {
    return this.dataService.placeDataBefEditing;
  }
  set placeDataBefEditing(value: any) {
    this.dataService.placeDataBefEditing = value;
  }
  get addingBetweenError(): string {
    return this.dataService.addingBetweenError;
  }
  set addingBetweenError(value: string) {
    this.dataService.addingBetweenError = value;
  }

  private createPlaceForm(): FormGroup {
    return this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      latitude: ['', [Validators.required, FormValidators.latitude()]],
      longitude: ['', [Validators.required, FormValidators.longitude()]],
      website: [''],
      openingHours: [''],
      description: [''],
      tags: this.fb.array([]),
      visitDuration: [0, Validators.min(0)],
      tagInput: ['']
    });
  }

  public async updateOrderValues(): Promise<void> {

    try {
      const updateOperations = this.dataService.places.map((place) =>
        firstValueFrom(this.placeService.updatePlace(+this.dataService.projectId, place))
      );

      await Promise.all(updateOperations);
    } catch { }
  }

  public async loadProjectPlaces(): Promise<void> {
    const places = await firstValueFrom(this.placeService.getProjectPlaces(this.dataService.projectId));
    this.dataService.places = places
      .map(place => new Place(
        place.id,
        place.title,
        place.description,
        place.latitude,
        place.longitude,
        place.order,
        place.placeImages,
        place.visitDuration,
        place.tags || [],
        place.website,
        place.openingHours
      ))
      .sort((a, b) => a.order - b.order);
  }

  public updatePlaceOrders(day: ItineraryDay, projectId: number): Observable<any> {

    const placeOrders = day.places.map((place: Place) => ({
      itineraryDayId: day.id,
      placeId: place.id,
      order: place.order
    }));

    return this.placeService.updatePlaceOrders(projectId, day.id, placeOrders)
      .pipe(
        catchError(error => {
          return throwError(() => error);
        })
      );
  }

  async addPlace(newPlace: PlaceDTO): Promise<void> {
    try {
      await this.updateOrderValues();
      newPlace.visitDuration = newPlace.visitDuration == 0 || newPlace.visitDuration == null ? 60 : newPlace.visitDuration;
      const added_place = await firstValueFrom(this.placeService.addPlace(+this.projectId, newPlace));

      this.places.push(added_place);
      this.places = this.places.sort((a, b) => a.order - b.order);

      this.isAddingPlaceFormBetween = false;
      this.isAddingPlaceFormOnTop = false;
      this.actualOrderNumber = null;

      this.editingPlaceIndex = null;

      this.notificationService.showNotification('Místo bylo úspěšně přidáno!');

      await this.loadPlacesOnMap();
      await this.loadProjectPlaces();

      this.resetForm();

    } catch (err) {
      this.notificationService.showNotification('Nepovedlo se přidat místo!', 'error');
      let errorMessage = 'Nepovedlo se přidat místo!';

      if (err instanceof Error) {
        errorMessage = err.message;
      }
    } finally {
      this.mapService.disableMarking();
    }
  }

  public loadPlacesOnMap() {
    this.mapService.loadPlacesOnMainMap();
  }

  //Formulář přidávání nového místa mezi již přidanými místy, tedy po kliknutí na ikonu pluska
  public async showAddPlaceFormPlus(index: number, latitude = 0, longitude = 0) {
    if (index == 0) {
      this.isAddingPlaceFormOnTop = true;
    }

    //Kontrola, zda nepřidávám někde místo mezi (pluskem)
    if (this.isAddingPlaceFormBetween) {

      const formValues = this.editingPlaceForm.value;

      this.places[this.addingEditingPlaceIndex!].title = formValues.title;
      this.places[this.addingEditingPlaceIndex!].latitude = formValues.latitude;
      this.places[this.addingEditingPlaceIndex!].longitude = formValues.longitude;
      this.places[this.addingEditingPlaceIndex!].description = formValues.description;
      this.places[this.addingEditingPlaceIndex!].visitDuration = formValues.visitDuration;
      this.places[this.addingEditingPlaceIndex!].openingHours = formValues.openingHours;
      this.places[this.addingEditingPlaceIndex!].website = formValues.website;

      if (!this.places[this.addingEditingPlaceIndex!].title.trim()) {
        this.cancelAddingEditingPlace(this.addingEditingPlaceIndex!);
      } else {
        if (index < this.addingEditingPlaceIndex!) {
          index += 1;
        }
        const dialogResult = await this.notSavedAddedPlaceBetweenDialog()
        if (!dialogResult.shouldProceed) {
          return;
        }
        index -= dialogResult.indexAdjustment;
      }

    } //Když upravuju místo, jen úprava, nepatří zde úprava jako součást přidání
    else if (this.isEditingPlaceForm) {

      if (!this.places[index].title.trim()) {
        this.cancelEditingPlace(index);
      }

      const shouldProceed = await this.notSavedEditedPlaceDialog();
      if (!shouldProceed) {
        return;
      }
    }

    this.isAddingPlaceFormBetween = true;

    if (this.places[index]) {
      this.actualOrderNumber = this.places[index].order;
    } else {
      this.actualOrderNumber = 1;
    }

    this.places.forEach((place) => {

      if (place.order >= this.places[index].order) {
        place.order += 1;
      }
    });

    this.mapService.loadPlacesOnMainMap(); //pozor tohle se vykona i pri pridavani primo ve dni

    if (latitude != 0 && longitude != 0) {
      this.editingPlaceForm.patchValue({ latitude: latitude, longitude: longitude });
      this.currentMarker = this.mapService.createMarkerForRightClick(latitude, longitude);
    }

    const newPlace = new Place(0, '', '', latitude, longitude, this.actualOrderNumber!, [], 60, []);

    this.places.splice(index, 0, newPlace);

    this.editshowAddPlaceFormPlus(index);
  }

  public cancelAddingEditingPlace(index: number) {
    this.mapService.disableMarking();

    this.updateOrderValuesMinus(index);

    this.places.splice(index, 1);

    this.isAddingPlaceFormBetween = false;
    this.addingEditingPlaceIndex = null;
    this.isAddingPlaceFormOnTop = false;

   // this.addingBetweenError = '';
    this.mapService.loadPlacesOnMainMap();

    this.resetForm();
  }

  private updateOrderValuesMinus(deletedOrder: number) {
    this.places.forEach((place) => {
      if (place.order > deletedOrder) {
        place.order -= 1;
      }
    });

    this.places.forEach((place) => {
      this.placeService.updatePlace(+this.projectId, place).subscribe({
        error: (err) => {
          console.error('Error updating place order:', err);
        }
      });
    });
  }

  //Zobrazení formuláře, který slouží pro přidání místa po kliknutí na ikonu pluska
  private async editshowAddPlaceFormPlus(index: number) {
    this.isAddingPlaceFormBetween = true;
    this.addingEditingPlaceIndex = index;

    await this.loadProjectTags();
  }

  loadProjectTags(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const tags = await firstValueFrom(this.placeService.getProjectTags(this.projectId));
        this.allTags = tags;
        resolve();
      } catch (err) {
        this.notificationService.showNotification('Nepovedlo se načíst všechny štítky!', 'error');
        reject(err);
      }
    });
  }

  public cancelEditingPlace(index: number) {
    this.mapService.disableMarking();

    if (this.isEditingPlaceForm) {
      const images = [...this.places[index].placeImages];
      this.places[index] = this.placeDataBefEditing;
      this.places[index].placeImages = images;

      this.isEditingPlaceForm = false;
      this.actualOrderNumber = null;
      this.editingPlaceIndex = null;

      this.resetForm();
      this.mapService.loadPlacesOnMainMap();
    } else if (this.isAddingPlaceFormBetween) {
      this.cancelAddingEditingPlace(index);
    }
  }


  //true - pokračovat ve vykonávání funkce - tedy otevřít nový fomulář, false - konec, pokračovat v editaci
  private async notSavedAddedPlaceBetweenDialog(): Promise<{ shouldProceed: boolean; indexAdjustment: number }> {
    try {
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        data: { message: 'Máte neuložené změny. Chcete je uložit nebo zahodit?' }
      });

      const result = await firstValueFrom(dialogRef.afterClosed());

      if (result === 'save') {
        await this.savePlace(this.addingEditingPlaceIndex!);
        await this.loadProjectPlaces();
        this.mapService.loadPlacesOnMainMap();

        this.resetForm();

        return { shouldProceed: true, indexAdjustment: 0 };
      } else if (result === 'discard') {
        this.resetForm();
        this.cancelAddingEditingPlace(this.addingEditingPlaceIndex!);
        await this.mapService.loadPlacesOnMainMap();
        return { shouldProceed: true, indexAdjustment: 1 };
      } else if (result === 'cancel') {
        return { shouldProceed: false, indexAdjustment: 0 };
      } else {
        return { shouldProceed: false, indexAdjustment: 0 };
      }

    } catch (error) {
      console.error('Error handling savePlace or loading places:', error);
      return { shouldProceed: false, indexAdjustment: 0 };
    }
  }
  async savePlace(index: number): Promise<void> {
    try {
      if (this.isAddingPlaceFormBetween) {
        const tempPlace: Place = this.places[index];

        const formValues = this.editingPlaceForm.value;

        const newPlace: PlaceDTO = new PlaceDTO(
          formValues.title,
          formValues.description,
          formValues.latitude,
          formValues.longitude,
          tempPlace.order,
          tempPlace.placeImages,
          formValues.visitDuration,
          tempPlace.tags,
          formValues.website,
          formValues.openingHours,  
        );

        const added_place = await firstValueFrom(this.placeService.addPlace(+this.projectId, newPlace));
        this.places[index] = added_place;

        await this.updateOrderValues();

        this.isAddingPlaceFormBetween = false;
        this.addingEditingPlaceIndex = null;
        this.isAddingPlaceFormOnTop = false;

        this.resetForm();

        this.notificationService.showNotification('Místo bylo úspěšně přidáno!');
        await this.loadProjectPlaces();
        this.mapService.loadPlacesOnMainMap();

      } else if (this.isEditingPlaceForm) {
        const updatedPlace = this.places[index];

        const formValues = this.editingPlaceForm.value;

        updatedPlace.title = formValues.title;
        updatedPlace.latitude = formValues.latitude;
        updatedPlace.longitude = formValues.longitude;
        updatedPlace.description = formValues.description;
        updatedPlace.visitDuration = formValues.visitDuration;
        updatedPlace.website = formValues.website;
        updatedPlace.openingHours = formValues.openingHours;

        if (!Utils.hasChanges(this.placeDataBefEditing, updatedPlace)) {
          this.notificationService.showNotification('Nebyly provedeny žádné změny', 'info');
          this.cancelEditingPlace(index);
          return;
        }

        await firstValueFrom(this.placeService.updatePlace(+this.projectId, updatedPlace));

        this.cancelEditingPlace(index);
        await this.loadProjectPlaces();

        for (const day of this.itineraryDays) {
          const placeIndex = day.places.findIndex(p => p.id === updatedPlace.id);
          if (placeIndex !== -1) {
            day.places[placeIndex] = updatedPlace;
          }
        }

        this.notificationService.showNotification('Místo bylo úspěšně upraveno!');
      }
    } catch (err) {
      if (this.isAddingPlaceFormBetween) {
        this.notificationService.showNotification('Nepovedlo se přidat místo!', 'error');
        this.addingBetweenError = "";
        this.cancelAddingEditingPlace(index);
      } else if (this.isEditingPlaceForm) {
        this.notificationService.showNotification('Nepovedlo se upravit místo!', 'error');
        this.addingBetweenError = "";
        this.cancelEditingPlace(index);
      }

      throw err;
    }
  }

  private async notSavedEditedPlaceDialog(): Promise<boolean> {
    return new Promise<boolean>(async (resolve) => {
      try {
        if (this.editingPlaceIndex == null) return;

        const formValues = this.editingPlaceForm.value;
        const placeToUpdate = this.places[this.editingPlaceIndex];

        this.places[this.editingPlaceIndex].title = formValues.title;
        this.places[this.editingPlaceIndex].latitude = formValues.latitude; //pozor zbytecne
        this.places[this.editingPlaceIndex].longitude = formValues.longitude; //pozor zbytecne
        this.places[this.editingPlaceIndex].description = formValues.description;
        this.places[this.editingPlaceIndex].visitDuration = formValues.visitDuration;
        this.places[this.editingPlaceIndex].website = formValues.website;
        this.places[this.editingPlaceIndex].openingHours = formValues.openingHours

        if (Utils.hasChanges(this.placeDataBefEditing, placeToUpdate)) {
          const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            data: { message: 'Máte neuložené změny. Chcete je uložit nebo zahodit?' }
          });

          const result = await firstValueFrom(dialogRef.afterClosed());

          if (result === 'save') {
            const updatedPlace = this.places[this.editingPlaceIndex];
            await firstValueFrom(this.placeService.updatePlace(+this.projectId, updatedPlace));
            this.notificationService.showNotification('Místo bylo úspěšně upraveno!');
            await this.loadProjectPlaces();

            this.mapService.disableMarking();
            this.isEditingPlaceForm = false;
            this.actualOrderNumber = null;
            this.editingPlaceIndex = null;

            this.mapService.loadPlacesOnMainMap();
            resolve(true);
          } else if (result === 'discard') {
            this.cancelEditingPlace(this.editingPlaceIndex!);
            this.mapService.loadPlacesOnMainMap();
            resolve(true);
          } else if (result === 'cancel') {
            resolve(false);
          }

          this.editingPlaceForm.reset({ title: '', latitude: 0, longitude: 0, description: '', tags: [] });
        } else {
          if (this.editingPlaceIndex != null) {
            this.cancelEditingPlace(this.editingPlaceIndex!);
          }
          resolve(true);
        }
      } catch (error) {
        console.error('Error handling savePlace or loading places:', error);
        resolve(false);
      }
    });
  }

  public async deletePlace(index: number): Promise<void> {
    if (this.isEditingPlaceForm && this.editingPlaceIndex == index) {
      this.cancelEditingPlace(index);
    }

    const placeId = this.places[index].id;
    const removedPlace = this.places[index];

    try {
      await firstValueFrom(this.placeService.removePlace(+this.projectId, placeId));

      this.places.splice(index, 1);
      this.updateOrderValuesMinus(index);

      for (const day of this.itineraryDays) {
        const placeIndexInDay = day.places.findIndex(p => p.id === placeId);
        if (placeIndexInDay !== -1) {
          this.placeItinerarySharedService.toggleDayContent(day);
          day.places = [...day.places.filter(p => p.id !== removedPlace.id)];
        }
      }

      this.mapService.loadPlacesOnMainMap();
      this.notificationService.showNotification('Místo bylo úspěšně odstraněno!');
    } catch (err) {
      this.notificationService.showNotification('Nepovedlo se odstranit místo!', 'error');
      console.error('Error deleting place:', err);
    }
  }

  //Pro úpravu místa
  async editPlace(index: number) {

    //Kontrola, zda nepřidávám někde místo mezi (pluskem)
    if (this.isAddingPlaceFormBetween) {
      if (!this.places[this.addingEditingPlaceIndex!].title.trim()) {
        if (index > this.addingEditingPlaceIndex!) {
          index -= 1;
        }
        this.cancelAddingEditingPlace(this.addingEditingPlaceIndex!);
      } else {
        const dialogResult = await this.notSavedAddedPlaceBetweenDialog()
        if (!dialogResult.shouldProceed) {
          return;
        }
      }

    } //Když upravuju místo, jen úprava, nepatří zde úprava jako součást přidání
    else if (this.isEditingPlaceForm) {
      const shouldProceed = await this.notSavedEditedPlaceDialog();
      if (!shouldProceed) {
        return;
      }
    }
    this.startEditingPlace(index);
  }

  async startEditingPlace(index: number) {
    const place = this.places[index];

    this.placeDataBefEditing = JSON.parse(JSON.stringify(place));
    this.isEditingPlaceForm = true;
    this.actualOrderNumber = this.places[index].order;
    this.editingPlaceIndex = index;

    this.editingPlaceForm.patchValue({
      title: place.title,
      latitude: place.latitude,
      longitude: place.longitude,
      description: place.description,
      visitDuration: place.visitDuration,
      website: place.website,
      openingHours: place.openingHours
    });

    await this.loadProjectTags();
  }

  public findPlacesAI(userQuery: string, zoom: number): Observable<any> {
    const bounds = this.mapService.getBounds();

    if (!bounds) {
      console.error("Nepodařilo se získat bounds z mapy");
      return new Observable<any>();
    }
    const existingPlaceNames = this.places.map(place => place.title);

    return this.placeService.getPlacesInBoundsAi(bounds, existingPlaceNames, userQuery, zoom);
  }
}
