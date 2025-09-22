// backend/src/config/allegro.constants.ts

type ParameterKey =
  | 'MOC'
  | 'OBROTY'
  | 'NAPIECIE'
  | 'WAGA'
  | 'SREDNICA_WALU'
  | 'MODEL'
  | 'TYP_SILNIKA'
  | 'PRODUCENT'
  | 'MOC_ZNAMIONOWA'
  | 'RODZAJ';

type ParameterMapping = {
  [key in ParameterKey]?: {
    id: string;
    name: string;
  };
};

export const ALLEGRO_CATEGORIES = {
  SILNIKI: '121456',
  MOTOREDUKTORY: '121452',
};

export const ALLEGRO_PARAMETERS = {
  // Wspólne parametry
  CONDITION: {
    ID: '11323',
    VALUES: {
      NEW: '11323_1',
      USED: '11323_2',
    },
  },

  // Parametry dla silników (kategoria 121456)
  SILNIKI: {
    MOC: '219137',
    OBROTY: '219153',
    NAPIECIE: '219165',
    WAGA: '214478',
    SREDNICA_WALU: '219149',
    MODEL: '237206',
    TYP_SILNIKA: '219145',
    PRODUCENT: '248929',
  },

  // Parametry dla motoreduktorów (kategoria 121452)
  MOTOREDUKTORY: {
    MOC_ZNAMIONOWA: { id: '11726', name: 'Moc znamionowa' },
    OBROTY: { id: '221421', name: 'Prędkość obrotowa' },
    WAGA: { id: '214694', name: 'Waga' },
    SREDNICA_WALU: { id: '219149', name: 'Średnica wału' },
    MODEL: { id: '237206', name: 'Model' },
    RODZAJ: { id: '18654', name: 'Rodzaj motoreduktora' }, // ZMIANA ID!
    PRODUCENT: { id: '248929', name: 'Producent' },
  },
};

export const ALLEGRO_DEFAULTS = {
  CATEGORY_ID: '121456',
  HANDLING_TIME: 'PT24H',
  SHIPPING_RATE_ID: '4.0 200-400kg',
};

export const ALLEGRO_PARAMETERS_MAPPING: {
  SILNIKI: ParameterMapping;
  MOTOREDUKTORY: ParameterMapping;
} = {
  SILNIKI: {
    MOC: { id: '219137', name: 'Moc' },
    OBROTY: { id: '219153', name: 'Obroty' },
    NAPIECIE: { id: '219165', name: 'Napięcie (V)' },
    WAGA: { id: '214478', name: 'Waga' },
    SREDNICA_WALU: { id: '219149', name: 'Średnica wału' },
    MODEL: { id: '237206', name: 'Model' },
    TYP_SILNIKA: { id: '219145', name: 'Typ silnika' },
    PRODUCENT: { id: '248929', name: 'Producent' },
  },
  MOTOREDUKTORY: {
    MOC_ZNAMIONOWA: { id: '11726', name: 'Moc znamionowa' },
    OBROTY: { id: '221421', name: 'Prędkość obrotowa' }, // ZMIANA ID!
    WAGA: { id: '214694', name: 'Waga' },
    SREDNICA_WALU: { id: '219149', name: 'Średnica wału' },
    MODEL: { id: '237206', name: 'Model' },
    RODZAJ: { id: '18654', name: 'Rodzaj motoreduktora' }, // ZMIANA ID!
    PRODUCENT: { id: '248929', name: 'Producent' },
  },
};

export const PARAMETRY_WSPOLNE = {
  CONDITION: {
    ID: '11323',
    VALUES: {
      NEW: '11323_1',
      USED: '11323_2',
    },
  },
};

export const SILNIKI_PARAMETRY = {
  ENGINE_TYPE: {
    ID: '219145',
    VALUES: {
      ELECTRIC: '219145_1',
    },
  },
  MOC: '219137',
  OBROTY: '219153',
  NAPIECIE: '219165',
  WAGA: '214478',
  SREDNICA_WALU: '219149',
  MODEL: '237206',
  PRODUCENT: '248929',
};

export const MOTOREDUKTORY_PARAMETRY = {
  MOC_ZNAMIONOWA: '11726',
  OBROTY: '219153',
  WAGA: '214478',
  SREDNICA_WALU: '219149',
  MODEL: '237206',
  RODZAJ: '249056',
  PRODUCENT: '248929',
};
