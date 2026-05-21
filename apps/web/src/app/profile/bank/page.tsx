'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button, Input, ErrorMessage, LoadingSpinner } from '@comfytag/ui'
import { Navbar } from '@/components/layout/Navbar'
import { BackLink } from '@/components/ui/BackLink'
import { authHeader, NIGERIAN_STATES } from '@comfytag/utils'
import api from '@/lib/api'

interface BankAccount {
  accountName: string
  accountNumber: string
  bankCode: string
  bankName: string
  state: string
}

const NIGERIAN_BANKS: { code: string; name: string }[] = [
  { code: '044', name: 'Access Bank' },
  { code: '023', name: 'Citibank' },
  { code: '050', name: 'Ecobank' },
  { code: '070', name: 'Fidelity Bank' },
  { code: '011', name: 'First Bank of Nigeria' },
  { code: '214', name: 'First City Monument Bank (FCMB)' },
  { code: '058', name: 'Guaranty Trust Bank (GTBank)' },
  { code: '030', name: 'Heritage Bank' },
  { code: '301', name: 'Jaiz Bank' },
  { code: '082', name: 'Keystone Bank' },
  { code: '526', name: 'Moniepoint MFB' },
  { code: '076', name: 'Polaris Bank' },
  { code: '221', name: 'Stanbic IBTC Bank' },
  { code: '068', name: 'Standard Chartered Bank' },
  { code: '232', name: 'Sterling Bank' },
  { code: '100', name: 'SunTrust Bank' },
  { code: '032', name: 'Union Bank of Nigeria' },
  { code: '033', name: 'United Bank for Africa (UBA)' },
  { code: '215', name: 'Unity Bank' },
  { code: '035', name: 'Wema Bank' },
  { code: '057', name: 'Zenith Bank' },
  { code: '627', name: 'Kuda MFB' },
  { code: '304', name: 'OPay' },
  { code: '305', name: 'PalmPay' },
]

export default function BankPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [accountName, setAccountName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [bankCode, setBankCode] = useState('')
  const [state, setState] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    if (status !== 'authenticated' || !session) return

    const fetchBank = async () => {
      try {
        const response = await api.get(
          `/bank/${session.user.id}`,
          authHeader(session.user.token)
        )
        const existing = response.data?.data as BankAccount | undefined
        if (existing) {
          setAccountName(existing.accountName ?? '')
          setAccountNumber(existing.accountNumber ?? '')
          setBankCode(existing.bankCode ?? '')
          setState(existing.state ?? '')
        }
      } catch {
        // No existing bank account — form stays empty
      } finally {
        setIsLoading(false)
      }
    }

    fetchBank()
  }, [status, session, router])

  const selectedBank = NIGERIAN_BANKS.find((b) => b.code === bankCode)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!session) return
    setError(null)
    setSuccess(false)
    setIsSaving(true)

    try {
      const payload: BankAccount = {
        accountName,
        accountNumber,
        bankCode,
        bankName: selectedBank?.name ?? '',
        state,
      }

      await api.post(
        `/bank/${session.user.id}`,
        payload,
        authHeader(session.user.token)
      )

      setSuccess(true)
      setTimeout(() => router.push('/hype-link'), 2000)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      setError(axiosErr.response?.data?.message ?? 'Failed to save bank account. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  if (status === 'loading' || (status === 'authenticated' && isLoading)) {
    return (
      <>
        <Navbar />
        <div
          style={{
            minHeight: '60vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <LoadingSpinner size="lg" centered />
        </div>
      </>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  return (
    <>
      <Navbar />
      <main
        style={{
          minHeight: '100vh',
          background: 'var(--color-bg-public, #FAFAF9)',
          padding: '32px 24px 80px',
        }}
      >
        <div style={{ maxWidth: '480px', margin: '0 auto' }}>
          <BackLink href="/profile">Back to Profile</BackLink>

          <h1
            style={{
              fontSize: '28px',
              fontWeight: 800,
              color: 'var(--color-text)',
              margin: '24px 0 8px',
              letterSpacing: '-0.02em',
            }}
          >
            Bank Account
          </h1>
          <p
            style={{
              fontSize: '14px',
              color: 'var(--color-text-muted)',
              marginBottom: '32px',
            }}
          >
            Add or update your bank account for Hype Link withdrawals.
          </p>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Input
              label="Account Name"
              id="accountName"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="As it appears on your bank statement"
              required
            />

            <Input
              label="Account Number"
              id="accountNumber"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="10-digit account number"
              required
            />

            <div>
              <label
                htmlFor="bankCode"
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'var(--color-text)',
                  marginBottom: '6px',
                }}
              >
                Bank
              </label>
              <select
                id="bankCode"
                value={bankCode}
                onChange={(e) => setBankCode(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  background: 'var(--color-surface-2)',
                  color: 'var(--color-text)',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  cursor: 'pointer',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-brand)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
              >
                <option value="">Select your bank</option>
                {NIGERIAN_BANKS.map((bank) => (
                  <option key={bank.code} value={bank.code}>
                    {bank.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="state"
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'var(--color-text)',
                  marginBottom: '6px',
                }}
              >
                State
              </label>
              <select
                id="state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  background: 'var(--color-surface-2)',
                  color: 'var(--color-text)',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  cursor: 'pointer',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-brand)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
              >
                <option value="">Select a state</option>
                {NIGERIAN_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {error && <ErrorMessage message={error} />}

            {success && (
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid var(--color-success)',
                  color: 'var(--color-success)',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                Bank account saved! Redirecting to Hype Link…
              </div>
            )}

            <Button
              type="submit"
              fullWidth
              loading={isSaving}
              disabled={!accountName || !accountNumber || !bankCode}
            >
              {isSaving ? 'Saving…' : 'Save Bank Account'}
            </Button>
          </form>
        </div>
      </main>
    </>
  )
}
