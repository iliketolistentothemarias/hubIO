import type { Metadata } from 'next'
import { Poppins, Merriweather } from 'next/font/google'
import './globals.css'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import ProfileMenu from '@/components/ProfileMenu'
import Messaging from '@/components/Messaging'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { FavoritesProvider } from '@/contexts/FavoritesContext'
import ToastContainer from '@/components/Toast'
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
  title: 'HubIO - Community Resource Hub',
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
      <body className="font-sans antialiased bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
        <ThemeProvider>
          <FavoritesProvider>
            <Navigation />
            <main className="min-h-screen relative" role="main" aria-label="Main content">
              {children}
            </main>
            <Footer />
            <ProfileMenu />
            <Messaging minimized={true} />
            <ToastContainer />
          </FavoritesProvider>
        </ThemeProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js')
                    .then(reg => console.log('SW registered', reg))
                    .catch(err => console.log('SW registration failed', err));
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}

