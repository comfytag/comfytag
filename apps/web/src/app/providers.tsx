'use client'

import { SessionProvider } from 'next-auth/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'
import { ApiTokenSync } from '@/components/layout/ApiTokenSync'
import { NotificationProvider } from '@/contexts/NotificationContext'

export function Providers({ children }: { children: React.ReactNode }) {
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
      <QueryClientProvider client={queryClient}>
        <NotificationProvider>
          {children}
          {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
        </NotificationProvider>
      </QueryClientProvider>
    </SessionProvider>
  )
}
