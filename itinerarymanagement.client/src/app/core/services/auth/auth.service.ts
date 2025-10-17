import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { User } from '../../../models/user/user';
import { tap, catchError } from 'rxjs/operators';
import { Router } from "@angular/router";
import { environment } from '../../../../environments/environment';
import { TokenService } from './token.service';
import { UserService } from '../user.service';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl: string = environment.apiUrl + '';

  private readonly tokenService = inject(TokenService);
  private readonly userService = inject(UserService);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  public loggedInSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(this.tokenService.getToken() !== null);
  public loggedIn$: Observable<boolean> = this.loggedInSubject.asObservable();

  get isLoggedIn(): boolean {
    return this.loggedInSubject.value;
  }

  public failedLogin(): void {
    this.loggedInSubject.next(false);
    this.tokenService.removeToken();
    this.router.navigate(['/login']);
  }

  public successfullyLoggedIn(token: string): void {
    this.tokenService.setToken(token);
    this.loggedInSubject.next(true);

    this.userService.requestUser().subscribe(user => {
      this.userService.updateUserProfile(user);
    });
  }

  public logout(): void {
    this.tokenService.removeToken();
    this.loggedInSubject.next(false);
    this.userService.updateUserProfile(null);
  }

  public autoLogin() {
    const token = localStorage.getItem('jwtToken');

    if (!token) return;

    this.http.post<any>(`${this.apiUrl}/token/verify-token`, { token }).subscribe({
      next: (response) => {
        if (!response.isvalid) {
          this.failedLogin();
        } else {
          this.tokenService.refreshToken().subscribe({
            next: (newToken) => {
              if (newToken) {
                this.successfullyLoggedIn(newToken.token);
              } else {
                this.failedLogin();
              }
            },
            error: () => {
              this.failedLogin();
            }
          });
        }
      },
      error: () => {
        this.failedLogin();
      }
    });

  }

  public login(username: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/login`, { username, password })
      .pipe(
        tap(response => {
          this.successfullyLoggedIn(response.token);
        }),
        catchError((error) => {
          return throwError(() => error);
        })
      );
  }

  public register(user: User): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/register`, user)
      .pipe(
        catchError((error) => {
          return throwError(() => error);
        })
      );
  }
}
