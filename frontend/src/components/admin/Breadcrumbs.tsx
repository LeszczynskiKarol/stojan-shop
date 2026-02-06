// frontend/src/components/admin/Breadcrumbs.tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

const routeLabels: Record<string, string> = {
  admin: 'Panel',
  products: 'Produkty',
  new: 'Nowy',
  marketplaces: 'Marketplace',
  'own-store': 'Sklep własny',
  orders: 'Zamówienia',
  manufacturers: 'Producenci',
  categories: 'Kategorie',
  import: 'Import',
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  const breadcrumbs = segments.map((segment, index) => {
    const label = routeLabels[segment] || segment;
    const href = `/${segments.slice(0, index + 1).join('/')}`;
    return { label, href };
  });

  return (
    <div className="flex items-center text-sm text-muted-foreground mb-6">
      <Link href="/admin" className="flex items-center hover:text-foreground">
        <Home className="w-4 h-4 mr-2" />
        Panel
      </Link>
      {breadcrumbs.slice(1).map((crumb, index) => (
        <div key={crumb.href} className="flex items-center">
          <ChevronRight className="w-4 h-4 mx-2" />
          {index === breadcrumbs.length - 2 ? (
            <span className="text-foreground">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="hover:text-foreground">
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}

