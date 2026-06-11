'use client'

import { useSession } from 'next-auth/react'
import { BottomTabBar } from '@/components/layout/BottomTabBar'

export function BottomTabBarWrapper() {
  const { data: session, status } = useSession()
  // The tab bar is auth-gated — guests and loading states both fall through
  // to null so the Navbar (always rendered) handles guest mobile navigation.
  if (status === 'loading' || status !== 'authenticated' || !session) return null
  return <BottomTabBar currentPath="" />
}
