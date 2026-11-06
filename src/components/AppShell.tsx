'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';
import AutoLogoutManager from './AutoLogoutManager';
import GoogleTranslateScript from './GoogleTranslateScript';
import ThemeProvider from './ThemeProvider';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');
  const isLoginPage = pathname === '/login';

  if (isAdmin) {
    return (
      <ThemeProvider>
        <div className="min-h-screen bg-slate-100 text-slate-900">
          <GoogleTranslateScript />
          <AutoLogoutManager />
          {children}
        </div>
      </ThemeProvider>
    );
  }

  if (isLoginPage) {
    return (
      <ThemeProvider>
        <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 flex flex-col justify-center">
          <GoogleTranslateScript />
          <AutoLogoutManager />
          <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
            {children}
          </main>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <GoogleTranslateScript />
      <AutoLogoutManager />
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 print:py-0 print:px-0 print:max-w-none">
        {children}
      </main>
      <Footer />
    </ThemeProvider>
  );
}
