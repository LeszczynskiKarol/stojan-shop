// backend/src/types/consent.ts
export type ConsentType = 'granted' | 'denied';

export interface ConsentSettings {
  ad_storage: ConsentType;
  ad_user_data: ConsentType;
  ad_personalization: ConsentType;
  analytics_storage: ConsentType;
  clarity_storage: ConsentType;
}
