'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Modal } from '@comfytag/ui'
import type { BankAccount } from '@comfytag/types'
import { api } from '@/lib/api'
import { formatNaira } from '@comfytag/utils'

interface RequestPayoutModalProps {
  isOpen: boolean
  onClose: () => void
  banks: BankAccount[]
  userId: string
  token: string
  maxAmount: number
}

export function RequestPayoutModal({
  isOpen,
  onClose,
  banks,
  userId,
  token,
  maxAmount,
}: RequestPayoutModalProps) {
  const queryClient = useQueryClient()
  const [selectedBankId, setSelectedBankId] = useState<string>('')
  const [amount, setAmount] = useState<string>('')
  const [eventName, setEventName] = useState<string>('')

  const { mutate: submitPayout, isPending: isSubmitting } = useMutation({
    mutationFn: async () => {
      const amountNum = parseInt(amount, 10)
      if (isNaN(amountNum) || amountNum <= 0) {
        throw new Error('Invalid amount')
      }
      if (amountNum > maxAmount) {
        throw new Error('Amount exceeds available balance')
      }
      if (!selectedBankId) {
        throw new Error('Please select a bank account')
      }

      const selectedBank = banks.find((b) => b._id === selectedBankId)
      if (!selectedBank) {
        throw new Error('Selected bank not found')
      }

      return api.post<{ success: boolean }>(
        `/partner/withdraw/${userId}`,
        {
          bankId: selectedBankId,
          amount: amountNum,
          eventName: eventName || 'General Earnings',
          bankName: selectedBank.bankName,
          acctName: selectedBank.acctName,
          acctNumber: selectedBank.acctNumber,
        }
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payoutData', userId] })
      setAmount('')
      setSelectedBankId('')
      setEventName('')
      onClose()
    },
  })

  const handleSubmit = () => {
    submitPayout()
  }

  if (!isOpen) return null

  const activeBanks = banks.filter((b) => b.isActive)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Request Payout"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Bank Selection */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label
            htmlFor="bank-select"
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--color-text)',
            }}
          >
            Bank Account
          </label>
          <select
            id="bank-select"
            value={selectedBankId}
            onChange={(e) => setSelectedBankId(e.target.value)}
            style={{
              padding: '8px 12px',
              fontSize: '13px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text)',
              cursor: 'pointer',
            }}
          >
            <option value="">Select a bank account</option>
            {activeBanks.map((bank) => (
              <option key={bank._id} value={bank._id}>
                {bank.bankName} — {bank.acctNumber}
              </option>
            ))}
          </select>
          {activeBanks.length === 0 && (
            <p style={{ fontSize: '12px', color: 'var(--color-error)', margin: 0 }}>
              No active bank accounts. Please add one in Settings.
            </p>
          )}
        </div>

        {/* Event Name (Optional) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label
            htmlFor="event-name"
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--color-text)',
            }}
          >
            Event Name (Optional)
          </label>
          <input
            id="event-name"
            type="text"
            placeholder="e.g., Summer Concert"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            style={{
              padding: '8px 12px',
              fontSize: '13px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text)',
            }}
          />
        </div>

        {/* Amount */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label
            htmlFor="amount"
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--color-text)',
            }}
          >
            Amount (₦)
          </label>
          <input
            id="amount"
            type="number"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            max={maxAmount}
            style={{
              padding: '8px 12px',
              fontSize: '13px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text)',
            }}
          />
          <p
            style={{
              fontSize: '12px',
              color: 'var(--color-text-muted)',
              margin: 0,
            }}
          >
            Available: {formatNaira(maxAmount ?? 0)}
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
          <Button
            variant="ghost"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedBankId || !amount}
          >
            {isSubmitting ? 'Submitting...' : 'Request Payout'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

