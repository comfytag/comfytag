'use client'

import { createContext, useContext, useState, useCallback, createElement, type ReactNode } from 'react'

export interface RibbonAction {
  label: string
  icon?: ReactNode
  onClick: () => void
  variant?: 'default' | 'primary' | 'destructive'
}

interface ShellStore {
  ribbonActions: RibbonAction[]
  setRibbonActions: (actions: RibbonAction[]) => void
  clearRibbonActions: () => void
}

const ShellStoreContext = createContext<ShellStore | null>(null)

export function ShellStoreProvider({ children }: { children: ReactNode }) {
  const [ribbonActions, setRibbonActionsState] = useState<RibbonAction[]>([])

  const setRibbonActions = useCallback((actions: RibbonAction[]) => {
    setRibbonActionsState(actions)
  }, [])

  const clearRibbonActions = useCallback(() => {
    setRibbonActionsState([])
  }, [])

  return createElement(
    ShellStoreContext.Provider,
    { value: { ribbonActions, setRibbonActions, clearRibbonActions } },
    children
  )
}

export function useShellStore(): ShellStore {
  const ctx = useContext(ShellStoreContext)
  if (!ctx) throw new Error('useShellStore must be used within ShellStoreProvider')
  return ctx
}
