import { Injectable, inject } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { Observable, catchError, of, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { OverpassRequest } from '../../../models/overpass/overpass-request';

@Injectable({
  providedIn: 'root'
})
export class OverpassApiService {
  private readonly apiUrl: string = environment.apiUrl + '/overpass';
  private readonly http = inject(HttpClient);

  getOverpassData(request: OverpassRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/overpass-data`, request)
      .pipe(
        catchError(error => {
          console.error('Error querying Overpass API:', error);
          return throwError(() => error);
        })
      );
  }
  
  getWikipediaDataTest(element: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/wikipedia-data-single`, element)
      .pipe(
        catchError(error => {
          console.error('Error querying Wikipedia data for a single element:', error);
          return throwError(() => error);
        })
      );
  }
  getWikidataImage(element: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/wikidata-image`, element).pipe(
      catchError(error => {
        if (error.status === 500) {
          console.error('Chyba serveru při dotazu na Wikidata:', error);
        }
        return of(null); 
      })
    );
  }
}
