import { ElementRef, Injectable, signal, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { PlaceService } from './place.service';
import { Place } from '../../../models/project/place-project';
import { DataService } from '../data.service';
import { ItineraryDay } from '../../../models/project/itinerary-day';
import { NotificationService } from '../common/notification.service';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { TagDTO, Tag } from '../../../models/project/place-tag';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { RouteSettingsDialogComponent } from '../../../features/plan/dialogs/route-settings-dialog/route-settings-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { DistanceService } from '../common/distance.service';
import { MapService } from '../map/map.service';
import { PlaceManagementService } from './place-management.service';
import { PlaceItinerarySharedService } from './place-itinerary-shared.service';
import { ItineraryDayTransportSegment } from '../../../models/project/ItineraryDayTransportSegment';

@Injectable({
  providedIn: 'root'
})
export class ItineraryManagementService {
  private readonly dataService = inject(DataService);
  private readonly notificationService = inject(NotificationService);
  private readonly placeManagementService = inject(PlaceManagementService);
  private readonly dialog = inject(MatDialog);
  private readonly placeItinerarySharedService = inject(PlaceItinerarySharedService);
  private readonly distanceService = inject(DistanceService);
  private readonly mapService = inject(MapService);
  private readonly placeService = inject(PlaceService);

  readonly separatorKeysCodes: number[] = [ENTER, COMMA];
  editingTag = signal<string>('');
  set itineraryDays(value: ItineraryDay[]) {
    this.dataService.itineraryDays = value;
  }
  get itineraryDays() {
    return this.dataService.itineraryDays;
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

  public async loadProjectDates(): Promise<void> {
    try {
      const itinerary = await firstValueFrom(this.placeService.getItinerary(this.projectId));
      if (itinerary && itinerary.itineraryDays) {
        this.itineraryDays = itinerary.itineraryDays
          .sort((a, b) => new Date(a.dayDate).getTime() - new Date(b.dayDate).getTime())
          .map((itineraryDayData: ItineraryDay) => {

            const sortedPlaces = itineraryDayData.places
              .sort((p1, p2) => p1.order - p2.order)
              .map((place) => {
                const matchedPlace = this.dataService.places.find(p => p.id === place.id);
                if (matchedPlace) {
                  place.placeImages = matchedPlace.placeImages;
                }
                return place;
              });

            return new ItineraryDay(
              itineraryDayData.id,
              new Date(itineraryDayData.dayDate),
              sortedPlaces,
              [],
              itineraryDayData.startTime,
              itineraryDayData.endTime
            );
          });
      }
    } catch (error) {
      console.error('Error loading itinerary:', error);
    }
  }

  public async togglePlaceInDay(place: Place, day: ItineraryDay): Promise<void> {
    if (day.placeSelections[place.id]) {
      if (day.places.includes(place)) return;

      const maxOrder = day.places.length > 0
        ? Math.max(...day.places.map(p => p.order)) : 0;

      const newOrder = maxOrder + 1;

      try {
        await firstValueFrom(this.placeService.addPlaceToDay(+this.projectId, day.id, place.id, newOrder));

        place.order = newOrder;
        day.places.push(place);

        this.notificationService.showNotification('Místo bylo přidáno do dne');
      } catch (error) {
        console.error('Error adding place to day:', error);
        this.notificationService.showNotification('Došlo k chybě při přidávání místa.', 'error');
      }

    } else {
      try {
        await firstValueFrom(this.placeService.removePlaceFromDay(+this.projectId, day.id, place.id));

        day.places = day.places.filter(p => p.id !== place.id);
        this.notificationService.showNotification('Místo bylo odstraněno ze dne.');
      } catch (error) {
        console.error('Error removing place from day:', error);
        this.notificationService.showNotification('Došlo k chybě při odstraňování místa.', 'error');
      }
    }
  }

  public async getBestPath(dayId: number, startOrder: number, endOrder: number) {
    const itineraryDay = this.itineraryDays.find(day => day.id === dayId);

    if (!itineraryDay) {
      this.notificationService.showNotification("Nebyla nalezena data pro tento den.");
      return;
    }

    const places = [...itineraryDay.places];

    const startPlace = places.find(place => place.order === startOrder);
    const endPlace = places.find(place => place.order === endOrder);

    if (!startPlace || !endPlace) {
      this.notificationService.showNotification("Zadané počáteční nebo cílové místo nebylo nalezeno.");
      return;
    }

    const middlePlaces = places.filter(place => place !== startPlace && place !== endPlace);

    try {
      const temporaryItineraryDay = {
        ...itineraryDay,
        places: [startPlace, ...middlePlaces, endPlace],
      } as ItineraryDay;

      const bestPathIndices = await this.distanceService.getBestPathWithStartEnd(temporaryItineraryDay);
      if (bestPathIndices) {
        const orderedPlaces = bestPathIndices.map(index => temporaryItineraryDay.places[index]);

        const isOrderChanged = orderedPlaces.some((place, i) => place.id !== itineraryDay.places[i]?.id);
        if (isOrderChanged) {
          orderedPlaces.forEach((place, i) => {
            place.order = i + 1;
          });

          itineraryDay.places = [...orderedPlaces];

          await firstValueFrom(this.placeManagementService.updatePlaceOrders(itineraryDay, +this.projectId));
          this.notificationService.showNotification("Optimalizace trasy proběhla úspěšně");
        } else {
          this.notificationService.showNotification("Trasa je již optimalizována");
        }
      } else {
        this.notificationService.showNotification("Došlo k chybě při hledání optimální trasy", 'error');
      }
      itineraryDay.isLoadingPath = false;

    } catch (error) {
      itineraryDay.isLoadingPath = false;
      console.error("Error in getting best path:", error);
      this.notificationService.showNotification("Došlo k chybě při hledání optimální trasy", 'error');
    }
  }

  selectedEditTag(event: MatAutocompleteSelectedEvent, index: number, tagInputDialog?: ElementRef<HTMLInputElement>): void {
    const selectedTag = event.option.value as TagDTO;

    this.places[index].tags = this.places[index].tags || [];
    this.places[index].tags = this.places[index].tags!.filter((tag) => tag.name !== selectedTag.name);

    this.places[index].tags!.push(new Tag(0, selectedTag.name, selectedTag.color));

    this.editingTag.set('');
    if (tagInputDialog) {
      tagInputDialog.nativeElement.value = '';
    }
  }

  public async openRouteSettingsDialog(dayId: number, refresh = false, selectedDay?: ItineraryDay) {
    const itineraryDay = this.itineraryDays.find(day => day.id === dayId);

    if (!itineraryDay) return;

    if (!itineraryDay.places || itineraryDay.places.length < 3) {
      this.notificationService.showNotification('Den itineráře musí mít aspoň tři místa', 'error');
      return;
    }

    const dialogRef = this.dialog.open(RouteSettingsDialogComponent, {
      width: '350px',
      data: { places: itineraryDay.places },
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (!result) return;

      itineraryDay.isLoadingPath = true;

      let { startLocation, endLocation } = result;

      console.log("startLocation: " + startLocation);

      if (endLocation != null && startLocation != null) {
        if (startLocation === endLocation) {
          this.notificationService.showNotification('Stejné místo nemůže být zvoleno jako počáteční a cílové zároveň!', 'error');
          itineraryDay.isLoadingPath = false;
          return;
        }
      }

      this.dataService.setLastSelection(startLocation, endLocation);

      ({ startLocation, endLocation } = this.setLocations(startLocation, endLocation, itineraryDay.places.length));

      await this.getBestPath(dayId, startLocation, endLocation);

      if (refresh && selectedDay) {
        this.mapService.loadPlacesOnDialogMap(selectedDay, this.mapService.getDialogMap()!);
      }
    });
  }

  private setLocations(startLocation: number | null, endLocation: number | null, totalPlaces: number) {
    if (startLocation == null) startLocation = 1;
    if (endLocation == null) endLocation = totalPlaces;

    return { startLocation, endLocation };
  }

  public async removePlaceFromDay(day: ItineraryDay, place: Place): Promise<void> {
    try {
      await firstValueFrom(this.placeService.removePlaceFromDay(+this.projectId, day.id, place.id));

      if (day.places.length == 1) {
        this.placeItinerarySharedService.toggleDayContent(day);
      }

      day.places = [...day.places.filter(p => p.id !== place.id)];
      delete day.placeSelections[place.id];

      day.places.forEach(p => {
        if (p.order > place.order) {
          p.order -= 1;
        }
      });

      this.mapService.loadPlacesOnMainMap();
      this.mapService.loadPlacesOnDialogMap(day, this.mapService.getDialogMap()!);

      this.notificationService.showNotification('Místo bylo úspěšně odstraněno!');
    } catch (error) {
      this.notificationService.showNotification('Došlo k chybě při odstraňování místa!', 'error');
      console.error('Error removing place from day:', error);
    }
  }

  public async addPlacesToDay(day: ItineraryDay): Promise<void> {
    if (!day.places || day.places.length === 0) return;

    const placesToAdd = day.places.map((p, index) => ({
      placeId: p.id,
      order: index + 1
    }));

    try {
      await firstValueFrom(this.placeService.addPlacesToDay(+this.projectId, day.id, placesToAdd));

      this.notificationService.showNotification('Všechna místa byla úspěšně přidána!');
    } catch (error) {
      this.notificationService.showNotification('Došlo k chybě při přidávání míst!', 'error');
      console.error('Error adding places to day:', error);
    }
  }

  public loadTransportSegments(): void {
    const projectId = +this.dataService.projectId;
    const dayIds = this.itineraryDays.map(day => day.id);

    this.placeService.getTransportSegmentsByDayIds(projectId, dayIds).subscribe({
      next: (segments) => {
        const grouped = new Map<number, ItineraryDayTransportSegment[]>();
        for (const segment of segments) {
          const dayId = segment.itineraryDayId;
          if (!grouped.has(dayId)) {
            grouped.set(dayId, []);
          }
          grouped.get(dayId)!.push(segment);
        }

        this.dataService.transportSegments = grouped;
      }
    });
  }
}
