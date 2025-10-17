#!/bin/bash
# install-favicon.sh
# Kompletny skrypt instalacji favicon

echo "🎨 Instalacja Favicon dla Sklep Stojan"
echo "========================================"

# Krok 1: Przejdź do katalogu frontend
cd /home/ec2-user/frontend

# Krok 2: Zainstaluj sharp (jeśli nie masz)
echo "📦 Instalacja sharp..."
npm install sharp --save-dev

# Krok 3: Skopiuj skrypt generowania favicon
echo "📝 Tworzenie skryptu generowania favicon..."
cat > generate-favicons.js << 'EOF'
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

const sizes = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'android-chrome-192x192.png', size: 192 },
  { name: 'android-chrome-512x512.png', size: 512 },
];

async function generateFavicons() {
  const publicDir = path.join(__dirname, 'public');
  const logoPath = path.join(publicDir, 'logo_dark.png');

  try {
    console.log('🎨 Generowanie favicon...');
    await fs.access(logoPath);

    for (const { name, size } of sizes) {
      const outputPath = path.join(publicDir, name);
      await sharp(logoPath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(outputPath);
      console.log(`✅ Utworzono: ${name}`);
    }

    const favicon32Path = path.join(publicDir, 'favicon-32x32.png');
    const faviconPath = path.join(publicDir, 'favicon.ico');
    
    await sharp(favicon32Path)
      .resize(32, 32)
      .toFile(faviconPath);
    
    console.log('✅ Utworzono: favicon.ico');
    console.log('\n✨ Wszystkie favicons zostały wygenerowane!');
  } catch (error) {
    console.error('❌ Błąd:', error.message);
  }
}

generateFavicons();
EOF

# Krok 4: Uruchom generowanie favicon
echo "🚀 Generowanie favicon..."
node generate-favicons.js

# Krok 5: Stwórz site.webmanifest
echo "📄 Tworzenie site.webmanifest..."
cat > public/site.webmanifest << 'EOF'
{
  "name": "Silniki Elektryczne - Sklep Stojan",
  "short_name": "Stojan",
  "description": "Sklep internetowy ze silnikami elektrycznymi",
  "icons": [
    {
      "src": "/android-chrome-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/android-chrome-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "theme_color": "#ffffff",
  "background_color": "#ffffff",
  "display": "standalone",
  "start_url": "/",
  "scope": "/"
}
EOF

# Krok 6: Stwórz browserconfig.xml
echo "📄 Tworzenie browserconfig.xml..."
cat > public/browserconfig.xml << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
    <msapplication>
        <tile>
            <square150x150logo src="/android-chrome-192x192.png"/>
            <TileColor>#ffffff</TileColor>
        </tile>
    </msapplication>
</browserconfig>
EOF

# Krok 7: Sprawdź czy pliki zostały utworzone
echo ""
echo "✅ Sprawdzanie utworzonych plików..."
ls -lh public/favicon* public/*.webmanifest public/*.xml 2>/dev/null || echo "⚠️  Niektóre pliki mogą nie istnieć"

echo ""
echo "🎉 Instalacja zakończona!"
echo ""
echo "📋 NASTĘPNE KROKI:"
echo "1. Zaktualizuj src/app/layout.tsx (użyj pliku layout.tsx)"
echo "2. Zaktualizuj src/middleware.ts (użyj pliku middleware.ts)"
echo "3. Zbuduj projekt: npm run build"
echo "4. Zrestartuj aplikację: pm2 restart frontend"
echo "5. Wyczyść cache przeglądarki (Ctrl+Shift+R)"
echo ""
echo "🔍 Weryfikacja:"
echo "   - Sprawdź: https://www.silniki-elektryczne.com.pl/favicon.ico"
echo "   - Google Search Console: Request indexing"
echo ""