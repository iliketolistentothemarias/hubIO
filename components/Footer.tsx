import Link from 'next/link'
import { Heart } from 'lucide-react'
export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-[#1C1B18] dark:bg-[#0B0A0F] text-[#B8A584] pb-24 md:pb-0">
      <div className="container-custom py-12 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 md:gap-8 mb-12 md:mb-8">
          {/* Brand Section */}
          <div className="md:col-span-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
              <Heart className="w-6 h-6 text-[#D4A574]" />
              <span className="text-xl font-display font-bold text-[#F5F3F0]">
                Commu<span className="text-[#D4A574]">nify</span>
              </span>
            </div>
            <p className="text-sm text-[#B8A584] mb-4 max-w-sm mx-auto md:mx-0">
              Connecting communities with resources, support, and opportunities for growth.
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex justify-center md:justify-end">
            <div className="w-full md:w-auto text-center md:text-left">
              <h3 className="text-[#F5F3F0] font-bold uppercase tracking-widest text-xs mb-6 opacity-60">Quick Links</h3>
              <ul className="grid grid-cols-2 md:grid-cols-1 gap-y-4 gap-x-8">
                <li>
                  <Link href="/directory" className="text-[#B8A584] hover:text-[#D4A574] transition-colors text-sm font-medium">
                    Resource Directory
                  </Link>
                </li>
                <li>
                  <Link href="/highlights" className="text-[#B8A584] hover:text-[#D4A574] transition-colors text-sm font-medium">
                    Featured
                  </Link>
                </li>
                <li>
                  <Link href="/submit" className="text-[#B8A584] hover:text-[#D4A574] transition-colors text-sm font-medium">
                    Submit Resource
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="text-[#B8A584] hover:text-[#D4A574] transition-colors text-sm font-medium">
                    About Us
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-[#2c2c3e]/50 pt-8 text-center text-xs font-medium text-[#B8A584]/60">
          <p suppressHydrationWarning>© {currentYear} Communify. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

