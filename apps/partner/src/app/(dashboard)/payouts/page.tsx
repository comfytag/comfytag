'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Plus } from 'lucide-react'
import { LoadingSpinner, ErrorMessage } from '@comfytag/ui'
import { VaultBalanceHero } from '@/components/payouts/VaultBalanceHero'
import { ReceiptRoll } from '@/components/payouts/ReceiptRoll'
import { PayoutSheet } from '@/components/payouts/PayoutSheet'
import { useWallet, useWithdrawals, useBankAccount } from '@/hooks'

export default function PayoutsPage() {
  const { data: session } = useSession()
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const userId = session?.user?.id ?? ''

  const {
    data: wallet,
    isLoading: walletLoading,
    isError: walletError,
    refetch: refetchWallet,
  } = useWallet()

  const { data: withdrawals = [] } = useWithdrawals(userId)
  const { data: banks = [] } = useBankAccount(userId)

  if (walletLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <LoadingSpinner centered size="lg" />
      </div>
    )
  }

  if (walletError || !wallet) {
    return (
      <div className="py-8">
        <ErrorMessage
          message="Failed to load wallet data."
          onRetry={() => refetchWallet()}
        />
      </div>
    )
  }

  const pendingAmount = withdrawals
    .filter((w) => w.status === 'pending')
    .reduce((sum, w) => sum + (w.amount ?? 0), 0)
  const availableAmount = (wallet.balance ?? 0) - pendingAmount

  return (
    <>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Vault</h1>
            <p className="mt-1 text-sm text-zinc-500">Your earnings and withdrawal history</p>
          </div>
          <button
            type="button"
            onClick={() => setIsSheetOpen(true)}
            className="flex items-center gap-2 bg-violet-600 text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-violet-700 active:bg-violet-800 transition-colors duration-150 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
          >
            <Plus size={16} aria-hidden="true" />
            Request Payout
          </button>
        </div>

        {/* Balance hero */}
        <VaultBalanceHero
          balance={wallet.balance}
          available={availableAmount}
          pending={pendingAmount}
        />

        {/* Receipt roll — merged ledger of earnings + withdrawals */}
        <ReceiptRoll
          transactions={wallet.transactions ?? []}
          withdrawals={withdrawals}
        />
      </div>

      {/* Payout sheet */}
      <PayoutSheet
        open={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        banks={banks}
        userId={userId}
        token={session?.user?.token ?? ''}
        maxAmount={availableAmount}
      />
    </>
  )
}
