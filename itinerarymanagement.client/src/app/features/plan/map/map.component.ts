import { ApplicationRef, Component, createComponent, ComponentRef, EnvironmentInjector, OnInit, NgZone, ViewContainerRef, viewChild, inject } from '@angular/core';
import { MapService } from '../../../core/services/map/map.service';
import { Place, PlaceDTO, PlaceImage } from '../../../models/project/place-project';
import { WikipediaPopupComponent } from './wikipedia-popup/wikipedia-popup.component';
import { OverpassApiService } from '../../../core/services/map/overpass-api.service';
import { Proximity } from '../../../models/overpass/route-proximity';
import { OverpassRequest } from '../../../models/overpass/overpass-request';
import { DataService } from '../../../core/services/data.service';
import { PlaceManagementService } from '../../../core/services/plan/place-management.service';
import { Observable, Subscription, catchError, firstValueFrom, of } from 'rxjs';
import { MatCheckboxChange, MatCheckbox } from '@angular/material/checkbox';
import { NotificationService } from '../../../core/services/common/notification.service';
import { Element } from '../../../models/overpass/overpass-response';
import { ContextMenuComponent } from './context-menu/context-menu.component';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import mapboxgl from 'mapbox-gl';
import { ScrollService } from '../../../core/services/common/scroll.service';
import { AiPlacesDialogComponent } from '../dialogs/ai-places-dialog/ai-places-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { placeCategories } from '../../../models/overpass/place-category';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIconButton, MatButton } from '@angular/material/button';
import { NgClass } from '@angular/common';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-map',
    templateUrl: './map.component.html',
    styleUrls: ['./map.component.css'],
    standalone: true,
    imports: [MatTooltip, MatIconButton, NgClass, MatMenuTrigger, MatIcon, MatButton, MatProgressSpinner, MatMenu, MatMenuItem, MatCheckbox, FormsModule]
})
export class MapComponent implements OnInit {
  private readonly dataService = inject(DataService);
  private readonly overpassApiService = inject(OverpassApiService);
  private readonly placeManagementService = inject(PlaceManagementService);
  private readonly notificationService = inject(NotificationService);
  private readonly scrollService = inject(ScrollService);
  private readonly appRef = inject(ApplicationRef);
  private readonly injector = inject(EnvironmentInjector);
  private readonly ngZone = inject(NgZone);
  private readonly dialog = inject(MatDialog);

  public readonly mapService = inject(MapService);

  readonly contextMenuHost = viewChild.required('contextMenuHost', { read: ViewContainerRef });

  private contextMenuRef?: ComponentRef<ContextMenuComponent>;

  public isButtonDisabled = true;

  public loading = false;
  public isLoadingAiPlaces = false;
  public isLoadingPlaceMarker = false;
  public isLoadingWikipedia = false;
  public selectedPlaceType = 'all';
  public isSearching = false;
  private searchSubscription: Subscription | null = null;
  private wikipediaBatchSubscription: Subscription | null = null;

  public placeCategories = placeCategories;

  selectedPlaceCategories: Record<string, boolean> = {
    nature: false,
    landmarks: false,
    entertainment: true,
    dining: false,
    accommodation: false,
    transport: false
  };

  public selectAll = false;
  private map?: mapboxgl.Map;
  private geocoder?: MapboxGeocoder;

  ngOnInit(): void {
    this.ngZone.runOutsideAngular(() => {
      this.initializeMap();
    })
  }

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
  get markers(): Record<string, mapboxgl.Marker> {
    return this.dataService.markers;
  }
  set markers(value: Record<string, mapboxgl.Marker>) {
    this.dataService.markers = value;
  }

  private initializeMap() {
    mapboxgl.accessToken = MapService.mapboxKey;
    this.map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [0, 0],
      zoom: 2
    });
    this.mapService.setMap(this.map);

    this.geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl: mapboxgl as any,
      proximity: this.mapService.getMapCenter()
    });

    this.map.addControl(new mapboxgl.NavigationControl());
    this.map.addControl(new mapboxgl.FullscreenControl());
    this.map.addControl(new mapboxgl.ScaleControl());
    this.map.addControl(new mapboxgl.GeolocateControl());
    this.map.addControl(this.geocoder, 'top-left');

    this.map.on('load', () => {
      this.isButtonDisabled = this.map!.getZoom() < 12;
      this.mapService.loadPlacesOnMainMap();
      this.setMapView(this.places);
    });

    this.map.on('moveend', () => {
      if (this.geocoder) {
        this.geocoder.setProximity(this.mapService.getMapCenter());
      }
    });

    let initialMousePos: { x: number; y: number } | null = null;
    const moveThreshold = 5;

    this.map.on('mousedown', (event: any) => {
      if (event.originalEvent?.button === 2) {
        initialMousePos = { x: event.originalEvent.clientX, y: event.originalEvent.clientY };
      }
    });

    this.map.on('contextmenu', (event: any) => {
      if (event.originalEvent?.button === 2 && initialMousePos) {
        const dx = Math.abs(event.originalEvent.clientX - initialMousePos.x);
        const dy = Math.abs(event.originalEvent.clientY - initialMousePos.y);

        if (dx <= moveThreshold && dy <= moveThreshold) {
          this.displayContextMenu(event);
        }
        initialMousePos = null;
      }
    });

    this.map.on('zoom', () => {
      this.ngZone.run(() => {
        this.isButtonDisabled = this.map!.getZoom() < 12;
      });
    });

    this.map.on('click', (event) => {
      if (this.contextMenuRef) {
        this.contextMenuRef.destroy();
      }

      if (!this.isMarkingMode) return;

      const coords = event.lngLat;
      const placeId = this.updateCoordinates(coords);
      this.currentMarker = this.createMarker(coords, this.map!, this.actualOrderNumber);

      this.markers[placeId] = this.currentMarker;
      this.isMarkingMode = false;
      const mapElement = this.map!.getCanvas();
      mapElement.style.cursor = '';
    });

    this.geocoder.setProximity(this.mapService.getMapCenter());
  }

  private setMapView(places: Place[]) {
    const bounds = new mapboxgl.LngLatBounds();

    places.forEach(place => {
      bounds.extend([place.longitude, place.latitude]);
    });

    if (!bounds.isEmpty() && this.map) {
      this.map.fitBounds(bounds, {
        padding: { top: 50, bottom: 20, left: 20, right: 20 },
        maxZoom: 15,
        duration: 1000
      });
    }
  }

  private displayContextMenu(event: any) {

    if (this.contextMenuRef) {
      this.contextMenuRef.destroy();
    }

    this.contextMenuHost().clear();

    const { lat, lng } = event.lngLat;
    const x = event.originalEvent.pageX;
    const y = event.originalEvent.pageY;

    const hostElement = document.createElement('div');
    document.body.appendChild(hostElement);

    const contextMenuRef: ComponentRef<ContextMenuComponent> = createComponent(ContextMenuComponent, {
      environmentInjector: this.injector,
      hostElement
    });

    contextMenuRef.instance.lat = lat;
    contextMenuRef.instance.lng = lng;
    contextMenuRef.instance.x = x;
    contextMenuRef.instance.y = y;

    this.appRef.attachView(contextMenuRef.hostView);
    contextMenuRef.changeDetectorRef.detectChanges();

    contextMenuRef.instance.addPlace.subscribe((coords) => {
      this.scrollService.scrollToTop();
      this.placeManagementService.showAddPlace(coords.lat, coords.lng);
    });

    this.contextMenuRef = contextMenuRef;
  }

  private updateCoordinates(coords: mapboxgl.LngLat): number {
    const { lat, lng } = coords;
    let indexToRemove = 0;

    if (this.isEditingPlaceForm && this.editingPlaceIndex !== null) {
      indexToRemove = this.editingPlaceIndex;
    } else if (this.isAddingPlaceFormBetween && this.addingEditingPlaceIndex !== null) {
      indexToRemove = this.addingEditingPlaceIndex;
    }
    this.placeManagementService.editingPlaceForm.patchValue({ latitude: lat, longitude: lng });

    const placeId = this.places[indexToRemove].id;
    const marker = this.markers[placeId];
    if (marker) {
      marker.remove();
      delete this.markers[placeId];
    }
    return placeId;
  }

  private createMarker(coords: mapboxgl.LngLat, map: mapboxgl.Map, actualOrderNumber: number | null): mapboxgl.Marker {
    return this.mapService.createMarker(coords, map, actualOrderNumber);
  }

  private displayWikipediaInfoTest(element: any) {
    this.isLoadingWikipedia = true;
    this.loadWikipediaDataForElementTest(element).subscribe({
      next: (data) => {

        const hostElement = document.createElement('div');
        document.body.appendChild(hostElement);

        const componentRef: ComponentRef<WikipediaPopupComponent> = createComponent(WikipediaPopupComponent, {
          environmentInjector: this.injector,
          hostElement,
        });
        componentRef.instance.coordinates = [element.lon, element.lat];
        componentRef.instance.title = data.title;
        componentRef.instance.summary = data.summary;
        componentRef.instance.images = (data.images as string[])?.map((imageUrl: string, index: number) => new PlaceImage(index, imageUrl)) ?? [];
        componentRef.instance.areCordCertain = element.areCoordinatesCertain;
        componentRef.instance.openingHours = data.openingHours ?? '';
        componentRef.instance.website = data.website ?? '';

        componentRef.instance.placeAdded.subscribe((place: PlaceDTO) => {
          this.handlePlaceAdded(place);
        });

        this.appRef.attachView(componentRef.hostView);
        componentRef.changeDetectorRef.detectChanges();

        const popup = this.mapService.createPopup(hostElement);
        popup.setLngLat([element.lon, element.lat]).addTo(this.map!);

        this.isLoadingWikipedia = false;
      },
      error: (err) => {
        this.isLoadingWikipedia = false;
        console.error('Chyba při načítání dat z Wikipedie:', err);
      }
    });
  }

  private loadWikipediaDataForElementTest(element: any): Observable<any> {

    return this.overpassApiService.getWikipediaDataTest(element).pipe(
      catchError(error => {
        console.error('Chyba při načítání dat z Wikipedie:', error);
        return of({
          title: element.tags.name, summary: element.tags.description, firstImage: null
        });
      })
    );
  }

  private async handlePlaceAdded(place: PlaceDTO) {
    this.places.forEach((place) => {
      place.order += 1;
    });

    try {
      await this.placeManagementService.addPlace(place);
      this.scrollService.scrollToTop()
    } catch {
      this.places.forEach((place) => {
        place.order -= 1;
      });
    }
    
  }

  private buildOverpassQuery(bounds: mapboxgl.LngLatBounds): string {
    const selectedCategories = placeCategories.filter(category =>
      this.selectedPlaceCategories[category.key]
    );

    if (selectedCategories.length === 0) {
      // Pokud není vybrána žádná kategorie, použijte výchozí kategorii
      selectedCategories.push(placeCategories[0]);
    }

    const northEast = bounds.getNorthEast();
    const southWest = bounds.getSouthWest();
    const filters: string[] = [];

    selectedCategories.forEach(category => {
      category.tags.forEach(tag => {
        const queryPart = this.buildQueryPart(tag.key, southWest, northEast);
        if (queryPart) {
          filters.push(queryPart);
        }
      });
    });

    if (filters.length === 0) return "";

    const query = `
[out:json][timeout:100];

(
    ${filters.join('\n')}
);

(._;>;);
out body;
(._;>;);
out skel qt;
`.trim();
    console.log("query: " + query)
    return query;
  }

  private buildQueryPart(tag: string, southWest: mapboxgl.LngLat, northEast: mapboxgl.LngLat): string {
    const [key, value] = tag.split('=');
    return `
    node["${key}"="${value}"](${southWest.lat}, ${southWest.lng}, ${northEast.lat}, ${northEast.lng});
    way["${key}"="${value}"](${southWest.lat}, ${southWest.lng}, ${northEast.lat}, ${northEast.lng});
    relation["${key}"="${value}"](${southWest.lat}, ${southWest.lng}, ${northEast.lat}, ${northEast.lng});
  `.trim();
  }

  private async fetchOverpassData(bounds: mapboxgl.LngLatBounds) {
    const query = this.buildOverpassQuery(bounds);

    if (query == '') {
      this.notificationService.showNotification("Nevybrali jste kategorie pro vyhledání!", "info");
      return;
    }

    const center = this.mapService.getMapCenter();
    const proximity = new Proximity(center.latitude, center.longitude);
    const request = new OverpassRequest(query, proximity);

    try {
      const response = await firstValueFrom(this.overpassApiService.getOverpassData(request));

      const nodes = response.nodes || [];
      const others = response.others || [];

      const placesWithWikipedia: Element[] = [];
      const placesWithoutWikipedia: Element[] = [];

      const boundingBoxCRSK = {
        north: 51.055703,
        south: 47.732168,
        west: 12.090591,
        east: 22.558137
      };

      others.forEach((item: Element) => {
        const hasWikipedia = !!item.tags?.wikipedia;
        const hasValidName = !!item.tags?.name;

        if (item.type === 'way' || item.type === 'relation') {
          const nodeIds = item.nodes;
          const coordinates: { lat: number; lon: number }[] = [];

          nodeIds?.forEach((nodeId: string) => {
            const node = nodes.find((n: Element) => n.id === nodeId);
            if (node && node.lat && node.lon) {
              coordinates.push({ lat: node.lat, lon: node.lon });
            }
          });

          if (coordinates.length > 0) {
            const averageCoordinate = this.calculateAverageCoordinate(coordinates);
            item.lat = averageCoordinate.lat;
            item.lon = averageCoordinate.lon;
          }
        }

        const isOutsideCRSK = item.lat && item.lon &&
          (item.lat < boundingBoxCRSK.south || item.lat > boundingBoxCRSK.north ||
            item.lon < boundingBoxCRSK.west || item.lon > boundingBoxCRSK.east);

        if (item.tags) {
          if (isOutsideCRSK && item.tags.nameEn) {
            item.tags.name = `${item.tags.nameEn} (${item.tags.name || ''})`.trim();
          } else if (item.tags.nameCs) {
            item.tags.name = `${item.tags.nameCs} (${item.tags.name || ''})`.trim();
          }
        }

        if (hasWikipedia) {
          placesWithWikipedia.push(item);
        } else if (hasValidName) {
          placesWithoutWikipedia.push(item);
        }
      });

      const filteredPlacesWithWikipedia = placesWithWikipedia.filter(item =>
        !this.places.some(existingPlace =>
          existingPlace.latitude.toFixed(6) === item.lat?.toFixed(6) &&
          existingPlace.longitude.toFixed(6) === item.lon?.toFixed(6)
        )
      );

      const filteredPlacesWithoutWikipedia = placesWithoutWikipedia.filter(item => {
        const isDuplicate = this.places.some(existingPlace =>
          existingPlace.latitude.toFixed(6) === item.lat?.toFixed(6) &&
          existingPlace.longitude.toFixed(6) === item.lon?.toFixed(6)
        );
        return !isDuplicate;
      });

      this.displayMarkersOnMap(filteredPlacesWithWikipedia);
      this.displayPlacesWithoutWikipedia(filteredPlacesWithoutWikipedia);

    } catch (error) {
      console.error('Chyba při načítání dat z Overpass API:', error);
      this.notificationService.showNotification("Nastala chyba při získávání dat!", 'error');
      this.loading = false;
      this.isSearching = false;
    }
  }

  private displayMarkersOnMap(places: any[]) {
    places.forEach(place => {

      const onOpen = () => {
        this.displayWikipediaInfoTest(place);
      };

      this.mapService.createMarkerDatatest(place, onOpen);
    });
  }

  private calculateAverageCoordinate(coordinates: { lat: number; lon: number }[]): { lat: number; lon: number } {
    const total = coordinates.length;
    const avgLat = coordinates.reduce((sum, coord) => sum + coord.lat, 0) / total;
    const avgLon = coordinates.reduce((sum, coord) => sum + coord.lon, 0) / total;

    return { lat: avgLat, lon: avgLon };
  }

  private displayPlacesWithoutWikipedia(places: any[]) {
    places.forEach(place => {
      const onOpen = () => {
        this.displayPlaceInfoWithoutWikipedia(place);
      };

      this.mapService.createMarkerDatatest(place, onOpen);
    });

    this.loading = false;
    this.isSearching = false;
  }

  private async displayPlaceInfoWithoutWikipedia(place: any) {
    this.isLoadingPlaceMarker = true;

    const title = place.tags.name || '';
    const description = place.tags.descriptionEn || place.tags.description || '';

    try {
      const data = await firstValueFrom(this.overpassApiService.getWikidataImage(place));
      const images = data?.imageUrl ?? null;
      this.openMarkerComponent(place, title, description, images);
    } catch {
      this.openMarkerComponent(place, title, description);
    } finally {
      this.isLoadingPlaceMarker = false;
    }
  }

  private openMarkerComponent(place: any, title: string, description: string, images_input: string[] = []) {
    const hostElement = document.createElement('div');
    document.body.appendChild(hostElement);
    const componentRef: ComponentRef<WikipediaPopupComponent> = createComponent(WikipediaPopupComponent, {
      environmentInjector: this.injector,
      hostElement
    });

    componentRef.instance.coordinates = [place.lon, place.lat];
    componentRef.instance.title = title;
    componentRef.instance.summary = description;
    componentRef.instance.images = (images_input as string[])?.map((imageUrl: string, index: number) => new PlaceImage(index, imageUrl)) ?? [];
    componentRef.instance.openingHours = place.tags.openingHours;
    componentRef.instance.website = place.tags.website;
    

    componentRef.instance.placeAdded.subscribe((place: PlaceDTO) => {
      this.handlePlaceAdded(place);
    });

    this.appRef.attachView(componentRef.hostView);
    componentRef.changeDetectorRef.detectChanges();

    const mapPopup = this.mapService.createPopup(hostElement);
    mapPopup.setLngLat([place.lon, place.lat]).addTo(this.map!);
  }

  private cancelSearch() {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
      this.searchSubscription = null;
    }

    if (this.wikipediaBatchSubscription) {
      this.wikipediaBatchSubscription.unsubscribe();
      this.wikipediaBatchSubscription = null;
    }

    this.loading = false;
    this.isSearching = false;
  }

  public useOverpassApi() {
    if (this.isSearching) {
      this.cancelSearch();
      return;
    }

    const hasSelectedCategory = Object.values(this.selectedPlaceCategories).some(value => value);
    if (!hasSelectedCategory) {
      this.notificationService.showNotification("Nebyly vybrány žádné kategorie pro hledání!", "info");
      return;
    }

    const bounds = this.mapService.getBounds();
    if (!bounds) return;

    this.loading = true;
    this.isSearching = true;
    this.fetchOverpassData(bounds);
  }

  toggleSelectAll(event: MatCheckboxChange) {
    const isChecked = event.checked;
    Object.keys(this.selectedPlaceCategories).forEach(key => {
      this.selectedPlaceCategories[key] = isChecked;
    });
  }

  updateSelectAll() {
    const allSelected = Object.values(this.selectedPlaceCategories).every(val => val);
    this.selectAll = allSelected;
  }

  public keepMenuOpen(event: MouseEvent): void {
    event.stopPropagation();
  }

  public async findPlacesAI() {
    const dialogRef = this.dialog.open(AiPlacesDialogComponent, {
      width: '400px',
      data: { query: 'turistická místa' },
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe(async (userQuery) => {
      if (!userQuery) return;

      this.loading = true;
      this.isLoadingAiPlaces = true;

      if (!this.map) return;
      const zoomLevel = this.map.getZoom();

      try {
        const places = await firstValueFrom(this.placeManagementService.findPlacesAI(userQuery, zoomLevel));

        if (!places || !Array.isArray(places)) {
          this.notificationService.showNotification('Nepodařilo se najít místa pomocí AI!', 'info');
          return;
        }

        console.log("Místa z AI:", places);

        const placesWithWikipedia: Element[] = [];
        const placesWithoutWikipedia: Element[] = [];

        places.forEach((place_el: any) => {
          const place = place_el.elements[0];
          const hasWikipedia = !!place.tags?.wikipedia;
          const hasValidName = !!place.tags?.name;

          const lat = place.lat ?? null;
          const lon = place.lon ?? null;
          const coordsCertain = place.areCoordinatesCertain;
          const isPageId = place.tags.isPageId;
          const lang = place.tags.lang;
          const openingHours = place.tags?.opening_hours || null;
          const website = place.tags?.website || null;

          if (hasWikipedia) {
            placesWithWikipedia.push({ ...place, lat, lon, coordsCertain, isPageId, lang, openingHours, website });
          } else if (hasValidName) {
            placesWithoutWikipedia.push({ ...place, lat, lon, coordsCertain, isPageId, lang, openingHours, website });
          }
        });

        const filteredPlacesWithWikipedia = placesWithWikipedia.filter(place =>
          !this.places.some(existingPlace =>
            existingPlace.latitude?.toFixed(6) === place.lat?.toFixed(6) &&
            existingPlace.longitude?.toFixed(6) === place.lon?.toFixed(6)
          )
        );

        const filteredPlacesWithoutWikipedia = placesWithoutWikipedia.filter(place =>
          !this.places.some(existingPlace =>
            existingPlace.latitude?.toFixed(6) === place.lat?.toFixed(6) &&
            existingPlace.longitude?.toFixed(6) === place.lon?.toFixed(6)
          )
        );

        this.displayMarkersOnMap(filteredPlacesWithWikipedia);
        this.displayPlacesWithoutWikipedia(filteredPlacesWithoutWikipedia);
        this.notificationService.showNotification('Nalezené místa byly zobrazeny úspěšně!',);
      } catch (error) {
        console.error("Chyba při získávání míst z AI:", error);
        this.notificationService.showNotification('Nepodařilo se najít místa pomocí AI!', 'info');
      } finally {
        this.loading = false;
        this.isLoadingAiPlaces = false;
      }
    });
  }
}
