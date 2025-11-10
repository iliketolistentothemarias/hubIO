import type { Metadata } from 'next'
import { Poppins, Merriweather } from 'next/font/google'
import './globals.css'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import ProfileMenu from '@/components/ProfileMenu'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { FavoritesProvider } from '@/contexts/FavoritesContext'
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
      <body className="font-sans antialiased bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
        <ThemeProvider>
          <FavoritesProvider>
            <Navigation />
            <main className="min-h-screen relative">
              {children}
            </main>
            <Footer />
            <ProfileMenu />
          </FavoritesProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

