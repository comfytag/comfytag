'use client'

import React, { useCallback, useState } from 'react'
import { Dialog } from 'radix-ui'
import { useAuthModal } from '@/hooks/useAuthModal'
import { LoginForm } from './LoginForm'
import { RegisterForm } from './RegisterForm'
import { ForgotPasswordForm } from './ForgotPasswordForm'
import { VerifyEmailForm } from './VerifyEmailForm'

export function AuthModal() {
  const {
    isOpen,
    view,
    closeModal,
    switchView,
    successBanner,
    prefilledEmail,
    _setSuccessBanner,
    _setPrefilledEmail,
  } = useAuthModal()

  const [pendingMode, setPendingMode] = useState<'otp' | 'credentials'>('otp')

  const handleRegisterSuccess = useCallback(
    (email: string) => {
      _setPrefilledEmail(email)
      _setSuccessBanner('registered')
      switchView('login')
    },
    [_setPrefilledEmail, _setSuccessBanner, switchView]
  )

  const handlePasswordReset = useCallback(() => {
    _setSuccessBanner('password-reset')
    switchView('login')
  }, [_setSuccessBanner, switchView])

  const handleSwitchToVerify = useCallback((email: string) => {
    _setPrefilledEmail(email)
    switchView('verify_email')
  }, [_setPrefilledEmail, switchView])

  const handleRequiresPassword = useCallback((email: string) => {
    _setPrefilledEmail(email)
    setPendingMode('credentials')
    switchView('login')
  }, [_setPrefilledEmail, switchView])

  const viewTitles: Record<typeof view, string> = {
    login: 'Sign in to ComfyTag',
    register: 'Join ComfyTag',
    forgot_password: 'Reset your password',
    verify_email: 'Verify your email',
  }

  return (
    <>
      <style>{`
        [data-auth-overlay][data-state="open"] {
          animation: __ct_auth_overlay_in 200ms ease forwards;
        }
        [data-auth-overlay][data-state="closed"] {
          animation: __ct_auth_overlay_out 180ms ease forwards;
        }
        @keyframes __ct_auth_overlay_in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes __ct_auth_overlay_out {
          from { opacity: 1; }
          to   { opacity: 0; }
        }

        [data-auth-content][data-state="open"] {
          animation: __ct_auth_content_in 220ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        [data-auth-content][data-state="closed"] {
          animation: __ct_auth_content_out 180ms ease forwards;
        }
        @keyframes __ct_auth_content_in {
          from { opacity: 0; transform: translate(-50%, -48%) scale(0.95); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes __ct_auth_content_out {
          from { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          to   { opacity: 0; transform: translate(-50%, -48%) scale(0.95); }
        }

        [data-auth-close-btn]:hover {
          background: var(--color-border) !important;
        }
        [data-auth-close-btn]:focus-visible {
          outline: 2px solid var(--color-brand);
          outline-offset: 2px;
        }
      `}</style>

      <Dialog.Root open={isOpen} onOpenChange={(open) => { if (!open) closeModal() }}>
        <Dialog.Portal>
          {/* Overlay */}
          <Dialog.Overlay
            data-auth-overlay=""
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 200,
              background: 'rgba(0, 0, 0, 0.52)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
            }}
          />

          {/* Content */}
          <Dialog.Content
            data-auth-content=""
            aria-describedby={undefined}
            style={{
              position: 'fixed',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 201,
              width: 'min(425px, calc(100vw - 32px))',
              background: 'var(--color-surface)',
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: '0 32px 80px rgba(0, 0, 0, 0.18), 0 8px 24px rgba(0, 0, 0, 0.10)',
              maxHeight: '92dvh',
              overflowY: 'auto',
              scrollbarWidth: 'none',
            }}
          >
            {/* Visually-hidden title for screen readers */}
            <Dialog.Title
              style={{
                position: 'absolute',
                width: '1px',
                height: '1px',
                padding: 0,
                margin: '-1px',
                overflow: 'hidden',
                clip: 'rect(0,0,0,0)',
                whiteSpace: 'nowrap',
                border: 0,
              }}
            >
              {viewTitles[view]}
            </Dialog.Title>

            {/* Brand gradient strip */}
            <div
              style={{
                height: '4px',
                background: 'linear-gradient(90deg, #7C3AED 0%, #5B21B6 100%)',
                flexShrink: 0,
              }}
              aria-hidden="true"
            />

            {/* Close button */}
            <Dialog.Close asChild>
              <button
                data-auth-close-btn=""
                aria-label="Close sign in dialog"
                style={{
                  position: 'absolute',
                  top: '14px',
                  right: '14px',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'var(--color-surface-2, rgba(0,0,0,0.06))',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-text-muted)',
                  zIndex: 2,
                  transition: 'background 150ms ease',
                  flexShrink: 0,
                }}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </Dialog.Close>

            {/* Form area */}
            <div style={{ padding: '24px 24px 28px' }}>
              {view === 'login' && (
                <LoginForm
                  onSwitchToRegister={() => switchView('register')}
                  onSwitchToForgotPassword={() => switchView('forgot_password')}
                  onSwitchToVerifyEmail={handleSwitchToVerify}
                  initialEmail={prefilledEmail}
                  initialMode={pendingMode}
                  successBanner={successBanner}
                  onSuccess={closeModal}
                />
              )}
              {view === 'register' && (
                <RegisterForm
                  onSwitchToLogin={() => switchView('login')}
                  onSuccess={handleRegisterSuccess}
                />
              )}
              {view === 'forgot_password' && (
                <ForgotPasswordForm
                  onSwitchToLogin={() => switchView('login')}
                  onPasswordReset={handlePasswordReset}
                />
              )}
              {view === 'verify_email' && (
                <VerifyEmailForm
                  email={prefilledEmail}
                  onSuccess={closeModal}
                  onBack={() => switchView('login')}
                  onRequiresPassword={handleRequiresPassword}
                />
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}
