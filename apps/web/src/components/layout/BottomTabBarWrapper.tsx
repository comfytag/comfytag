'use client'

import { useSession } from 'next-auth/react'
import { BottomTabBar } from '@/components/layout/BottomTabBar'

export function BottomTabBarWrapper() {
  const { status } = useSession()
  if (status !== 'authenticated') return null
  return <BottomTabBar currentPath="" />
}
