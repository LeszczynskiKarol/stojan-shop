// frontend/src/components/layout/Footer.tsx
"use client";
import Image from "next/image";
import Link from "next/link";

interface PowerLink {
  power: string;
  href: string;
}

interface ManufacturerLink {
  name: string;
  href: string;
}

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  const powerLinks: PowerLink[] = [
    { power: "0,09 KW", href: "/silniki-elektryczne-009-kw/" },
    {
      power: "0,12 KW",
      href: "/silniki-elektryczne-012-kw/",
    },
    {
      power: "0,18 KW",
      href: "/silniki-elektryczne-018-kw/",
    },
    {
      power: "0,25 KW",
      href: "/silniki-elektryczne-025-kw/",
    },
    {
      power: "0,37 KW",
      href: "/silniki-elektryczne-037-kw/",
    },
    {
      power: "0,55 KW",
      href: "/silniki-elektryczne-055-kw/",
    },
    {
      power: "0,75 KW",
      href: "/silniki-elektryczne-075-kw/",
    },
    { power: "1,1 KW", href: "/silniki-elektryczne-1-1-kw/" },
    { power: "1,5 KW", href: "/silniki-elektryczne-1-5-kw/" },
    { power: "2,2 KW", href: "/silniki-elektryczne-2-2-kw/" },
    { power: "3 KW", href: "/silniki-elektryczne-3-kw/" },
    { power: "4 KW", href: "/silniki-elektryczne-4-kw/" },
    { power: "5,5 KW", href: "/silniki-elektryczne-5-5-kw/" },
    { power: "7,5 KW", href: "/silniki-elektryczne-7-5-kw/" },
    { power: "11 KW", href: "/silniki-elektryczne-11-kw/" },
    { power: "18,5 KW", href: "/silniki-elektryczne-18-5-kw/" },
    { power: "22 KW", href: "/silniki-elektryczne-22-kw/" },
    { power: "30 KW", href: "/silniki-elektryczne-30-kw/" },
    { power: "55 KW", href: "/silniki-elektryczne-55-kw/" },
    { power: "75 KW", href: "/silniki-elektryczne-75-kw/" },
    { power: "110 KW", href: "/silniki-elektryczne-110-kw/" },
    { power: "160 KW", href: "/silniki-elektryczne-160-kw/" },
    { power: "200 KW", href: "/silniki-elektryczne-200-kw/" },
  ];

  const manufacturerLinks: ManufacturerLink[] = [
    { name: "OMEC Motors", href: "/marka-producent/omec-motors" },
    { name: "SEW Eurodrive", href: "/marka-producent/sew-eurodrive" },
    { name: "Besel", href: "/marka-producent/besel" },
    { name: "Tamel", href: "/marka-producent/tamel" },
    { name: "Lenze", href: "/marka-producent/lenze" },
    { name: "Nidec", href: "/marka-producent/nidec" },
    { name: "ABB", href: "/marka-producent/abb" },
    { name: "Moll Motor", href: "/marka-producent/moll-motor" },
    { name: "Cantoni Group", href: "/marka-producent/cantoni-group" },
    { name: "Indukta", href: "/marka-producent/indukta" },
    { name: "Siemens", href: "/marka-producent/siemens" },
    { name: "Celma", href: "/marka-producent/celma" },
    { name: "EMIT", href: "/marka-producent/emit" },
    { name: "NORD", href: "/marka-producent/nord" },
    { name: "Bauer Gear Motor", href: "/marka-producent/bauer-gear-motor" },
    { name: "Hoyer", href: "/marka-producent/hoyer" },
  ];

  const splitArrayIntoColumns = <T extends unknown>(
    arr: T[],
    cols: number,
  ): T[][] => {
    const result = Array.from({ length: cols }, () => [] as T[]);
    arr.forEach((item, index) => {
      result[index % cols].push(item);
    });
    return result;
  };

  const powerColumns = splitArrayIntoColumns(powerLinks, 3);
  const manufacturerColumns = splitArrayIntoColumns(manufacturerLinks, 2);

  return (
    <footer className="bg-background border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-8">
        {/* PIERWSZA SEKCJA - PEŁNA SZEROKOŚĆ - Silniki według mocy i obrotów */}
        <div className="mb-8 pb-8 border-b border-border">
          <h3 className="font-bold mb-4 text-sm">
            Popularne silniki według mocy i obrotów
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-xs text-muted-foreground">
            {/* 700 obr/min */}
            <div>
              <h4 className="font-semibold text-foreground mb-2">
                700 obr/min
              </h4>
              <div className="space-y-0.5">
                <Link
                  href="/silniki-elektryczne-075-kw-700-obr"
                  className="block hover:underline"
                >
                  0,75 kW 700 obr
                </Link>
                <Link
                  href="/silniki-elektryczne-1-1-kw-700-obr"
                  className="block hover:underline"
                >
                  1,1 kW 700 obr
                </Link>
                <Link
                  href="/silniki-elektryczne-1-5-kw-700-obr"
                  className="block hover:underline"
                >
                  1,5 kW 700 obr
                </Link>
                <Link
                  href="/silniki-elektryczne-2-2-kw-700-obr"
                  className="block hover:underline"
                >
                  2,2 kW 700 obr
                </Link>
                <Link
                  href="/silniki-elektryczne-3-kw-700-obr"
                  className="block hover:underline"
                >
                  3 kW 700 obr
                </Link>
                <Link
                  href="/silniki-elektryczne-4-kw-700-obr"
                  className="block hover:underline"
                >
                  4 kW 700 obr
                </Link>
                <Link
                  href="/silniki-elektryczne-5-5-kw-700-obr"
                  className="block hover:underline"
                >
                  5,5 kW 700 obr
                </Link>
                <Link
                  href="/silniki-elektryczne-7-5-kw-700-obr"
                  className="block hover:underline"
                >
                  7,5 kW 700 obr
                </Link>
              </div>
            </div>

            {/* 900 obr/min */}
            <div>
              <h4 className="font-semibold text-foreground mb-2">
                900 obr/min
              </h4>
              <div className="space-y-0.5">
                <Link
                  href="/silniki-elektryczne-075-kw-900-obr"
                  className="block hover:underline"
                >
                  0,75 kW 900 obr
                </Link>
                <Link
                  href="/silniki-elektryczne-1-1-kw-900-obr"
                  className="block hover:underline"
                >
                  1,1 kW 900 obr
                </Link>
                <Link
                  href="/silniki-elektryczne-1-5-kw-900-obr"
                  className="block hover:underline"
                >
                  1,5 kW 900 obr
                </Link>
                <Link
                  href="/silniki-elektryczne-2-2-kw-900-obr"
                  className="block hover:underline"
                >
                  2,2 kW 900 obr
                </Link>
                <Link
                  href="/silniki-elektryczne-3-kw-900-obr"
                  className="block hover:underline"
                >
                  3 kW 900 obr
                </Link>
                <Link
                  href="/silniki-elektryczne-4-kw-900-obr"
                  className="block hover:underline"
                >
                  4 kW 900 obr
                </Link>
                <Link
                  href="/silniki-elektryczne-5-5-kw-900-obr"
                  className="block hover:underline"
                >
                  5,5 kW 900 obr
                </Link>
                <Link
                  href="/silniki-elektryczne-7-5-kw-900-obr"
                  className="block hover:underline"
                >
                  7,5 kW 900 obr
                </Link>
              </div>
            </div>

            {/* 1400 obr/min */}
            <div>
              <h4 className="font-semibold text-foreground mb-2">
                1400 obr/min
              </h4>
              <div className="space-y-0.5">
                <Link
                  href="/silniki-elektryczne-075-kw-1400-obr"
                  className="block hover:underline"
                >
                  0,75 kW 1400 obr
                </Link>
                <Link
                  href="/silniki-elektryczne-1-1-kw-1400-obr"
                  className="block hover:underline"
                >
                  1,1 kW 1400 obr
                </Link>
                <Link
                  href="/silniki-elektryczne-1-5-kw-1400-obr"
                  className="block hover:underline"
                >
                  1,5 kW 1400 obr
                </Link>
                <Link
                  href="/silniki-elektryczne-2-2-kw-1400-obr"
                  className="block hover:underline"
                >
                  2,2 kW 1400 obr
                </Link>
                <Link
                  href="/silniki-elektryczne-3-kw-1400-obr"
                  className="block hover:underline"
                >
                  3 kW 1400 obr
                </Link>
                <Link
                  href="/silniki-elektryczne-4-kw-1400-obr"
                  className="block hover:underline"
                >
                  4 kW 1400 obr
                </Link>
                <Link
                  href="/silniki-elektryczne-5-5-kw-1400-obr"
                  className="block hover:underline"
                >
                  5,5 kW 1400 obr
                </Link>
                <Link
                  href="/silniki-elektryczne-7-5-kw-1400-obr"
                  className="block hover:underline"
                >
                  7,5 kW 1400 obr
                </Link>
                <Link
                  href="/silniki-elektryczne-11-kw-1400-obr"
                  className="block hover:underline"
                >
                  11 kW 1400 obr
                </Link>
                <Link
                  href="/silniki-elektryczne-18-5-kw-1400-obr"
                  className="block hover:underline"
                >
                  18,5 kW 1400 obr
                </Link>
              </div>
            </div>

            {/* 2900 obr/min */}
            <div>
              <h4 className="font-semibold text-foreground mb-2">
                2900 obr/min
              </h4>
              <div className="space-y-0.5">
                <Link
                  href="/silniki-elektryczne-075-kw-2900-obr"
                  className="block hover:underline"
                >
                  0,75 kW 2900 obr
                </Link>
                <Link
                  href="/silniki-elektryczne-1-1-kw-2900-obr"
                  className="block hover:underline"
                >
                  1,1 kW 2900 obr
                </Link>
                <Link
                  href="/silniki-elektryczne-1-5-kw-2900-obr"
                  className="block hover:underline"
                >
                  1,5 kW 2900 obr
                </Link>
                <Link
                  href="/silniki-elektryczne-2-2-kw-2900-obr"
                  className="block hover:underline"
                >
                  2,2 kW 2900 obr
                </Link>
                <Link
                  href="/silniki-elektryczne-3-kw-2900-obr"
                  className="block hover:underline"
                >
                  3 kW 2900 obr
                </Link>
                <Link
                  href="/silniki-elektryczne-4-kw-2900-obr"
                  className="block hover:underline"
                >
                  4 kW 2900 obr
                </Link>
                <Link
                  href="/silniki-elektryczne-5-5-kw-2900-obr"
                  className="block hover:underline"
                >
                  5,5 kW 2900 obr
                </Link>
                <Link
                  href="/silniki-elektryczne-7-5-kw-2900-obr"
                  className="block hover:underline"
                >
                  7,5 kW 2900 obr
                </Link>
                <Link
                  href="/silniki-elektryczne-11-kw-2900-obr"
                  className="block hover:underline"
                >
                  11 kW 2900 obr
                </Link>
                <Link
                  href="/silniki-elektryczne-18-5-kw-2900-obr"
                  className="block hover:underline"
                >
                  18,5 kW 2900 obr
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* DRUGA SEKCJA - GRID Z POZOSTAŁYMI KOLUMNAMI */}
        <div className="grid grid-cols-12 gap-4">
          {/* Moce */}
          <div className="col-span-12 lg:col-span-3">
            <h3 className="font-bold mb-3 text-sm">Moce silników</h3>
            <div className="grid grid-cols-3 gap-2">
              {powerColumns.map((column, idx) => (
                <div key={idx} className="text-xs text-muted-foreground">
                  {column.map((item) => (
                    <Link
                      key={item.power}
                      href={item.href}
                      className="block hover:underline py-0.5"
                    >
                      {item.power}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Producenci */}
          <div className="col-span-12 lg:col-span-3">
            <h3 className="font-bold mb-3 text-sm">Producenci silników</h3>
            <div className="grid grid-cols-2 gap-2">
              {manufacturerColumns.map((column, idx) => (
                <div key={idx} className="text-xs text-muted-foreground">
                  {column.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="block hover:underline py-0.5"
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Dane kontaktowe */}
          <div className="col-span-12 lg:col-span-2">
            <h3 className="font-bold mb-3 text-sm">Dane firmy</h3>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Stojan S.C. Adam Król, Włodzimierz Leszczyński</p>
              <p>87-152 Pigża, Wojewódzka&nbsp;2</p>
              <p>NIP: 8790003705</p>
              <p>REGON: 870039184</p>
              <p>
                <a
                  href="mailto:stojan@silniki-elektryczne.com.pl"
                  className="hover:underline"
                >
                  stojan@silniki-elektryczne.com.pl
                </a>
              </p>
              <p>Tel.: 500 385 112</p>
            </div>
          </div>

          {/* Informacje prawne */}
          <div className="col-span-12 lg:col-span-2">
            <h3 className="font-bold mb-3 text-sm">Informacje prawne</h3>
            <div className="text-xs text-muted-foreground space-y-1">
              {[
                "Kontakt",
                "Formy platnosci",
                "Koszty i czas wysylki",
                "Odstapienie od umowy",
                "Regulamin sklepu",
                "Warunki zwrotu",
                "Polityka prywatnosci",
                "Przetwarzanie danych osobowych",
                "Blog",
              ].map((item) => (
                <Link
                  href={`/${item.toLowerCase().replace(/ /g, "-")}`}
                  key={item}
                  className="block hover:underline"
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>

          {/* Realizacja zamówienia */}
          <div className="col-span-12 lg:col-span-2">
            <h3 className="font-bold mb-3 text-sm">Realizacja zamówienia</h3>
            <div className="text-xs text-muted-foreground space-y-1">
              {[
                "Formy platności",
                "Koszty i czas wysylki",
                "Odstapienie od umowy",
              ].map((item) => (
                <Link
                  href={`/${item.toLowerCase().replace(/ /g, "-")}`}
                  key={item}
                  className="block hover:underline"
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Metody płatności i dostawcy */}
        <div className="mt-8 border-t border-border pt-6">
          <div className="flex flex-wrap gap-6 justify-center items-center">
            <Image
              src="/payments/stripe.png"
              alt="Stripe"
              width={64}
              height={32}
              className="object-contain"
            />
            <Image
              src="/payments/blik.webp"
              alt="BLIK"
              width={64}
              height={32}
              className="object-contain"
            />
            <Image
              src="/payments/przelewy24.png"
              alt="Przelewy24"
              width={64}
              height={32}
              className="object-contain"
            />
            <Image
              src="/payments/visa.png"
              alt="Visa"
              width={64}
              height={32}
              className="object-contain"
            />
            <Image
              src="/payments/mastercard.svg"
              alt="Mastercard"
              width={64}
              height={32}
              className="object-contain"
            />
            <Image
              src="/payments/paypal.webp"
              alt="PayPal"
              width={64}
              height={32}
              className="object-contain"
            />
            <Image
              src="/payments/gpay.png"
              alt="Google Pay"
              width={64}
              height={32}
              className="object-contain"
            />
            <Image
              src="/payments/applepay.png"
              alt="Apple Pay"
              width={64}
              height={32}
              className="object-contain"
            />
            <Image
              src="/payments/dhl.png"
              alt="DHL"
              width={64}
              height={32}
              className="object-contain"
            />
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-6 text-center text-xs text-muted-foreground">
          <p>Silniki-Elektryczne.com.pl | {currentYear}</p>
        </div>
      </div>
    </footer>
  );
};
