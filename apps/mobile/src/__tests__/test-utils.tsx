import React from 'react'
import { render, renderHook } from '@testing-library/react-native'
import type { RenderOptions } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export function createTestClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
}

function Wrapper({ children }: { children: React.ReactNode }) {
  const client = createTestClient()
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

export function renderWithQuery(ui: React.ReactElement, options?: RenderOptions) {
  return render(ui, { wrapper: Wrapper, ...options })
}

export function renderHookWithQuery<R>(hook: () => R) {
  return renderHook(hook, { wrapper: Wrapper })
}

export * from '@testing-library/react-native'
