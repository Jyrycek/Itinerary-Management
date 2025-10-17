import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private readonly apiUrl: string = environment.apiUrl + '/token';
  private readonly tokenKey: string = 'jwtToken';

  private readonly http = inject(HttpClient);

  public getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  public setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  public hasToken(): boolean {
    return !localStorage.getItem('jwtToken');
  }

  public removeToken(): void {
    localStorage.removeItem(this.tokenKey);
  }

  private base64UrlDecode(input: string): string {
    input = input.replace(/-/g, "+").replace(/_/g, "/");

    while (input.length % 4 !== 0) {
      input += "=";
    }

    return atob(input);
  }

  public isTokenExpiringSoon(token: string): boolean {
    try {
      const payload = this.base64UrlDecode(token.split('.')[1]);
      const jwtToken = JSON.parse(payload);
      const exp = jwtToken.exp;
      const currentTime = Math.floor(Date.now() / 1000);
      const tenMinutesInSeconds = 10 * 60;
      return (exp - currentTime) < tenMinutesInSeconds && exp > currentTime;
    } catch {
      return true;
    }
  }


  public refreshToken(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/refresh-token`, {})
      .pipe(
        tap(response => {
          this.setToken(response.token);
        }),
        catchError(error => {
          console.error('Error refreshing token:', error);
          return throwError(() => error);
        })
      );
  }
}
