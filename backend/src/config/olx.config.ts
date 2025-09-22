// backend/src/config/olx.config.ts
export const olxConfig = {
  clientId: '202469',
  clientSecret: process.env.OLX_CLIENT_SECRET || '',
  apiUrl: 'https://www.olx.pl/api/partner',
  apiOpenUrl: 'https://www.olx.pl/api/open',
  authUrl: 'https://www.olx.pl/oauth',
  redirectUri: 'https://server-reactapp.ngrok.app/api/olx/auth/callback', // BACKEND!
  scope: 'v2 read write',
} as const;

// Prawdopodobne kategorie OLX (musimy zweryfikować przez API)
export const OLX_CATEGORIES = {
  MASZYNY_BUDOWLANE: 628, // Oferty pracy > Praca fizyczna
  PRZEMYSL_PRODUKCJA: 4, // Biznes i Przemysł
  MASZYNY: 4288, // Maszyny
  // Dokładne ID musimy pobrać z API categories
} as const;

export const OLX_DEFAULTS = {
  PUBLISHING_TIME: 30,
  PHOTOS_LIMIT: 8,
  TITLE_MIN_LENGTH: 16,
  TITLE_MAX_LENGTH: 70,
  DESCRIPTION_MIN_LENGTH: 80,
  DESCRIPTION_MAX_LENGTH: 9000,
  CITY_ID: '5659',
  LOCATION: {
    latitude: 52.406374,
    longitude: 16.925168,
  },
};
