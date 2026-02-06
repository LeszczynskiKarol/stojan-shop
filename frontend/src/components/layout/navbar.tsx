// frontend/src/components/layout/navbar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAllegroAuthStore } from '@/store/allegroAuthStore';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/use-toast';
import { useEffect } from 'react';

export function Navbar() {
  const pathname = usePathname();
  const { toast } = useToast();
  const { isAuthenticated, checkAuthStatus } = useAllegroAuthStore();

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  useEffect(() => {
    const checkAuth = async () => {
      await checkAuthStatus();
    };

    checkAuth();

    // Sprawdzaj status co 5 minut
    const interval = setInterval(checkAuth, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [checkAuthStatus]);

  // Dodajmy hook do sprawdzania parametrów URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('auth') === 'success') {
      toast({
        title: 'Sukces!',
        description: 'Połączono z kontem Allegro pomyślnie',
        duration: 5000, // pokazuj przez 5 sekund
        variant: 'default',
      });

      // Usuń parametr z URL bez przeładowania strony
      window.history.replaceState({}, '', '/products');
    }
  }, [toast]);

  const handleAuth = async () => {
    try {
      const response = await fetch('/api/allegro/auth');
      const { data } = await response.json();
      sessionStorage.setItem('allegroAuthReturnPath', window.location.pathname);
      window.location.href = data.url;
    } catch (error) {
      toast({
        title: 'Błąd',
        description: 'Nie udało się połączyć z Allegro',
        variant: 'destructive',
      });
    }
  };

  const routes = [
    {
      href: '/',
      label: 'Strona główna',
      active: pathname === '/',
    },
    //{
    //href: '/products',
    //label: 'Produkty',
    //active: pathname === '/products',
    //},
    {
      href: '/marketplaces',
      label: 'Marketplace',
      active: pathname === '/marketplaces',
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="hidden font-bold sm:inline-block">System zarządzania silnikami</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  'transition-colors hover:text-foreground/80',
                  route.active ? 'text-foreground' : 'text-foreground/60'
                )}
              >
                {route.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'h-2 w-2 rounded-full',
                isAuthenticated ? 'bg-green-500' : 'bg-red-500'
              )}
            />
            <Button onClick={handleAuth} variant="ghost" size="sm" className="text-sm">
              {isAuthenticated ? 'Połączono z Allegro' : 'Połącz z Allegro'}
            </Button>
          </div>
          <nav className="flex items-center space-x-2">
            <ThemeToggle />
          </nav>
        </div>
      </div>
    </header>
  );
}
