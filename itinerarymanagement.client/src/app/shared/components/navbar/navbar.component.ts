import { Component, OnInit, inject } from '@angular/core';
import { AuthService } from '../../../core/services/auth/auth.service';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { UserJson } from '../../../models/user/user';
import { MatToolbar, MatToolbarRow } from '@angular/material/toolbar';
import { MatIconButton, MatButton } from '@angular/material/button';
import { ExtendedModule } from '@angular/flex-layout/extended';
import { MatIcon } from '@angular/material/icon';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { MatDivider } from '@angular/material/divider';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
    selector: 'app-navbar',
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.css'],
    standalone: true,
    imports: [MatToolbar, MatToolbarRow, RouterLink, MatIconButton, ExtendedModule, MatIcon, MatButton, MatMenuTrigger, MatMenu, MatDivider, MatMenuItem, RouterOutlet, TranslatePipe]
})
export class NavbarComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);

  userName = "Přihlášení";
  userProfileImage?: string;
  isLoggedIn = false;
  sidenavOpen = false;

  ngOnInit(): void {
    this.authService.loggedIn$.subscribe((loggedIn) => {
      this.isLoggedIn = loggedIn;
    });

    this.userService.user$.subscribe((user: UserJson | null) => {
      if (user) {
        this.userName = `${user.firstName} ${user.lastName}`;
        this.userProfileImage = user.profileImageUrl;
      } else {
        this.userName = "Přihlášení";
        this.isLoggedIn = false;
        this.userProfileImage = undefined;
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(["/"]);
  }

  toggleSidenav() {
    this.sidenavOpen = !this.sidenavOpen;
  }

  closeSidenav() {
    this.sidenavOpen = false;
  }
}
