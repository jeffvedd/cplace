import { ReactNode, useEffect } from 'react';
import { Header } from './Header';
import { useCryptoStore } from '@/store/cryptoStore';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { theme } = useCryptoStore();

  useEffect(() => {
    // Set initial theme
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6">
        {children}
      </main>
    </div>
  );
};
