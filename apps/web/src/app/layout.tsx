import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains-mono', display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL('https://comfytag.com'),
  title: {
    template: '%s | ComfyTag',
    default: 'ComfyTag — Don\'t hear about it, be there.',
  },
  description: 'Find and buy tickets for the best events in Nigeria. Music, tech, culture, and more.',
  keywords: ['events', 'tickets', 'Nigeria', 'Ilorin', 'concerts', 'nightlife'],
  openGraph: {
    type: 'website',
    siteName: 'ComfyTag',
    title: 'ComfyTag — Don\'t hear about it, be there.',
    description: 'Find and buy tickets for the best events in Nigeria.',
    images: [{ url: '/api/og', width: 800, height: 418, alt: 'ComfyTag' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ComfyTag',
    description: 'Find and buy tickets for the best events in Nigeria.',
    images: ['/api/og'],
  },
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'ComfyTag' },
}

export const viewport: Viewport = {
  themeColor: '#7C3AED',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
