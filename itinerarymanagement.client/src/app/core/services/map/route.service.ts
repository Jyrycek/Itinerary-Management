import { Injectable, inject } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Coordinate } from '../../../models/route/route-coordinate';
import { RouteRequest, VehicleType } from '../../../models/route/route-request';
import { RouteResponse } from '../../../models/route/route-response';

@Injectable({
  providedIn: 'root'
})
export class RouteService {
  private readonly apiUrl: string = environment.apiUrl + '/route';
  private readonly http = inject(HttpClient);


  getRoute(startLat: number, startLon: number, endLat: number, endLon: number, vehicleType: VehicleType = VehicleType.Pedestrian): Observable<RouteResponse[]> {
    const request: RouteRequest = { startLat, startLon, endLat, endLon, vehicleType };
    return this.http.post<RouteResponse[]>(`${this.apiUrl}/get-route`, request)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error querying route data:', error);
          return of([]);
        })
      );
  }
  calculateDistanceMatrix(coordinates: Coordinate[]): Observable<number[][]> {
    return this.http.post<number[][]>(`${this.apiUrl}/calculate-distance-matrix`, coordinates)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error calculating distance matrix:', error);
          return throwError(() => error);
        })
      );
  }
}
