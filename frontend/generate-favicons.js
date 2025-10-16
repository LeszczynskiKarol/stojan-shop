// generate-favicons.js
// Skrypt do generowania favicon z logo
const sharp = require("sharp");
const fs = require("fs").promises;
const path = require("path");

const sizes = [
  { name: "favicon-16x16.png", size: 16 },
  { name: "favicon-32x32.png", size: 32 },
  { name: "apple-touch-icon.png", size: 180 },
  { name: "android-chrome-192x192.png", size: 192 },
  { name: "android-chrome-512x512.png", size: 512 },
];

async function generateFavicons() {
  const publicDir = path.join(__dirname, "public");
  const logoPath = path.join(publicDir, "favicon.png");

  try {
    console.log("🎨 Generowanie favicon...");

    // Sprawdź czy logo istnieje
    await fs.access(logoPath);

    // Generuj różne rozmiary
    for (const { name, size } of sizes) {
      const outputPath = path.join(publicDir, name);
      await sharp(logoPath)
        .resize(size, size, {
          fit: "contain",
          background: { r: 255, g: 255, b: 255, alpha: 0 },
        })
        .png()
        .toFile(outputPath);
      console.log(`✅ Utworzono: ${name}`);
    }

    // Generuj favicon.ico z rozmiaru 32x32
    const favicon32Path = path.join(publicDir, "favicon-32x32.png");
    const faviconPath = path.join(publicDir, "favicon.ico");

    await sharp(favicon32Path).resize(32, 32).toFile(faviconPath);

    console.log("✅ Utworzono: favicon.ico");

    console.log("\n✨ Wszystkie favicons zostały wygenerowane!");
    console.log("📝 Teraz zaktualizuj metadata w src/app/layout.tsx");
  } catch (error) {
    console.error("❌ Błąd:", error.message);
    console.log("\n💡 Upewnij się że:");
    console.log("   1. Masz zainstalowany sharp: npm install sharp --save-dev");
    console.log("   2. Plik favicon.png istnieje w folderze public");
  }
}

generateFavicons();
