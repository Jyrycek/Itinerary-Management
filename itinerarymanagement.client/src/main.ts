import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { AppComponent } from './app/app.component';
import { AppRoutingModule } from './app/app-routing.module';
import { RouterModule } from '@angular/router';
import { JwtModule, JWT_OPTIONS } from '@auth0/angular-jwt';
import { TranslateModule } from '@ngx-translate/core';
import { SENTRY_PROVIDERS, MAT_PROVIDERS, jwtOptionsFactory, TRANSLATE_CONFIG } from './app/config/app.config';
import { provideAnimations } from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';
import { environment } from './environments/environment';
import * as Sentry from '@sentry/angular';

Sentry.init({
  dsn: environment.sentryDsn,
  integrations: [
    Sentry.browserTracingIntegration(),
  ],
  tracePropagationTargets: ["localhost", /^https:\/\/localhost:4200\/api/],
  tracesSampleRate: 1.0,            // 100% trace sampling for dev, reduce in prod
  replaysSessionSampleRate: 1.0,    // 10% session replay
  replaysOnErrorSampleRate: 1.0,    // replay session when error occurs
});

(async () => {
  try {
    await bootstrapApplication(AppComponent, {
  providers: [
    ...SENTRY_PROVIDERS,
    ...MAT_PROVIDERS,
    provideHttpClient(withInterceptorsFromDi()),
    provideAnimations(),
    importProvidersFrom(
      RouterModule,
      AppRoutingModule,
      JwtModule.forRoot({
        jwtOptionsProvider: {
          provide: JWT_OPTIONS,
          useFactory: jwtOptionsFactory,
          deps: []
        }
      }),
      TranslateModule.forRoot(TRANSLATE_CONFIG),
      ToastrModule.forRoot({ preventDuplicates: false }),
    )
  ]
})
} catch (err) {
  console.error('Bootstrap failed:', err);
}
}) ();
