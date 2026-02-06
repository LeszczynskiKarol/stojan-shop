// frontend/src/components/Metadata.tsx
import Head from 'next/head';

interface MetadataProps {
  title?: string;
  description?: string;
  keywords?: string[];
}

export const Metadata = ({ title, description, keywords }: MetadataProps) => {
  const defaultTitle =
    'Silniki elektryczne i motoreduktory - oferta, hurtownia, sprzedaż, sklep. Zamów teraz';
  const defaultDescription =
    'Szeroki wybór silników elektrycznych i motoreduktorów w atrakcyjnych cenach';

  return (
    <Head>
      <title>{title || defaultTitle}</title>
      <meta name="description" content={description || defaultDescription} />
      {keywords && keywords.length > 0 && <meta name="keywords" content={keywords.join(', ')} />}
      <meta property="og:title" content={title || defaultTitle} />
      <meta property="og:description" content={description || defaultDescription} />
      <meta name="twitter:title" content={title || defaultTitle} />
      <meta name="twitter:description" content={description || defaultDescription} />
    </Head>
  );
};
