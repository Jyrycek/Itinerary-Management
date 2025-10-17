import { ApplicationRef, ComponentFactoryResolver, ComponentRef, EventEmitter, inject, Injectable, Injector, NgZone } from '@angular/core';
import mapboxgl, { LngLatBounds } from 'mapbox-gl';
import { DataService } from '../data.service';
import { RouteService } from './route.service';
import { Place } from '../../../models/project/place-project';
import { ItineraryDay } from '../../../models/project/itinerary-day';
import { MapPopupComponent } from '../../../features/shared-ui/map-popup/map-popup.component';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { RouteResponse } from '../../../models/route/route-response';
import { PlaceManagementService } from '../plan/place-management.service';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})

export class MapService {
  private placeManagementService?: PlaceManagementService;

  private readonly injector = inject(Injector);
  private readonly componentFactoryResolver = inject(ComponentFactoryResolver);
  private readonly applicationRef = inject(ApplicationRef);
  private readonly ngZone = inject(NgZone);
  private readonly dataService = inject(DataService);
  private readonly routeService = inject(RouteService);

  public placeEdited: EventEmitter<Place> = new EventEmitter<Place>();
  public placeDeleted: EventEmitter<Place> = new EventEmitter<Place>();

  private dialogMarkers: Record<string, mapboxgl.Marker> = {};

  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  private mainMap?: mapboxgl.Map;
  private dialogMap?: mapboxgl.Map;
  private dialogSortMap?: mapboxgl.Map;
  public static mapboxKey = environment.mapboxKey;

  public mapStyles: { label: string, style: string }[] = [
    { label: 'Streets', style: 'mapbox://styles/mapbox/streets-v11' },
    { label: 'Satellite', style: 'mapbox://styles/mapbox/satellite-v9' },
    { label: 'Outdoors', style: 'mapbox://styles/mapbox/outdoors-v11' },
    { label: 'Light', style: 'mapbox://styles/mapbox/light-v10' },
    { label: 'Dark', style: 'mapbox://styles/mapbox/dark-v10' }
  ];

  public currentDefaultMapStyle: string = this.mapStyles[0].style;
  public currentMapSortStyle: string = this.mapStyles[0].style;
  public currentMapItineraryStyle: string = this.mapStyles[0].style;

  private getPlaceManagementService(): PlaceManagementService {
    if (!this.placeManagementService) {
      this.placeManagementService = this.injector.get(PlaceManagementService);
    }
    return this.placeManagementService;
  }

  get markers(): Record<string, mapboxgl.Marker> {
    return this.dataService.markers;
  }
  set markers(value: Record<string, mapboxgl.Marker>) {
    this.dataService.markers = value;
  }
  get places(): Place[] {
    return this.dataService.places;
  }
  set places(value: Place[]) {
    this.dataService.places = value;
  }
  get itineraryDays(): ItineraryDay[] {
    return this.dataService.itineraryDays;
  }
  set itineraryDays(value: ItineraryDay[]) {
    this.dataService.itineraryDays = value;
  }
  set currentMarker(value: mapboxgl.Marker | null) {
    this.dataService.currentMarker = value;
  }
  get isMarkingMode(): boolean {
    return this.dataService.isMarkingMode;
  }
  set isMarkingMode(value: boolean) {
    this.dataService.isMarkingMode = value;
  }
  get actualOrderNumber(): number | null {
    return this.dataService.actualOrderNumber;
  }
  set actualOrderNumber(value: number | null) {
    this.dataService.actualOrderNumber = value;
  }
  public setMap(mapInstance?: mapboxgl.Map) {
    this.mainMap = mapInstance;
  }
  public getMainMap() {
    return this.mainMap;
  }
  public setDialogMap(mapInstance?: mapboxgl.Map) {
    this.dialogMap = mapInstance;
  }
  public getDialogMap() {
    return this.dialogMap;
  }
  public setDialogSortMap(mapInstance?: mapboxgl.Map) {
    this.dialogSortMap = mapInstance;
  }
  public getDialogSortMap() {
    return this.dialogSortMap;
  }
  get isEditingPlaceForm(): boolean {
    return this.dataService.isEditingPlaceForm;
  }
  set isEditingPlaceForm(value: boolean) {
    this.dataService.isEditingPlaceForm = value;
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
  get editingPlaceIndex(): number | null {
    return this.dataService.editingPlaceIndex;
  }
  set editingPlaceIndex(value: number | null) {
    this.dataService.editingPlaceIndex = value;
  }

  public getMapCenter(): { latitude: number, longitude: number } {
    if (!this.mainMap) {
      throw new Error("Map not initialized");
    }
    const center = this.mainMap.getCenter();
    return { latitude: center.lat, longitude: center.lng };
  }

  public markPlaceOnMap(coordinates?: [number, number], map: mapboxgl.Map = this.mainMap!) {
    if (!map || !coordinates) return;

    map.setCenter(coordinates);
  }

  public markPlaceOnDialogMap(coordinates?: [number, number], map: mapboxgl.Map = this.dialogMap!) {
    if (!map || !coordinates) return;

    map.setCenter(coordinates);
  }

  public markPlaceOnDialogSortMap(coordinates?: [number, number], map: mapboxgl.Map = this.dialogSortMap!) {
    if (!map || !coordinates) return;

    map.setCenter(coordinates);
  }

  public createPopup(hostElement: HTMLElement): mapboxgl.Popup {
    return new mapboxgl.Popup({ offset: 50 }).setDOMContent(hostElement);
  }

  public createMarkerDatatest(element: any, onOpen: () => void) {
    this.ngZone.runOutsideAngular(() => {
      const marker = new mapboxgl.Marker()
        .setLngLat([element.lon, element.lat])
        .addTo(this.mainMap!);

      marker.getElement().addEventListener('click', onOpen);
    });
  }

  public createMarkerData(element: any, popup: mapboxgl.Popup) {
    this.ngZone.runOutsideAngular(() => {
      new mapboxgl.Marker()
        .setLngLat([element.lon, element.lat])
        .setPopup(popup)
        .addTo(this.mainMap!);
    });
  }

  public resize() {
    this.mainMap?.resize();
  }

  public getBounds(): LngLatBounds | undefined {
    return this.mainMap?.getBounds() as LngLatBounds | undefined;
  }

  public placeMarkersMap = new Map<number, mapboxgl.Marker>();

  public loadPlacesOnMainMap() {
    if (!this.mainMap) return;

    document.querySelectorAll('.marker').forEach(marker => marker.remove());

    this.markers = {};
    this.placeMarkersMap.clear();

    const sortedPlaces = this.places.sort((a, b) => a.order - b.order);

    sortedPlaces.forEach(place => {
      const el = document.createElement('div');
      el.className = 'marker';
      el.textContent = place.order !== undefined && place.order !== null ? place.order.toString() : '';

      const componentRef = this.createPopupComponent(place, true);

      componentRef.instance.editPlace.subscribe((placeToEdit) => {
        this.placeEdited.emit(placeToEdit); //todo udelat tridu na spravu uprav atd
      });

      componentRef.instance.deletePlace.subscribe((placeToDelete) => {
        this.placeDeleted.emit(placeToDelete); //todo

        try {
          const popup = this.markers[placeToDelete.id].getPopup();

          if (popup) {
            popup.remove();
          }

        } catch { }

        this.placeMarkersMap.delete(placeToDelete.id);
      });

      componentRef.instance.hidePlace.subscribe((placeToHide) => {
        try {
          const popup = this.markers[placeToHide.id].getPopup();

          if (popup) {
            popup.remove();
          }

        } catch { }
      });

      const marker = new mapboxgl.Marker(el, { anchor: 'bottom', offset: [0, -5] })
        .setLngLat([place.longitude, place.latitude])
        .setPopup(new mapboxgl.Popup(
          {
            offset: [0, -10],
            closeButton: false
          }).setDOMContent(componentRef.location.nativeElement))
        .addTo(this.mainMap!);

      this.markers[place.id] = marker;
      this.placeMarkersMap.set(place.id, marker);
    });
  }

  private createPopupComponent(place: Place, showButtons = false): ComponentRef<MapPopupComponent> {
    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(MapPopupComponent);
    const componentRef = componentFactory.create(this.injector);

    componentRef.instance.place = place;
    componentRef.instance.showButtons = showButtons;

    this.applicationRef.attachView(componentRef.hostView);

    return componentRef;
  }


  public toggleMarkingMode(index?: number) {
    const mapElement = this.mainMap!.getCanvas();
    if (this.isMarkingMode) {
      this.disableMarking();
      mapElement.style.cursor = '';
    } else {
      this.isMarkingMode = true;
      mapElement.style.cursor = 'pointer';
      if (index !== undefined) {
        this.actualOrderNumber = this.places[index].order;
      }
    }
  }
  public toggleMarkingModeDialog(index?: number) {
    const mapElement = this.dialogMap!.getCanvas();
    if (this.isMarkingMode) {
      this.disableMarking();
      mapElement.style.cursor = '';
    } else {
      this.isMarkingMode = true;
      mapElement.style.cursor = 'pointer';
      if (index == undefined) {
        this.actualOrderNumber = 0;
      } else {
        this.actualOrderNumber = index;
      }
    }
  }

  public disableMarkingDialog() {
    if (this.currentMarker) {
      this.currentMarker.remove();
      this.currentMarker = null;
    }
    this.isMarkingMode = false;

    const mapElement = this.dialogMap!.getCanvas();
    mapElement.style.cursor = '';
  }

  public disableMarking() {
    if (this.currentMarker) {
      this.currentMarker.remove();
      this.currentMarker = null;
    }
    this.isMarkingMode = false;

    const mapElement = this.mainMap!.getCanvas();
    mapElement.style.cursor = '';
  }

  public async loadPlacesOnDialogMap(selectedDay: ItineraryDay, dialogMap: mapboxgl.Map): Promise<void> {
    if (!dialogMap) return;

    this.loadingSubject.next(true);

    this.dialogMap = dialogMap;

    document.querySelectorAll('.marker').forEach(dialogMarkers => dialogMarkers.remove());

    this.dialogMarkers = {};

    const sortedPlaces = selectedDay.places.sort((a, b) => a.order - b.order);

    sortedPlaces.forEach(place => {
      const el = document.createElement('div');
      el.className = 'marker';
      el.textContent = place.order.toString();

      const componentRef = this.createPopupComponent(place);
      componentRef.instance.showButtons = false;

      componentRef.instance.hidePlace.subscribe((placeToHide) => {
        this.dialogMarkers[placeToHide.id].getPopup()?.remove();
        try {
          const popup = this.dialogMarkers[placeToHide.id].getPopup();

          if (popup) {
            popup.remove();
          }
        } catch { }
      });

      const marker = new mapboxgl.Marker(el, { anchor: 'bottom', offset: [0, -5] })
        .setLngLat([place.longitude, place.latitude])
        .setPopup(new mapboxgl.Popup({
          offset: [0, -10],
          closeButton: false
        }).setDOMContent(componentRef.location.nativeElement))
        .addTo(this.dialogMap!);

      this.dialogMarkers[place.id] = marker;
    });

    await this.connectPlacesPerDayDialogMap(selectedDay);

    this.loadingSubject.next(false);
  }
  private storedRoutes: GeoJSON.Feature[] = [];

  public async connectPlacesPerDayDialogMap(day: ItineraryDay) {
    if (!this.dialogMap || !day.places.length) return;
    this.storedRoutes = [];

    const sortedPlaces = day.places.sort((a, b) => a.order - b.order);
    const featureCollection: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: []
    };

    for (let i = 0; i < sortedPlaces.length - 1; i++) {
      const startPlace = sortedPlaces[i];
      const endPlace = sortedPlaces[i + 1];

      try {
        const route: RouteResponse[] = await firstValueFrom(
          this.routeService.getRoute(startPlace.latitude, startPlace.longitude, endPlace.latitude, endPlace.longitude)
        );

        if (!route || !route.length) continue;

        const coordinates = route.map(point => [point.longitude, point.latitude]);

        const routeFeature: GeoJSON.Feature = {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: coordinates
          },
          properties: {
            dayId: day.id,
            color: "red"
          }
        };

        featureCollection.features.push(routeFeature);
      } catch { }
    }

    if (featureCollection.features.length > 0) {
      this.storedRoutes.push(...featureCollection.features);  // Uložení tras do seznamu
      this.updateMapWithRoutes();
    }
  }

  private dayMarkers = new Map<number, mapboxgl.Marker[]>();

  private updateMapWithRoutes() {
    const routeLayerId = 'routes-layer';

    if (!this.dialogMap) return;

    const source = this.dialogMap.getSource(routeLayerId) as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData({
        type: 'FeatureCollection',
        features: this.storedRoutes
      });
    } else {
      this.dialogMap.addSource(routeLayerId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: this.storedRoutes
        }
      });

      this.dialogMap.addLayer({
        id: routeLayerId,
        type: 'line',
        source: routeLayerId,
        layout: {
          'line-cap': 'round',
          'line-join': 'round'
        },
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 3
        }
      });
    }
  }

  public async connectPlacesPerDayDialogMapSort(day: ItineraryDay, color: string): Promise<void> {
    if (!this.dialogSortMap || !day.places.length) return;
    this.existingRoutes = [];

    if (day.places.length === 1) {
      const place = day.places[0];
      this.addMarkerToMap(place.latitude, place.longitude, color, place);
      return;
    }

    const sortedPlaces = day.places.sort((a, b) => a.order - b.order);
    const newFeatures: GeoJSON.Feature[] = [];

    for (let i = 0; i < sortedPlaces.length - 1; i++) {
      const startPlace = sortedPlaces[i];
      const endPlace = sortedPlaces[i + 1];

      try {
        const route: RouteResponse[] = await firstValueFrom(
          this.routeService.getRoute(startPlace.latitude, startPlace.longitude, endPlace.latitude, endPlace.longitude)
        );

        if (!route || !route.length) continue;

        const coordinates = route.map(point => [point.longitude, point.latitude]);

        const routeFeature: GeoJSON.Feature = {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: coordinates
          },
          properties: {
            dayId: day.id,
            color: color
          }
        };
        newFeatures.push(routeFeature);

        this.addMarkerToMap(startPlace.latitude, startPlace.longitude, color, startPlace);
        this.addMarkerToMap(endPlace.latitude, endPlace.longitude, color, endPlace);

      } catch (error) {
        console.error("Chyba při získávání trasy:", error);
      }
    }

    if (newFeatures.length > 0) {
      this.existingRoutes = [...this.existingRoutes, ...newFeatures];

      this.updateMapWithRoutesSort();
    }
  }

  public placeMarkers = new Map<number, mapboxgl.Marker[]>();

  public addMarkerToMap(latitude: number, longitude: number, color: string, place: Place) {
    if (!this.dialogSortMap) return;

    const marker = new mapboxgl.Marker({ color })
      .setLngLat([longitude, latitude]);

    const componentRef = this.createPopupComponent(place, false);
    const popup = new mapboxgl.Popup({ offset: [0, -10], closeButton: false })
      .setDOMContent(componentRef.location.nativeElement);

    marker.setPopup(popup);
    marker.addTo(this.dialogSortMap);

    if (!this.placeMarkers.has(place.id)) {
      this.placeMarkers.set(place.id, []);
    }
    this.placeMarkers.get(place.id)?.push(marker);
  }

  public existingRoutes: GeoJSON.Feature[] = [];

  public updateMapWithRoutesSort() {
    const routeLayerId = 'routes-layer';

    if (!this.dialogSortMap) return;

    const source = this.dialogSortMap.getSource(routeLayerId) as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData({
        type: 'FeatureCollection',
        features: this.existingRoutes
      });
    } else {
      this.dialogSortMap.addSource(routeLayerId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: this.existingRoutes
        }
      });

      this.dialogSortMap.addLayer({
        id: routeLayerId,
        type: 'line',
        source: routeLayerId,
        layout: {
          'line-cap': 'round',
          'line-join': 'round'
        },
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 3
        }
      });
    }
  }

  public createMarkerForRightClick(lat: number, lng: number): mapboxgl.Marker {
    const coords = new mapboxgl.LngLat(lng, lat);
    return this.createMarker(coords, this.mainMap!, 1);
  }

  public createMarker(coords: mapboxgl.LngLat, map: mapboxgl.Map, actualOrderNumber: number | null): mapboxgl.Marker {
    let marker: mapboxgl.Marker | null = null;

    this.ngZone.runOutsideAngular(() => {
      const el = document.createElement('div');
      el.className = 'marker';

      if (actualOrderNumber !== null) {
        el.textContent = actualOrderNumber.toString();
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

  public setMapDialogMapView(places: Place[]) {
    const bounds = new mapboxgl.LngLatBounds();

    places.forEach(place => {
      bounds.extend([place.longitude, place.latitude]);
    });

    if (bounds.isEmpty()) return;

    const map = this.getDialogMap();

    if (!map) return;

    map.fitBounds(bounds, {
      padding: { top: 50, bottom: 20, left: 20, right: 20 },
      maxZoom: 15,
      duration: 1000
    });
  }

  public updateCoordinates(coords: mapboxgl.LngLat): number {
    const { lat, lng } = coords;
    let indexToRemove = 0;

    if (this.isEditingPlaceForm && this.editingPlaceIndex !== null) {
      indexToRemove = this.editingPlaceIndex;
    } else if (this.isAddingPlaceFormBetween && this.addingEditingPlaceIndex !== null) {
      indexToRemove = this.addingEditingPlaceIndex;
    }

    const placeManagementService = this.getPlaceManagementService();
    placeManagementService.editingPlaceForm.patchValue({ latitude: lat, longitude: lng });

    const placeId = this.places[indexToRemove].id;
    const marker = this.markers[placeId];
    if (marker) {
      marker.remove();
      delete this.markers[placeId];
    }
    return placeId;
  }

  public changeMapStyle(event: Event, mapType: "default" | "sort" | "itinerary") {
    const selectElement = event.target as HTMLSelectElement;

    const style = selectElement.value;
    let map;
    switch (mapType) {
      case "default":
        this.currentDefaultMapStyle = style;
        map = this.getMainMap();
        break;
      case "sort":
        this.currentMapSortStyle = style;
        map = this.getDialogSortMap();
        break;
      case "itinerary":
        this.currentMapItineraryStyle = style;
        map = this.getDialogMap();
        break;
    }

    if (map) {
      map.setStyle(style);

      map.on('styledata', () => {
        if (mapType == "sort") {
          this.updateMapWithRoutesSort();
        } else if (mapType == "itinerary") {
          this.updateMapWithRoutes();
        }
      });
    }
  }
}
