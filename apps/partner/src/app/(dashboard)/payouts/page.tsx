'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { PageHeader, LoadingSpinner, ErrorMessage, EmptyState } from '@comfytag/ui'
import { Button } from '@comfytag/ui'
import type { BankAccount, WithdrawRequest } from '@comfytag/types'
import { WalletBalanceCard } from '@/components/payouts/WalletBalanceCard'
import { EarningsTimeline } from '@/components/payouts/EarningsTimeline'
import { WithdrawalRow } from '@/components/payouts/WithdrawalRow'
import { RequestPayoutModal } from '@/components/payouts/RequestPayoutModal'
import { useWallet, useWithdrawals, useBankAccount } from '@/hooks'

export default function PayoutsPage() {
  const { data: session } = useSession()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const userId = session?.user?.id

  // Fetch wallet data
  const { data: wallet, isLoading: walletLoading, isError: walletError, refetch: refetchWallet } = useWallet()

  // Fetch withdrawal history
  const { data: withdrawals = [], isLoading: withdrawalsLoading, refetch: refetchWithdrawals } = useWithdrawals(userId || '')

  // Fetch banks
  const { data: banks = [], refetch: refetchBanks } = useBankAccount(userId || '')

  if (walletLoading) {
    return (
      <div>
        <div style={{ padding: '32px 24px', textAlign: 'center' }}>
          <LoadingSpinner centered size="lg" />
        </div>
      </div>
    )
  }

  if (walletError || !wallet) {
    return (
      <div style={{ padding: '32px 24px' }}>
        <ErrorMessage
          message="Failed to load wallet data."
          onRetry={() => refetchWallet()}
        />
      </div>
    )
  }

  const withdrawalsList = withdrawals ?? []

  // Derive available and pending from wallet balance and pending withdrawals
  const pendingAmount = withdrawals
    ?.filter(w => w.status === 'pending')
    .reduce((sum, w) => sum + w.amount, 0) ?? 0
  const availableAmount = (wallet?.balance ?? 0) - pendingAmount

  return (
    <>
      <main style={{ flex: 1, padding: '32px 24px' }}>
        {/* Max-width container */}
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          {/* Page Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '32px',
              gap: '16px',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <PageHeader
                title="Payouts"
                subtitle="Manage your earnings and request withdrawals"
              />
            </div>
            <Button
              onClick={() => setIsModalOpen(true)}
            >
              Request Payout
            </Button>
          </div>

          {/* Wallet Balance Card */}
          <div style={{ marginBottom: '40px' }}>
            <WalletBalanceCard
              balance={wallet.balance}
              available={availableAmount}
              pending={pendingAmount}
            />
          </div>

          {/* Two Column Grid: Earnings Timeline + Withdrawal History */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '32px',
              marginBottom: '40px',
            }}
          >
            {/* Earnings Timeline */}
            <EarningsTimeline transactions={wallet.transactions || []} />

            {/* Withdrawal History Table */}
            <div
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  padding: '16px 20px 12px',
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: '16px',
                    fontWeight: 700,
                    color: 'var(--color-text)',
                    lineHeight: '1.3',
                  }}
                >
                  Withdrawal History
                </h3>
                <p
                  style={{
                    margin: '4px 0 0',
                    fontSize: '13px',
                    color: 'var(--color-text-muted)',
                    lineHeight: '1.4',
                  }}
                >
                  Your recent withdrawal requests
                </p>
              </div>

              {withdrawalsList.length === 0 ? (
                <div style={{ padding: '32px 20px' }}>
                  <EmptyState
                    title="No withdrawals yet"
                    subtitle="Request your first payout to get started"
                  />
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                    }}
                  >
                    <thead>
                      <tr>
                        <th
                          style={{
                            padding: '12px 16px',
                            textAlign: 'left',
                            fontSize: '12px',
                            fontWeight: 700,
                            color: 'var(--color-text-muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.02em',
                            borderBottom: '1px solid var(--color-border)',
                            backgroundColor: 'var(--color-bg)',
                          }}
                        >
                          Event
                        </th>
                        <th
                          style={{
                            padding: '12px 16px',
                            textAlign: 'left',
                            fontSize: '12px',
                            fontWeight: 700,
                            color: 'var(--color-text-muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.02em',
                            borderBottom: '1px solid var(--color-border)',
                            backgroundColor: 'var(--color-bg)',
                          }}
                        >
                          Amount
                        </th>
                        <th
                          style={{
                            padding: '12px 16px',
                            textAlign: 'left',
                            fontSize: '12px',
                            fontWeight: 700,
                            color: 'var(--color-text-muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.02em',
                            borderBottom: '1px solid var(--color-border)',
                            backgroundColor: 'var(--color-bg)',
                          }}
                        >
                          Recipient
                        </th>
                        <th
                          style={{
                            padding: '12px 16px',
                            textAlign: 'left',
                            fontSize: '12px',
                            fontWeight: 700,
                            color: 'var(--color-text-muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.02em',
                            borderBottom: '1px solid var(--color-border)',
                            backgroundColor: 'var(--color-bg)',
                          }}
                        >
                          Bank
                        </th>
                        <th
                          style={{
                            padding: '12px 16px',
                            textAlign: 'left',
                            fontSize: '12px',
                            fontWeight: 700,
                            color: 'var(--color-text-muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.02em',
                            borderBottom: '1px solid var(--color-border)',
                            backgroundColor: 'var(--color-bg)',
                          }}
                        >
                          Status
                        </th>
                        <th
                          style={{
                            padding: '12px 16px',
                            textAlign: 'left',
                            fontSize: '12px',
                            fontWeight: 700,
                            color: 'var(--color-text-muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.02em',
                            borderBottom: '1px solid var(--color-border)',
                            backgroundColor: 'var(--color-bg)',
                          }}
                        >
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {withdrawalsLoading ? (
                        <tr>
                          <td colSpan={6} style={{ padding: '16px', textAlign: 'center' }}>
                            <LoadingSpinner size="sm" />
                          </td>
                        </tr>
                      ) : (
                        withdrawalsList.map((withdrawal) => (
                          <WithdrawalRow key={withdrawal._id} withdrawal={withdrawal} />
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Payout Modal */}
      <RequestPayoutModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        banks={banks || []}
        userId={userId || ''}
        token={session?.user?.token || ''}
        maxAmount={availableAmount}
      />
    </>
  )
}

