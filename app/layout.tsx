import type { Metadata } from 'next'
import { Poppins, Merriweather } from 'next/font/google'
import './globals.css'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { FavoritesProvider } from '@/contexts/FavoritesContext'
import { DataProvider } from '@/contexts/DataContext'
import ToastContainer from '@/components/Toast'
import InitialDataLoader from '@/components/InitialDataLoader'
import ClientBootstrap from '@/components/ClientBootstrap'
import DevChunkRecovery from '@/components/DevChunkRecovery'

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
        {process.env.NODE_ENV === 'development' && (
          <meta httpEquiv="Cache-Control" content="no-store, no-cache, must-revalidate, max-age=0" />
        )}
      </head>
      <body className="font-sans antialiased bg-[#FAF9F6] dark:bg-[#1C1B18] text-[#2C2416] dark:text-[#F5F3F0] transition-colors duration-300">
        <ThemeProvider>
          <DataProvider>
            <FavoritesProvider>
              {process.env.NODE_ENV === 'development' && <DevChunkRecovery />}
              <ClientBootstrap />
              <InitialDataLoader />
              <Navigation />
              <main className="min-h-screen" role="main" aria-label="Main content">
                {children}
              </main>
              <Footer />
              <ToastContainer />
            </FavoritesProvider>
          </DataProvider>
        </ThemeProvider>
        {/* Unregister legacy service workers only. Do NOT wipe Cache Storage — Next.js stores
            _next/static CSS/JS there; deleting all caches breaks Tailwind/styles until hard refresh. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.getRegistrations().then(function(registrations) {
                    registrations.forEach(function(registration) { registration.unregister(); });
                  });
                }
              })();
            `,
          }}
        />
      </body>
    </html>
  )
}
