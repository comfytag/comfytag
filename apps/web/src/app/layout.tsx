import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono, Anybody, Space_Grotesk, Geist } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { BottomTabBarWrapper } from '@/components/layout/BottomTabBarWrapper'
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains-mono', display: 'swap' })
// NEW: Anybody for bold headers
const anybody = Anybody({ subsets: ['latin'], variable: '--font-anybody', weight: ['700', '800', '900'], display: 'swap' })
// NEW: Space Grotesk for labels
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk', weight: ['500', '600', '700'], display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL('https://comfytag.com'),
  title: {
    template: '%s | ComfyTag',
    default: 'ComfyTag — Buy Event Tickets in Ilorin, Nigeria',
  },
  description: 'Buy event tickets in Ilorin, Lagos, Abuja on ComfyTag. Your face is your ticket. No QR codes, zero stress, instant checkout. Discover events.',
  keywords: [
    'events in Ilorin',
    'buy event tickets Nigeria',
    'concerts Ilorin',
    'nightlife Nigeria',
    'event ticketing Nigeria',
    'face recognition tickets',
    'ComfyTag',
    'tickets Ilorin',
    'events this weekend',
  ],
  alternates: {
    canonical: 'https://comfytag.com',
  },
  openGraph: {
    type: 'website',
    siteName: 'ComfyTag',
    title: 'ComfyTag — Buy Event Tickets in Ilorin, Nigeria',
    description: 'Find the best events in Ilorin this weekend. Buy tickets in seconds. Your face is your ticket.',
    images: [{ url: '/api/og', width: 1200, height: 630, alt: 'ComfyTag' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ComfyTag',
    description: 'Find the best events in Ilorin this weekend. Buy tickets in seconds.',
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
    <html suppressHydrationWarning lang="en" className={cn(inter.variable, jetbrainsMono.variable, anybody.variable, spaceGrotesk.variable, "font-sans", geist.variable)}>
      <body suppressHydrationWarning>
        <Providers>
          {children}
          <BottomTabBarWrapper />
        </Providers>
      </body>
    </html>
  )
}
