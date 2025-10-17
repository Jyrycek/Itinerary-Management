import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import { UserService } from '../services/user.service';

export const AuthGuard = () => {
  const router = inject(Router);
  const jwtHelper = inject(JwtHelperService);
  const userService = inject(UserService);

  const token = localStorage.getItem("jwtToken");

  if (token && !jwtHelper.isTokenExpired(token)) {
    return true;
  }

  localStorage.removeItem('jwtToken');
  userService.updateUserProfile(null);
  router.navigate(['/login']);
  return false;
};
