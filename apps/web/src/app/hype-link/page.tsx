'use client'

import React, { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Navbar } from '@/components/layout/Navbar'
import { Button, LoadingSpinner, EmptyState } from '@comfytag/ui'
import { authHeader, formatNaira, formatDate } from '@comfytag/utils'
import { useProfile } from '@/hooks/useProfile'

interface WalletTransaction {
  _id: string
  type: 'credit' | 'debit'
  amount: number
  description: string
  createdAt: string
  reference?: string
}

interface WalletData {
  balance: number
  transactions: WalletTransaction[]
}

export default function HypeLinkPage() {
  const { data: session, status } = useSession()
  const { data: user, isLoading } = useProfile()
  const [copied, setCopied] = useState(false)

  const wallet: WalletData = {
    balance: 0,
    transactions: [],
  }

  if (status === 'loading') {
    return (
      <>
        <Navbar />
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <LoadingSpinner size="lg" centered />
        </div>
      </>
    )
  }

  if (!session) {
    return (
      <>
        <Navbar />
        <EmptyState
          title="Sign in to access your Hype Link"
          action={{ label: 'Log In', href: '/login' }}
        />
      </>
    )
  }

  const hypeUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}?ref=${session.user.id}`
      : `https://comfytag.com?ref=${session.user.id}`

  async function handleCopy() {
    await navigator.clipboard.writeText(hypeUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const canShare = typeof navigator !== 'undefined' && 'share' in navigator

  return (
    <>
      <Navbar />
      <main style={{ maxWidth: '560px', margin: '0 auto', padding: '32px 24px 80px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text)', marginBottom: '8px' }}>
          My Hype Link
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '32px' }}>
          Share your link and earn ₦500 for every ticket sold
        </p>

        {/* Hype link card */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '20px' }}>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: '0 0 8px' }}>Your Hype Link</p>
          <div
            style={{
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              fontSize: '13px',
              color: 'var(--color-brand)',
              background: 'var(--color-surface-2)',
              borderRadius: '8px',
              padding: '10px 12px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {hypeUrl}
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <Button variant="primary" size="sm" onClick={handleCopy}>
              {copied ? 'Copied ✓' : 'Copy Link'}
            </Button>
            {canShare && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  navigator.share({ title: 'My ComfyTag Hype Link', url: hypeUrl })
                }
              >
                Share
              </Button>
            )}
          </div>
        </div>

        {/* Wallet balance card */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '20px', marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: '0 0 4px' }}>Hype Wallet</p>
              <p style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-brand)', margin: 0 }}>
                {formatNaira(wallet?.balance ?? 0)}
              </p>
            </div>
            {/* TODO: wire withdrawal to /profile bank settings */}
            <Button variant="ghost" size="sm" onClick={() => { window.location.href = '/profile/bank' }}>
              Withdraw
            </Button>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: '8px 0 0' }}>
            Withdrawals via your bank account on the profile page. Min. ₦2,000.
          </p>
        </div>

        {/* Transactions */}
        <div style={{ marginTop: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '12px' }}>
            Transaction History
          </h2>

          {isLoading ? (
            <LoadingSpinner size="md" centered />
          ) : !wallet?.transactions.length ? (
            <EmptyState
              title="No transactions yet"
              subtitle="Start sharing your link to earn credits."
            />
          ) : (
            <div style={{ border: '1px solid var(--color-border)', borderRadius: '12px', overflow: 'hidden' }}>
              {wallet.transactions.map((tx) => (
                <div
                  key={tx._id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px 16px',
                    borderBottom: '1px solid var(--color-border)',
                    gap: '12px',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '14px', color: 'var(--color-text)', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {tx.description}
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: 0 }}>
                      {formatDate(tx.createdAt)}
                    </p>
                  </div>
                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      color: tx.type === 'credit' ? 'var(--color-success)' : 'var(--color-error)',
                      flexShrink: 0,
                    }}
                  >
                    {tx.type === 'credit' ? '+' : '−'}{formatNaira(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
