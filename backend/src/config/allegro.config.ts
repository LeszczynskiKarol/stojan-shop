// backend/src/config/allegro.config.ts
const redirectUri = process.env.ALLEGRO_REDIRECT_URI;
if (!redirectUri) {
  throw new Error('Brak wymaganej zmiennej środowiskowej ALLEGRO_REDIRECT_URI');
}

export const allegroConfig = {
  clientId: process.env.ALLEGRO_CLIENT_ID as string,
  clientSecret: process.env.ALLEGRO_CLIENT_SECRET as string,
  sellerId: process.env.ALLEGRO_SELLER_ID as string,
  apiUrl: 'https://api.allegro.pl',
  authUrl: 'https://allegro.pl/auth/oauth',
  redirectUri: redirectUri,
} as const;

// Sprawdzenie konfiguracji
if (
  !allegroConfig.clientId ||
  !allegroConfig.clientSecret ||
  !allegroConfig.redirectUri
) {
  console.error('Brakujące zmienne środowiskowe:', {
    clientId: !!allegroConfig.clientId,
    clientSecret: !!allegroConfig.clientSecret,
    redirectUri: !!allegroConfig.redirectUri,
  });
  throw new Error('Brak wymaganych zmiennych środowiskowych dla Allegro');
}
