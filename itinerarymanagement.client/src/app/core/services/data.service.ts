import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Place } from '../../models/project/place-project';
import { Tag } from '../../models/project/place-tag';
import { ItineraryDay } from '../../models/project/itinerary-day';
import { ItineraryDayTransportSegment } from '../../models/project/ItineraryDayTransportSegment';

export type TransportSegmentsByDay = Map<number, ItineraryDayTransportSegment[]>;

@Injectable({
  providedIn: 'root'
})

export class DataService {
  private _projectId: BehaviorSubject<string> = new BehaviorSubject<string>('');
  public projectId$: Observable<string> = this._projectId.asObservable();

  private _placesSubject: BehaviorSubject<Place[]> = new BehaviorSubject<Place[]>([]);
  public places$: Observable<Place[]> = this._placesSubject.asObservable();

  private tagsSubject = new BehaviorSubject<Tag[]>([]);
  public tags$ = this.tagsSubject.asObservable();

  private itineraryDaysSubject = new BehaviorSubject<ItineraryDay[]>([]);
  public itineraryDays$ = this.itineraryDaysSubject.asObservable();

  private _isAddingPlaceFormOnTopSubject = new BehaviorSubject<boolean>(false);
  public isAddingPlaceFormOnTop$: Observable<boolean> = this._isAddingPlaceFormOnTopSubject.asObservable();

  private _editingPlaceIndexSubject = new BehaviorSubject<number | null>(null);
  public editingPlaceIndex$: Observable<number | null> = this._editingPlaceIndexSubject.asObservable();

  private _addingEditingPlaceIndexSubject = new BehaviorSubject<number | null>(null);
  public addingEditingPlaceIndex$: Observable<number | null> = this._addingEditingPlaceIndexSubject.asObservable();

  private _actualOrderNumberSubject = new BehaviorSubject<number | null>(null);
  public actualOrderNumber$: Observable<number | null> = this._actualOrderNumberSubject.asObservable();

  private _isMarkingModeSubject = new BehaviorSubject<boolean>(false);
  public isMarkingMode$: Observable<boolean> = this._isMarkingModeSubject.asObservable();

  private _isAddingPlaceFormBetweenSubject = new BehaviorSubject<boolean>(false);
  public isAddingPlaceFormBetween$: Observable<boolean> = this._isAddingPlaceFormBetweenSubject.asObservable();

  private _currentMarkerSubject = new BehaviorSubject<mapboxgl.Marker | null>(null);
  public currentMarker$: Observable<mapboxgl.Marker | null> = this._currentMarkerSubject.asObservable();

  private _isEditingPlaceFormSubject = new BehaviorSubject<boolean>(false);
  public isEditingPlaceForm$: Observable<boolean> = this._isEditingPlaceFormSubject.asObservable();

  private _placeDataBefEditingSubject = new BehaviorSubject<any>(null);
  public placeDataBefEditing$: Observable<any> = this._placeDataBefEditingSubject.asObservable();

  private _markers = new BehaviorSubject<Record<string, mapboxgl.Marker>>({});

  private _addingBetweenErrorSubject = new BehaviorSubject<string>('');
  public addingBetweenError$: Observable<string> = this._addingBetweenErrorSubject.asObservable();

  private lastSelection: { startLocation: number | null, endLocation: number | null } | null = null;

  private _transportSegmentsSubject = new BehaviorSubject<TransportSegmentsByDay>(new Map());
  public transportSegments$ = this._transportSegmentsSubject.asObservable();

  setLastSelection(startLocation: number, endLocation: number) {
    this.lastSelection = { startLocation, endLocation };
  }

  getLastSelection() {
    return this.lastSelection;
  }
  get places(): Place[] {
    return this._placesSubject.value;
  }
  set places(newPlaces: Place[]) {
    this._placesSubject.next(newPlaces);
  }
  get tags(): Tag[] {
    return this.tagsSubject.value;
  }
  set tags(newTags: Tag[]) {
    this.tagsSubject.next(newTags);
  }
  get itineraryDays(): ItineraryDay[] {
    return this.itineraryDaysSubject.value;
  }
  set itineraryDays(itineraryDay: ItineraryDay[]) {
    this.itineraryDaysSubject.next(itineraryDay);
  }
  get isAddingPlaceFormOnTop(): boolean {
    return this._isAddingPlaceFormOnTopSubject.value;
  }
  set isAddingPlaceFormOnTop(value: boolean) {
    this._isAddingPlaceFormOnTopSubject.next(value);
  }
  get editingPlaceIndex(): number | null {
    return this._editingPlaceIndexSubject.value;
  }
  set editingPlaceIndex(value: number | null) {
    this._editingPlaceIndexSubject.next(value);
  }
  get addingEditingPlaceIndex(): number | null {
    return this._addingEditingPlaceIndexSubject.value;
  }
  set addingEditingPlaceIndex(value: number | null) {
    this._addingEditingPlaceIndexSubject.next(value);
  }
  get actualOrderNumber(): number | null {
    return this._actualOrderNumberSubject.value;
  }
  set actualOrderNumber(value: number | null) {
    this._actualOrderNumberSubject.next(value);
  }
  get isMarkingMode(): boolean {
    return this._isMarkingModeSubject.value;
  }
  set isMarkingMode(value: boolean) {
    this._isMarkingModeSubject.next(value);
  }
  get isAddingPlaceFormBetween(): boolean {
    return this._isAddingPlaceFormBetweenSubject.value;
  }
  set isAddingPlaceFormBetween(value: boolean) {
    this._isAddingPlaceFormBetweenSubject.next(value);
  }
  get isEditingPlaceForm(): boolean {
    return this._isEditingPlaceFormSubject.value;
  }
  set isEditingPlaceForm(value: boolean) {
    this._isEditingPlaceFormSubject.next(value);
  }
  get currentMarker(): mapboxgl.Marker | null {
    return this._currentMarkerSubject.value;
  }
  set currentMarker(value: mapboxgl.Marker | null) {
    this._currentMarkerSubject.next(value);
  }
  get projectId(): string {
    return this._projectId.value;
  }
  set projectId(value: string) {
    this._projectId.next(value);
  }
  get markers(): Record<string, mapboxgl.Marker> {
    return this._markers.value;
  }
  set markers(value: Record<string, mapboxgl.Marker>) {
    this._markers.next(value);
  }
  get placeDataBefEditing(): any {
    return this._markers.value;
  }
  set placeDataBefEditing(value: any) {
    this._markers.next(value);
  }
  get addingBetweenError(): string {
    return this._addingBetweenErrorSubject.value;
  }
  set addingBetweenError(value: string) {
    this._addingBetweenErrorSubject.next(value);
  }
  get transportSegments(): TransportSegmentsByDay {
    return this._transportSegmentsSubject.value;
  }
  set transportSegments(value: TransportSegmentsByDay) {
    this._transportSegmentsSubject.next(value);
  }
}
