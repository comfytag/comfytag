'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'

export type AuthModalView = 'login' | 'register' | 'forgot_password' | 'verify_email'
export type AuthModalSuccessBanner = 'registered' | 'password-reset' | null

export interface RegisterDraft {
  name: string
  username: string
  email: string
  password: string
  confirmPassword: string
}

export const EMPTY_REGISTER_DRAFT: RegisterDraft = { name: '', username: '', email: '', password: '', confirmPassword: '' }

interface AuthModalState {
  isOpen: boolean
  view: AuthModalView
  successBanner: AuthModalSuccessBanner
  prefilledEmail: string
  /** Survives closing/reopening the modal (e.g. an accidental outside-click) — the dialog
   * unmounts RegisterForm on close, so its own local state can't persist on its own. */
  registerDraft: RegisterDraft
}

interface AuthModalActions {
  openModal: (view?: AuthModalView, opts?: { email?: string }) => void
  closeModal: () => void
  switchView: (view: AuthModalView) => void
  _setSuccessBanner: (banner: AuthModalSuccessBanner) => void
  _setPrefilledEmail: (email: string) => void
  _setRegisterDraft: (draft: RegisterDraft) => void
}

type AuthModalContextValue = AuthModalState & AuthModalActions

const AuthModalContext = createContext<AuthModalContextValue | null>(null)

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [view, setView] = useState<AuthModalView>('login')
  const [successBanner, setSuccessBanner] = useState<AuthModalSuccessBanner>(null)
  const [prefilledEmail, setPrefilledEmail] = useState('')
  const [registerDraft, setRegisterDraft] = useState<RegisterDraft>(EMPTY_REGISTER_DRAFT)

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
        registerDraft,
        openModal,
        closeModal,
        switchView,
        _setSuccessBanner: setSuccessBanner,
        _setPrefilledEmail: setPrefilledEmail,
        _setRegisterDraft: setRegisterDraft,
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
