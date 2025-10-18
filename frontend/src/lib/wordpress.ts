// frontend/src/lib/wordpress.ts

/**
 * Czyści WordPress content z komentarzy Gutenberg
 */
export function cleanWordPressContent(content: string): string {
  if (!content) return "";

  // Usuń komentarze WordPress Gutenberg (<!-- wp:... -->)
  let cleaned = content.replace(/<!-- \/wp:[^>]+ -->/g, "");
  cleaned = cleaned.replace(/<!-- wp:[^>]+ -->/g, "");

  // Usuń puste paragrafy
  cleaned = cleaned.replace(/<p>\s*<\/p>/g, "");

  // Usuń nadmiarowe białe znaki
  cleaned = cleaned.replace(/\n\s*\n\s*\n/g, "\n\n");

  // Zamień klasy WordPress na Tailwind (opcjonalne)
  cleaned = cleaned.replace(/class="wp-block-heading"/g, "");
  cleaned = cleaned.replace(/class="wp-block-paragraph"/g, "");
  cleaned = cleaned.replace(/class="wp-block-list"/g, "");
  cleaned = cleaned.replace(/class="wp-block-image"/g, "");

  return cleaned.trim();
}

/**
 * Dodaje klasy Tailwind do WordPress content
 */
export function enhanceWordPressContent(content: string): string {
  if (!content) return "";

  let enhanced = content;

  // Dodaj klasy do nagłówków
  enhanced = enhanced.replace(
    /<h2([^>]*)>/g,
    '<h2$1 class="text-3xl font-bold mt-12 mb-6">'
  );
  enhanced = enhanced.replace(
    /<h3([^>]*)>/g,
    '<h3$1 class="text-2xl font-semibold mt-8 mb-4">'
  );

  // Dodaj klasy do paragrafów
  enhanced = enhanced.replace(/<p>/g, '<p class="mb-6 leading-relaxed">');

  // Dodaj klasy do list
  enhanced = enhanced.replace(
    /<ul>/g,
    '<ul class="list-disc pl-6 my-6 space-y-2">'
  );
  enhanced = enhanced.replace(
    /<ol>/g,
    '<ol class="list-decimal pl-6 my-6 space-y-2">'
  );

  // Dodaj klasy do linków
  enhanced = enhanced.replace(
    /<a /g,
    '<a class="text-primary hover:underline" '
  );

  // Dodaj klasy do obrazków
  enhanced = enhanced.replace(
    /<img /g,
    '<img class="rounded-lg my-8 shadow-lg" '
  );

  return enhanced;
}

/**
 * Kompletne przetworzenie WordPress content
 */
export function processWordPressContent(content: string): string {
  const cleaned = cleanWordPressContent(content);
  const enhanced = enhanceWordPressContent(cleaned);
  return enhanced;
}
