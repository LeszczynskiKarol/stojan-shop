// backend/src/utils/allegroHelpers.ts
export interface AllegroDescription {
  srednicaTulei: string | null;
  srednicaWalu: string | null;
  wielkoscMechaniczna: string | null;
  waga: string | null;
  napiecie: string | null;
  rozruch: string | null;
}

export const parseAllegroDescription = (
  description: any
): AllegroDescription => {
  if (!description)
    return {
      srednicaTulei: null,
      srednicaWalu: null,
      wielkoscMechaniczna: null,
      waga: null,
      napiecie: null,
      rozruch: null,
    };

  // Pobierz treść opisu
  const content =
    typeof description === 'string'
      ? description
      : description.sections?.[0]?.items?.[0]?.content || '';

  // Usuń tagi HTML i zbędne białe znaki
  const text = content
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Bardziej elastyczne wzorce
  const wielkoscPattern =
    /wielko[sś][cć] mechaniczna:?\s*[b<>/"]*(\d+)[b<>/"]*\s*/i;
  const wagaPattern = /waga:?\s*[b<>/"]*(\d+(?:\.\d+)?)[b<>/"]*\s*kg/i;
  const srednicaWaluPattern =
    /[sś]rednica wa[łl]u:?\s*[b<>/"]*(\d+)[b<>/"]*\s*mm/i;
  const srednicaTuleiPattern =
    /[sś]rednica tulei:?\s*[b<>/"]*(\d+)[b<>/"]*\s*mm/i;
  const napieciePattern = /(\d+(?:\/\d+)?)\s*V(?:Y|Δ|△)?/i;
  const rozruchPattern =
    /((?:gwiazda-tr[óo]jk[ąa]t|bezpo[sś]redni[o]?) -? ?(?:\d+\/?\d*V?(?:Y|Δ|△)?)?)/i;

  // Wyciągnij wartości używając wzorców
  const wielkoscMatch = text.match(wielkoscPattern);
  const wagaMatch = text.match(wagaPattern);
  const srednicaWaluMatch = text.match(srednicaWaluPattern);
  const srednicaTuleiMatch = text.match(srednicaTuleiPattern);
  const napiecieMatch = text.match(napieciePattern);
  const rozruchMatch = text.match(rozruchPattern);

  // Zwróć obiekt z wyciągniętymi danymi
  return {
    wielkoscMechaniczna: wielkoscMatch?.[1] || null,
    waga: wagaMatch?.[1] || null,
    srednicaWalu: srednicaWaluMatch?.[1] || null,
    srednicaTulei: srednicaTuleiMatch?.[1] || null,
    napiecie: napiecieMatch?.[1] || null,
    rozruch: rozruchMatch?.[1] || null,
  };
};
