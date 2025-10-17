import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { Tag } from '../../../models/project/place-tag';
import { environment } from '../../../../environments/environment';
import { Place, PlaceDTO } from '../../../models/project/place-project';
import { Itinerary, ItineraryDayPlaces } from '../../../models/project/itinerary-day';
import { LngLatBounds } from 'mapbox-gl';
import { ItineraryDayTransportSegment } from '../../../models/project/ItineraryDayTransportSegment';

@Injectable({
  providedIn: 'root'
})
export class PlaceService {
  private readonly apiUrl: string = environment.apiUrl + '/dashboard/project';
  private readonly http = inject(HttpClient);

  public getProjectPlaces(projectId: string): Observable<Place[]> {
    return this.http.get<{ places: Place[] }>(`${this.apiUrl}/${projectId}/get-places`)
      .pipe(
        map(response => response.places),
        catchError(error => {
          return throwError(() => error);
        })
      );
  }

  public getProjectTags(projectId: string): Observable<Tag[]> {
    return this.http.get<{ tags: Tag[] }>(`${this.apiUrl}/${projectId}/get-tags`)
      .pipe(
        map(response => response.tags),
        catchError(error => {
          return throwError(() => error);
        })
      );
  }

  public removePlace(projectId: number, placeId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${projectId}/remove-place/${placeId}`)
      .pipe(
        catchError(error => {
          return throwError(() => error);
        })
      );
  }

  public addPlace(projectId: number, place: PlaceDTO): Observable<Place> {
    return this.http.post<{ added_place: Place }>(`${this.apiUrl}/${projectId}/add-place`, place)
      .pipe(
        map(response => response.added_place),
        catchError(error => {
         let errorMessage = 'Nastala neznámá chyba';
          if (error.error && error.error.message) {
            errorMessage = error.error.message;
          }
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  public updatePlace(projectId: number, updatedPlace: Place): Observable<Place> {
    return this.http.put<Place>(`${this.apiUrl}/${projectId}/update-place`, updatedPlace)
      .pipe(
        catchError(error => {
          let errorMessage = 'Nastala neznámá chyba';
          if (error.error && error.error.message) {
            errorMessage = error.error.message;
          }
          return throwError(() => errorMessage);
        })
      );
  }

  public getItinerary(projectId: string): Observable<Itinerary> {
    return this.http.get<{ itinerary: Itinerary }>(`${this.apiUrl}/${projectId}/get-itinerary`)
      .pipe(
        map(response => response.itinerary),
        catchError(error => {
          return throwError(() => error);
        })
      );
  }

  public uploadPlaceImage(projectId: number, placeId: number, imageId: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<any>(`${this.apiUrl}/${projectId}/update-place-picture/${placeId}/${imageId}`, formData)
      .pipe(
        catchError(error => {
          return throwError(() => error);
        })
      );
  }

  public removePlaceFromDay(projectId: number, dayId: number, placeId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${projectId}/remove-place/${placeId}/day/${dayId}`)
      .pipe(
        catchError(error => {
          return throwError(() => error);
        })
      );
  }

  public addPlaceToDay(projectId: number, dayId: number, placeId: number, order: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${projectId}/add-place/${placeId}/day/${dayId}`,  order)
      .pipe(
        catchError(error => {
          return throwError(() => error);
        })
      );
  }

  public updatePlaceOrders(projectId: number, dayId: number, placeOrders: ItineraryDayPlaces[]): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${projectId}/update-place-orders/day/${dayId}`, placeOrders)
      .pipe(
        catchError(error => {
          console.error('Error updating place orders:', error);
          return throwError(() => error);
        })
      );
  }

  public GetPathBest(projectId: number, dayId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${projectId}/get-best-path/${dayId}`)
      .pipe(
        catchError(error => {
          console.error('path error', error);
          return throwError(() => error);
        })
      );
  }

  public generateResponse(title: string, longitude: number, latitude: number): Observable<{ response: string }> {
    const body = { title, longitude, latitude };
    return this.http.post<{ response: string }>(`${this.apiUrl}/generate`, body);
  }


  public getPlacesInBoundsAi(bounds: LngLatBounds, existingPlaceNames: string[], userquery: string, zoom_num: number): Observable<any> {
    const zoom_int = Math.round(zoom_num);
    const body = {
      minLng: bounds.getWest(),
      minLat: bounds.getSouth(),
      maxLng: bounds.getEast(),
      maxLat: bounds.getNorth(),
      zoom: zoom_int,
      existingPlaceNames: existingPlaceNames,
      userQuery: userquery
    };
    return this.http.post<{ places: Place[] }>(`${this.apiUrl}/get-places-in-bounds-ai`, body)
      .pipe(
        map(response => response.places),
        catchError(error => {
          console.error("Chyba při získávání míst:", error);
          return throwError(() => error);
        })
      );
  }

  public updateDayTimes(projectId: number, dayId: number, startTime: string, endTime: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${projectId}/update-day-times/${dayId}`, { startTime, endTime })
      .pipe(
        catchError(error => {
          console.error('Chyba při aktualizaci času dne:', error);
          return throwError(() => error);
        })
      );
  }

  public addPlacesToDay(projectId: number, dayId: number, places: { placeId: number, order: number }[]): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${projectId}/add-places/day/${dayId}`, places)
      .pipe(
        catchError(error => {
          return throwError(() => error);
        })
      );
  }

  public getTransportSegmentsByDayIds(projectId: number, dayIds: number[]): Observable<ItineraryDayTransportSegment[]> {
    return this.http.post<{ transportSegments: ItineraryDayTransportSegment[] }>(
      `${this.apiUrl}/${projectId}/transport-segments`,
      dayIds
    ).pipe(
      map(response => response.transportSegments),
      catchError(error => throwError(() => error))
    );
  }

  getWeatherForecast(lat: number, lon: number, date: string): Observable<any> {
    const apiUrl = `https://api.open-meteo.com/v1/forecast`;
    const params = {
      latitude: lat.toString(),
      longitude: lon.toString(),
      daily: 'weathercode,temperature_2m_max,temperature_2m_min',
      timezone: 'auto',
      start_date: date,
      end_date: date,
    };

    return this.http.get(apiUrl, { params }).pipe(
      catchError(error => {
        console.error('Chyba při načítání počasí:', error);
        return of(null);
      })
    );
  }
}
