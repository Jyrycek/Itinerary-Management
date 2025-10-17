import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { Router } from '@angular/router';
import { ErrorHandler } from '@angular/core';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import * as Sentry from '@sentry/angular';

export const TRANSLATE_CONFIG = {
  defaultLanguage: 'cs',
  loader: provideTranslateHttpLoader({ prefix: './assets/i18n/', suffix: '.json' })
};

export function jwtOptionsFactory() {
  return {
    tokenGetter: () => localStorage.getItem('jwtToken'),
    disallowedRoutes: []
  };
}


export const SENTRY_PROVIDERS = [
  { provide: ErrorHandler, useValue: Sentry.createErrorHandler({ showDialog: true }) },
  { provide: Sentry.TraceService, deps: [Router] }
];

export const MAT_PROVIDERS = [
  { provide: MAT_DATE_LOCALE, useValue: 'cs-CZ' }
];
