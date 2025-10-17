import { Injectable, inject } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { catchError, switchMap } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { AuthService } from '../services/auth/auth.service';
import { TokenService } from '../services/auth/token.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  private readonly authService = inject(AuthService);
  private readonly tokenService = inject(TokenService);


  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = localStorage.getItem('jwtToken');

    if (!token) {
      return next.handle(req);
    }

    if (req.url.includes('/auth/refresh-token')) {
      return next.handle(req);
    }

    if (this.tokenService.isTokenExpiringSoon(token)) {
      return this.tokenService.refreshToken().pipe(
        switchMap(newToken => {
          localStorage.setItem('jwtToken', newToken.token);
          const cloned = req.clone({
            headers: req.headers.set('Authorization', `Bearer ${newToken.token}`)
          });
          return next.handle(cloned);
        }),
        catchError(err => {
          this.authService.failedLogin();
          return throwError(() => err);
        })
      );
    } else {
      const cloned = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });

      return next.handle(cloned).pipe(
        catchError(err => {
          if (err.status === 401) {
            this.authService.failedLogin();
          }
          return throwError(() => err);
        })
      );
    }
  }
}
