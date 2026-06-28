'use client'

import { SessionProvider } from 'next-auth/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { ApiTokenSync } from '@/components/layout/ApiTokenSync'
import { PushNotificationInit } from '@/components/layout/PushNotificationInit'
import { NotificationProvider } from '@/contexts/NotificationContext'

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            retry: 1,
          },
        },
      })
  )

  return (
    <SessionProvider>
      <ApiTokenSync />
      <PushNotificationInit />
      <QueryClientProvider client={queryClient}>
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </QueryClientProvider>
    </SessionProvider>
  )
}
