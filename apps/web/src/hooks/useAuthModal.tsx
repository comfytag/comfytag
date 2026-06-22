'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'

export type AuthModalView = 'login' | 'register' | 'forgot_password' | 'verify_email'
export type AuthModalSuccessBanner = 'registered' | 'password-reset' | null

interface AuthModalState {
  isOpen: boolean
  view: AuthModalView
  successBanner: AuthModalSuccessBanner
  prefilledEmail: string
}

interface AuthModalActions {
  openModal: (view?: AuthModalView, opts?: { email?: string }) => void
  closeModal: () => void
  switchView: (view: AuthModalView) => void
  _setSuccessBanner: (banner: AuthModalSuccessBanner) => void
  _setPrefilledEmail: (email: string) => void
}

type AuthModalContextValue = AuthModalState & AuthModalActions

const AuthModalContext = createContext<AuthModalContextValue | null>(null)

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [view, setView] = useState<AuthModalView>('login')
  const [successBanner, setSuccessBanner] = useState<AuthModalSuccessBanner>(null)
  const [prefilledEmail, setPrefilledEmail] = useState('')

  const openModal = useCallback((v: AuthModalView = 'login', opts?: { email?: string }) => {
    setView(v)
    setPrefilledEmail(opts?.email ?? '')
    setSuccessBanner(null)
    setIsOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setIsOpen(false)
  }, [])

  const switchView = useCallback((v: AuthModalView) => {
    setView(v)
  }, [])

  return (
    <AuthModalContext.Provider
      value={{
        isOpen,
        view,
        successBanner,
        prefilledEmail,
        openModal,
        closeModal,
        switchView,
        _setSuccessBanner: setSuccessBanner,
        _setPrefilledEmail: setPrefilledEmail,
      }}
    >
      {children}
    </AuthModalContext.Provider>
  )
}

export function useAuthModal() {
  const ctx = useContext(AuthModalContext)
  if (!ctx) throw new Error('useAuthModal must be used within AuthModalProvider')
  return ctx
}
