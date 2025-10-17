export const environment = {
  // Set to 'true' in environment.prod.ts for production build
  production: false,

  // Base URL for your API.
  // Use '/api' for development with proxy or the full URL (e.g., 'https://yourapp.azurewebsites.net/api').
  apiUrl: '/api',

  // Mapbox public key. Replace with your own key.
  mapboxKey: 'YOUR_MAPBOX_KEY_HERE',

  // Sentry DSN for error tracking. Replace with your own DSN.
  sentryDsn: 'YOUR_SENTRY_DSN_HERE'
};

// Instructions:
// 1. Copy this file to 'environment.ts' for local development.
// 2. Copy this file to 'environment.prod.ts' for production, and set `production: true`.
// 3. Never commit your real keys to GitHub.
