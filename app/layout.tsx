import type { Metadata } from 'next'
import { Poppins, Merriweather } from 'next/font/google'
import './globals.css'
import 'leaflet/dist/leaflet.css'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import BottomNav from '@/components/BottomNav'
import ProfileMenu from '@/components/ProfileMenu'
import Messaging from '@/components/Messaging'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { FavoritesProvider } from '@/contexts/FavoritesContext'
import { DataProvider } from '@/contexts/DataContext'
import ToastContainer from '@/components/Toast'
import PagePreloader from '@/components/PagePreloader'
import InitialDataLoader from '@/components/InitialDataLoader'
import '@/lib/auth/init-admin'

const poppins = Poppins({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
})

const merriweather = Merriweather({ 
  subsets: ['latin'],
  weight: ['300', '400', '700', '900'],
  variable: '--font-serif',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Communify - Community Resource Hub',
  description: 'Your gateway to community resources, support services, and local programs. Connect, discover, and thrive together.',
  keywords: 'community resources, local services, non-profits, support services, community events',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${poppins.variable} ${merriweather.variable}`} suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#8B6F47" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </head>
      <body className="font-sans antialiased bg-[#FAF9F6] dark:bg-[#1C1B18] text-[#2C2416] dark:text-[#F5F3F0] transition-colors duration-300">
        <ThemeProvider>
          <DataProvider>
            <FavoritesProvider>
              <InitialDataLoader />
              <PagePreloader />
              <Navigation />
              <main className="min-h-screen relative" role="main" aria-label="Main content">
                {children}
              </main>
              <Footer />
              <BottomNav />
              <ToastContainer />
            </FavoritesProvider>
          </DataProvider>
        </ThemeProvider>
        {/* Service Worker - immediately unregister and clear everything */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Unregister all service workers
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.getRegistrations().then(registrations => {
                    registrations.forEach(registration => {
                      registration.unregister();
                    });
                  });
                }
                
                const rememberSession = (() => {
                  try {
                    return localStorage.getItem('remember_me') === 'true';
                  } catch (e) {
                    return false;
                  }
                })();
                
                // Clear all caches
                if ('caches' in window) {
                  caches.keys().then(names => {
                    names.forEach(name => caches.delete(name));
                  });
                }
                
                // Clear localStorage and sessionStorage unless user wants to stay signed in
                try {
                  if (!rememberSession) {
                    localStorage.clear();
                  }
                  sessionStorage.clear();
                } catch(e) {}
              })();
            `,
          }}
        />
      </body>
    </html>
  )
}
