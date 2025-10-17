import { Component, OnInit, inject } from '@angular/core';
import { AuthService } from './core/services/auth/auth.service';
import { TranslateService } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component'

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrl: './app.component.css',
    standalone: true,
    imports: [RouterModule, NavbarComponent]
})
export class AppComponent implements OnInit {

  private readonly authService = inject(AuthService);
  private readonly translateService = inject(TranslateService);

  constructor() {
    this.translateService.setDefaultLang('cs');

    const browserLang = navigator.language.split('-')[0];
    const langToUse = ['cs', 'sk'].includes(browserLang) ? 'cs' : 'en';
    this.translateService.use(langToUse);
  }

  ngOnInit() {
    this.authService.autoLogin();
  }
}
