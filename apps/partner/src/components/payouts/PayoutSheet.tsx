'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { BankAccount } from '@comfytag/types'
import { Sheet } from '@/components/ui/Sheet'
import { api } from '@/lib/api'
import { formatNaira } from '@comfytag/utils'

interface PayoutSheetProps {
  open: boolean
  onClose: () => void
  banks: BankAccount[]
  userId: string
  token: string
  maxAmount: number
}

export function PayoutSheet({
  open,
  onClose,
  banks,
  userId,
  token,
  maxAmount,
}: PayoutSheetProps) {
  const queryClient = useQueryClient()
  const [selectedBankId, setSelectedBankId] = useState('')
  const [amount, setAmount] = useState('')
  const [eventName, setEventName] = useState('')

  const { mutate: submitPayout, isPending, error, reset } = useMutation({
    mutationFn: async () => {
      const amountNum = parseInt(amount, 10)
      if (isNaN(amountNum) || amountNum <= 0) throw new Error('Enter a valid amount')
      if (amountNum > maxAmount) throw new Error('Amount exceeds available balance')
      if (!selectedBankId) throw new Error('Select a bank account')
      const selectedBank = banks.find((b) => b._id === selectedBankId)
      if (!selectedBank) throw new Error('Bank account not found')

      return api.post<{ success: boolean }>(`/partner/withdraw/${userId}`, {
        bankId: selectedBankId,
        amount: amountNum,
        eventName: eventName.trim() || 'General Earnings',
        bankName: selectedBank.bankName,
        acctName: selectedBank.acctName,
        acctNumber: selectedBank.acctNumber,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payoutData', userId] })
      setAmount('')
      setSelectedBankId('')
      setEventName('')
      reset()
      onClose()
    },
  })

  const amountNum = parseInt(amount, 10)
  const isAmountValid = !isNaN(amountNum) && amountNum > 0 && amountNum <= maxAmount
  const isValid = isAmountValid && !!selectedBankId && !isPending
  const fillPct = maxAmount > 0 && isAmountValid ? Math.min((amountNum / maxAmount) * 100, 100) : 0

  function handleClose() {
    if (!isPending) {
      reset()
      onClose()
    }
  }

  return (
    <Sheet open={open} onClose={handleClose} title="Request Payout">
      <div className="flex flex-col gap-6">
        {/* Available balance — mini hero */}
        <div className="bg-zinc-950 rounded-2xl p-5 text-center">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">
            Available Balance
          </p>
          <p className="text-3xl font-black text-amber-400">{formatNaira(maxAmount)}</p>
          {/* Fill progress — shows how much of balance is being requested */}
          <div className="mt-4 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-300"
              style={{ width: `${fillPct}%` }}
            />
          </div>
          {fillPct > 0 && (
            <p className="text-[10px] text-zinc-600 mt-1.5">
              Requesting {fillPct.toFixed(0)}% of balance
            </p>
          )}
        </div>

        {/* Amount — prominent hero input */}
        <div>
          <label
            htmlFor="payout-amount"
            className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2"
          >
            Withdrawal Amount
          </label>
          <div className="relative">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl font-black text-zinc-600 pointer-events-none select-none">
              ₦
            </span>
            <input
              id="payout-amount"
              type="number"
              inputMode="numeric"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={1}
              max={maxAmount}
              className="w-full bg-(--color-surface) border-2 border-(--color-border) focus:border-violet-500 rounded-2xl pl-12 pr-5 py-4 text-3xl font-black text-(--color-text) placeholder:text-zinc-700 focus:outline-none transition-colors"
            />
          </div>
          {!isNaN(amountNum) && amountNum > maxAmount && (
            <p className="text-xs text-red-500 mt-1.5 font-medium">
              Exceeds available balance of {formatNaira(maxAmount)}
            </p>
          )}
        </div>

        {/* Bank account selector */}
        <div>
          <label
            htmlFor="payout-bank"
            className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2"
          >
            Destination Account
          </label>
          {banks.length === 0 ? (
            <div className="bg-amber-950/40 border border-amber-900/50 rounded-xl px-4 py-3">
              <p className="text-sm text-amber-400 font-medium">
                No active bank accounts. Add one in Settings.
              </p>
            </div>
          ) : (
            <div className="relative">
              <select
                id="payout-bank"
                value={selectedBankId}
                onChange={(e) => setSelectedBankId(e.target.value)}
                className="w-full appearance-none bg-(--color-surface) border-2 border-(--color-border) focus:border-violet-500 rounded-xl px-4 py-3 pr-10 text-sm font-medium text-(--color-text) focus:outline-none transition-colors cursor-pointer"
              >
                <option value="">Choose bank account…</option>
                {banks.map((bank) => (
                  <option key={bank._id} value={bank._id}>
                    {bank.bankName} — {bank.acctNumber} ({bank.acctName})
                  </option>
                ))}
              </select>
              {/* Chevron */}
              <svg
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </div>
          )}
        </div>

        {/* Reference / event name (optional) */}
        <div>
          <label
            htmlFor="payout-event"
            className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2"
          >
            Reference{' '}
            <span className="normal-case font-normal text-zinc-400">(optional)</span>
          </label>
          <input
            id="payout-event"
            type="text"
            placeholder="e.g., Night Market Vol. 3"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            className="w-full bg-(--color-surface) border-2 border-(--color-border) focus:border-violet-500 rounded-xl px-4 py-3 text-sm text-(--color-text) placeholder:text-zinc-500 focus:outline-none transition-colors"
          />
        </div>

        {/* Mutation error */}
        {error instanceof Error && (
          <div className="bg-red-950/40 border border-red-900/50 rounded-xl px-4 py-3">
            <p className="text-sm text-red-400 font-medium">{error.message}</p>
          </div>
        )}

        {/* CTA */}
        <button
          type="button"
          onClick={() => submitPayout()}
          disabled={!isValid}
          className="w-full bg-violet-600 text-white text-sm font-bold py-4 rounded-2xl hover:bg-violet-700 active:bg-violet-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
        >
          {isPending
            ? 'Processing…'
            : isAmountValid
              ? `Request ${formatNaira(amountNum)} Payout`
              : 'Request Payout'}
        </button>
      </div>
    </Sheet>
  )
}
