// backend/src/utils/geo-location.ts
import geoip from 'geoip-lite';

export const getGeoLocation = async (ip: string) => {
  try {
    const geo = geoip.lookup(ip);
    return {
      country: geo?.country || null,
      city: geo?.city || null,
      region: geo?.region || null,
    };
  } catch (error) {
    console.error('Błąd geolokalizacji:', error);
    return {
      country: null,
      city: null,
      region: null,
    };
  }
};
