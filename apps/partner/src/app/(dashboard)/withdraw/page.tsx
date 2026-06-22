'use client'

import React, { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Wallet } from 'lucide-react'
import { Badge, Button, Input, Modal, LoadingSpinner, ErrorMessage, DataTable, ColumnDef, PageHeader } from '@comfytag/ui'
import { formatNaira, formatDate } from '@comfytag/utils'
import type { WithdrawRequest } from '@comfytag/types'
import { useWithdrawals, useBankAccount, useMyEvents, usePartnerRevenue, useRequestPayout } from '@/hooks'

const withdrawColumns: ColumnDef<WithdrawRequest>[] = [
  {
    key: 'createdAt',
    header: 'Date',
    render: (row) => formatDate(String(row.createdAt ?? '')),
  },
  {
    key: 'eventName',
    header: 'Event',
    render: (row) => (
      <span style={{ fontWeight: 500, color: 'var(--color-text)' }}>{row.eventName}</span>
    ),
  },
  {
    key: 'amount',
    header: 'Amount',
    render: (row) => (
      <span style={{ color: 'var(--color-gold)', fontWeight: 600 }}>
        {formatNaira((row.amount as number) ?? 0)}
      </span>
    ),
  },
  {
    key: 'bankName',
    header: 'Bank',
    render: (row) => (
      <span style={{ fontSize: '13px' }}>
        {row.acctName}
        <br />
        <span style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>
          {row.bankName} · {row.acctNumber}
        </span>
      </span>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (row) => {
      const s = String(row.status ?? '')
      const statusMap: Record<string, string> = {
        'pending': 'pending',
        'approved': 'approved',
        'rejected': 'rejected',
        'sent': 'approved',
      }
      const mapped = statusMap[s] || s
      return <Badge status={mapped} />
    },
  },
]

export default function WithdrawPage() {
  const { data: session, status: sessionStatus } = useSession()
  // PD-1: userId is always derived from the authenticated session — never from URL params or props
  const userId = session?.user?.id
  const token = session?.user?.token

  const [modal, setModal] = useState(false)
  const [selectedBankId, setSelectedBankId] = useState('')
  const [amount, setAmount] = useState('')
  const [selectedEventId, setSelectedEventId] = useState('')
  const [formError, setFormError] = useState('')

  const requestsQuery = useWithdrawals(sessionStatus === 'authenticated' ? (userId ?? '') : '')
  const banksQuery = useBankAccount(sessionStatus === 'authenticated' ? (userId ?? '') : '')
  const eventsQuery = useMyEvents()
  const revenueQuery = usePartnerRevenue()
  const withdrawMutation = useRequestPayout()

  function handleSubmit() {
    const banks = banksQuery.data ?? []
    const events = eventsQuery.data ?? []
    const selectedBank = banks.find((b) => b._id === selectedBankId)
    const selectedEvent = events.find((e) => e._id === selectedEventId)

    if (!selectedBank) { setFormError('Select a bank account'); return }
    if (!selectedEvent) { setFormError('Select an event'); return }

    const numAmount = Number(amount)
    if (!numAmount || numAmount <= 0) { setFormError('Enter a valid amount'); return }

    setFormError('')
    withdrawMutation.mutate({
      bankAccountId: selectedBank._id,
      amount: numAmount,
    }, {
      onSuccess: () => {
        setModal(false)
        setSelectedBankId('')
        setAmount('')
        setSelectedEventId('')
        setFormError('')
      },
      onError: () => {
        setFormError('Failed to submit request. Please try again.')
      },
    })
  }

  const requests = requestsQuery.data ?? []
  const banks = banksQuery.data ?? []
  const events = eventsQuery.data ?? []
  const availableBalance = typeof revenueQuery.data?.availableBalance === 'number' ? revenueQuery.data.availableBalance : 0

  function closeModal() {
    setModal(false)
    setFormError('')
    setSelectedBankId('')
    setAmount('')
    setSelectedEventId('')
  }

  return (
    <div style={{ padding: '28px 32px' }}>
      <PageHeader
        title="Withdraw"
        subtitle="Request a payout to your bank account"
        action={
          <Button variant="primary" onClick={() => setModal(true)}>
            New Request
          </Button>
        }
      />

      {revenueQuery.isLoading ? null : (
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 12,
            padding: '20px',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            <span style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
              Available Balance:
            </span>
            <span style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-gold)' }}>
              {formatNaira(availableBalance)}
            </span>
          </div>
        </div>
      )}

      {requestsQuery.isError && (
        <div style={{ marginBottom: '20px' }}>
          <ErrorMessage message="Failed to load withdrawal requests." />
        </div>
      )}

      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        <DataTable
          columns={withdrawColumns}
          data={requests}
          isLoading={requestsQuery.isLoading}
          keyField="_id"
          emptyTitle="No withdrawal requests yet"
          emptySubtitle="Submit your first request to get paid"
        />
      </div>

      <Modal
        isOpen={modal}
        onClose={closeModal}
        title="Request Withdrawal"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={withdrawMutation.isPending}
              onClick={handleSubmit}
            >
              Submit Request
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 500,
                color: 'var(--color-text)',
                marginBottom: '6px',
              }}
            >
              Bank Account
            </label>
            {banksQuery.isLoading ? (
              <LoadingSpinner size="sm" />
            ) : banks.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                No bank accounts found.{' '}
                <a href="/settings" style={{ color: 'var(--color-brand)' }}>
                  Add one in Settings
                </a>
                .
              </p>
            ) : (
              <select
                value={selectedBankId}
                onChange={(e) => setSelectedBankId(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  appearance: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="">Select a bank account</option>
                {banks.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.bankName} â€” {b.acctName} ({b.acctNumber})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 500,
                color: 'var(--color-text)',
                marginBottom: '6px',
              }}
            >
              Event
            </label>
            {eventsQuery.isLoading ? (
              <LoadingSpinner size="sm" />
            ) : events.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                No events found. Create an event first.
              </p>
            ) : (
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  appearance: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="">Select an event</option>
                {events.map((e) => (
                  <option key={e._id} value={e._id}>
                    {e.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <Input
            label="Amount (₦)"
            type="number"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          {formError && <ErrorMessage message={formError} />}
        </div>
      </Modal>
    </div>
  )
}

