'use client'

import { useContext } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { NotificationContext } from '@/contexts/NotificationContext'

export default function MobileTopHeader() {
  const { unreadCount } = useContext(NotificationContext)

  return (
    <header className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-zinc-200/80">
      <Link href="/" aria-label="ComfyTag home">
        <Image
          src="/logo.png"
          alt="ComfyTag"
          width={120}
          height={32}
          className="h-6 w-auto object-contain"
          priority
        />
      </Link>

      <Link
        href="/notifications"
        aria-label={
          unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'
        }
        className="relative flex items-center justify-center w-9 h-9 rounded-full text-zinc-500 hover:bg-zinc-100 transition-colors duration-150"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border-2 border-slate-50"
          />
        )}
      </Link>
    </header>
  )
}
