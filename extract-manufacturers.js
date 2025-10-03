// extract-manufacturers.js

const fs = require("fs");

// Wczytaj JSON z silnikami
const silnikiData = JSON.parse(
  fs.readFileSync("./kategoria_silniki_parametry.json", "utf8")
);

// Znajdź parametr "Marka" (id: 248811)
const markaParam = silnikiData.parameters.find((p) => p.id === "248811");

if (!markaParam) {
  console.error("Nie znaleziono parametru Marka!");
  process.exit(1);
}

// Konwertuj dictionary na TypeScript Record
const manufacturers = {};
markaParam.dictionary.forEach((item) => {
  manufacturers[item.value] = item.id;
});

// Generuj kod TypeScript
const tsCode = `// Auto-generated from Allegro API
export const ALLEGRO_MANUFACTURERS: Record<string, string> = ${JSON.stringify(
  manufacturers,
  null,
  2
)};

export function getManufacturerId(manufacturerName: string): { value: string; id: string } {
  const normalized = manufacturerName.trim();
  
  // Jeśli puste - "bez marki"
  if (!normalized) {
    return { value: "bez marki", id: "248811_958954" };
  }
  
  // Szukaj w dictionary (case-insensitive)
  const found = Object.entries(ALLEGRO_MANUFACTURERS).find(
    ([key]) => key.toLowerCase() === normalized.toLowerCase()
  );
  
  if (found) {
    return { value: found[0], id: found[1] };
  }
  
  // Nie znaleziono - domyślnie "bez marki"
  return { value: "bez marki", id: "248811_958954" };
}
`;

// Zapisz do pliku
fs.writeFileSync("./frontend/src/utils/allegroManufacturers.ts", tsCode);

console.log("✅ Wygenerowano plik: frontend/src/utils/allegroManufacturers.ts");
console.log(`📊 Znaleziono ${Object.keys(manufacturers).length} producentów`);
