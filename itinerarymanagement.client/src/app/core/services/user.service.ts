import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, catchError, map, tap, throwError } from 'rxjs';
import { UserJson } from '../../models/user/user';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly apiUrl: string = environment.apiUrl + '/user';

  private readonly http = inject(HttpClient);

  private userSubject: BehaviorSubject<UserJson | null> = new BehaviorSubject<UserJson | null>(null);

  public user$: Observable<UserJson | null> = this.userSubject.asObservable();

  public requestUser(): Observable<UserJson> {
    return this.http.get<UserJson>(`${this.apiUrl}/get-user`)
      .pipe(
        tap(user => this.userSubject.next(user))
      );
  }

  public requestUsername(): Observable<string> {
    return this.requestUser()
      .pipe(
        tap(user => console.log('Username response:', user)),
        map(user => user.username)
      );
  }

  public updateUserProfile(user: UserJson | null): void {
    this.userSubject.next(user);
  }

  public getUserProfile(): Observable<UserJson | null> {
    return this.userSubject.asObservable();
  }

  public updateUser(user: UserJson): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/update-user`, user)
      .pipe(
        catchError(error => {
          console.error('Error saving user changes:', error);
          return throwError(() => error);
        })
      );
  }

  public changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/change-password`, { currentPassword, newPassword })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          const errorMessage = error.error?.message;
          console.error('Error changing password:', errorMessage);
          return throwError(() => error);
        })
      );
  }

  public requestPasswordReset(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/request-password-reset`, { email })
      .pipe(
        catchError((error) => {
          return throwError(() => error);
        })
      );
  }

  public resetPassword(token: string, email: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/create-password`, { token, email, newPassword })
      .pipe(
        catchError((error) => {
          return throwError(() => error);
        })
      );
  }

  public uploadUserProfileImage(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<any>(`${this.apiUrl}/update-profile-image`, formData)
      .pipe(
        catchError(error => {
          console.error('Error uploading profile image:', error);
          return throwError(() => error);
        })
      );
  }
}
