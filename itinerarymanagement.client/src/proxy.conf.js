const { env } = require('process');

const target = env.ASPNETCORE_HTTPS_PORT ? `https://localhost:${env.ASPNETCORE_HTTPS_PORT}` :
  env.ASPNETCORE_URLS ? env.ASPNETCORE_URLS.split(';')[0] : 'https://localhost:7083';


const PROXY_CONFIG = [
  {
    context: [
      "/api/auth/login",
      "/api/auth/register",

      "/api/token/refresh-token",
      "/api/token/verify-token",

      "/api/user/change-password",
      "/api/user/create-password",
      "/api/user/update-user",
      "/api/user/request-password-reset",
      "/api/user/get-user",
      "/api/user/update-profile-image",

      "/api/dashboard/get-projects",
      "/api/dashboard/get-project/*",
      "/api/dashboard/remove-project",
      "/api/dashboard/update-project",
      "/api/dashboard/add-project",
      "/api/dashboard/update-project-image/*",

      "/api/dashboard/project/*/get-places",
      "/api/dashboard/project/*/transport-segments",
      "/api/dashboard/project/generate",
      "/api/dashboard/project/get-places-in-bounds-ai",
      "/api/dashboard/project/*/get-tags",
      "/api/dashboard/project/*/remove-place/*",
      "/api/dashboard/project/*/add-place",
      "/api/dashboard/project/*/update-place",
      "/api/dashboard/project/*/get-itinerary",
      "/api/dashboard/project/*/update-place-picture/*/*",
      "/api/dashboard/project/*/remove-place/*/day/*",
      "/api/dashboard/project/*/add-place/*/day/*",
      "/api/dashboard/project/*/add-places/day/*",
      "/api/dashboard/project/*/update-place-orders/day/*",
      "/api/dashboard/project/*/get-best-path/*",
      "/api/dashboard/project/*/update-day-times/*",
      "/api/dashboard/project/thumbnail/*",
      "/api/dashboard/project/thumbnail/popup/image-thumbnail",

      "/api/overpass/overpass-data",
      "/api/overpass/wikidata-image",
      "/api/overpass/wikipedia-data-single",

      "/api/route/get-route",
      "/api/route/calculate-distance-matrix",

      "/error",

    ],
    target,
    secure: false
  }
]

module.exports = PROXY_CONFIG;
