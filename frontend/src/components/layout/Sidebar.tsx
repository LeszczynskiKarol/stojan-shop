// frontend/src/components/layout/Sidebar.tsx
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Package, ShoppingCart, Settings, BarChart, Truck, FileText } from 'lucide-react';

const menuItems = [
  {
    title: 'Panel główny',
    href: '/dashboard',
    icon: BarChart,
  },
  {
    title: 'Produkty',
    href: '/dashboard/products',
    icon: Package,
  },
  {
    title: 'Zamówienia',
    href: '/dashboard/orders',
    icon: ShoppingCart,
  },
  {
    title: 'Wysyłka',
    href: '/dashboard/shipping',
    icon: Truck,
  },
  {
    title: 'Faktury',
    href: '/dashboard/invoices',
    icon: FileText,
  },
  {
    title: 'Ustawienia',
    href: '/dashboard/settings',
    icon: Settings,
  },
];

export const Sidebar = () => {
  const pathname = usePathname();

  return (
    <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:border-r lg:border-gray-200 lg:bg-white lg:pt-5">
      <div className="flex flex-col flex-1 h-0 overflow-y-auto">
        <nav className="mt-5 flex-1 px-2 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group flex items-center px-2 py-2 text-sm font-medium rounded-md',
                  pathname === item.href
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <Icon
                  className={cn(
                    'mr-3 h-5 w-5',
                    pathname === item.href
                      ? 'text-gray-500'
                      : 'text-gray-400 group-hover:text-gray-500'
                  )}
                />
                {item.title}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
