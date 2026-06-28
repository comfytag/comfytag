import type { Metadata, Viewport } from 'next'
import { Anybody, Space_Grotesk } from 'next/font/google'
import './globals.css'
import Providers from './providers'

// NEW: Anybody for bold headers
const anybody = Anybody({ subsets: ['latin'], variable: '--font-anybody', weight: ['700', '800', '900'], display: 'swap' })
// NEW: Space Grotesk for labels
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk', weight: ['500', '600', '700'], display: 'swap' })

export const metadata: Metadata = {
  title: 'ComfyTag Partner',
  description: 'Event organizer dashboard',
  icons: {
    icon: '/icon-192.png',
    shortcut: '/icon-192.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'ComfyTag Partner' },
}

export const viewport: Viewport = {
  themeColor: '#0F0F0F',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${anybody.variable} ${spaceGrotesk.variable}`}>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
