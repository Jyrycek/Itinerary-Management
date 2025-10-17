import { Injectable, inject } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class ProjectIdGuard implements CanActivate {
  private readonly router = inject(Router);

  canActivate(
    route: ActivatedRouteSnapshot): boolean {
    const projectId = route.paramMap.get('id');

    if (projectId) return true;

    this.router.navigate(['/dashboard']);
    return false;
  }
}
