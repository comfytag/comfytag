'use client'

import { BottomTabBar } from '@/components/layout/BottomTabBar'

export function BottomTabBarWrapper() {
  // BottomTabBar already calls usePathname() internally.
  // This wrapper exists so layout.tsx (a Server Component) can
  // import a named client boundary without passing currentPath.
  return <BottomTabBar currentPath="" />
}
