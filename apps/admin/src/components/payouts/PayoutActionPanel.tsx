'use client'

import { useState } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'
import { Modal, Button, Badge } from '@comfytag/ui'
import type { WithdrawRequest } from '@comfytag/types'
import { useProcessPayout, useRejectPayout } from '@/hooks'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface PayoutActionPanelProps {
  withdrawId: string
  withdraw: WithdrawRequest
}

// ─── Section wrapper ───────────────────────────────────────────────────────────

function Section({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 20,
      }}
    >
      {children}
    </div>
  )
}

// ─── Resolved banner (shown when payout is already processed/rejected) ─────────

const RESOLVED_COPY: Record<Exclude<WithdrawRequest['status'], 'pending'>, string> = {
  approved: 'Payout Processed',
  sent: 'Payout Sent',
  processing: 'Transfer In Progress',
  failed: 'Transfer Failed',
  rejected: 'Payout Rejected',
}

function ResolvedBanner({ withdraw }: { withdraw: WithdrawRequest }) {
  const { status, failureReason } = withdraw
  const isGood = status === 'sent' || status === 'approved' || status === 'processing'
  return (
    <Section>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {isGood ? (
          <CheckCircle size={22} color="var(--color-success)" />
        ) : (
          <XCircle size={22} color="var(--color-error)" />
        )}
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)', marginBottom: 4 }}>
            {status === 'pending' ? 'Payout Pending' : RESOLVED_COPY[status]}
          </div>
          <Badge status={status} />
          {status === 'failed' && failureReason && (
            <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 6 }}>
              {failureReason}
            </div>
          )}
        </div>
      </div>
    </Section>
  )
}

// ─── PayoutActionPanel ─────────────────────────────────────────────────────────

export function PayoutActionPanel({ withdrawId, withdraw }: PayoutActionPanelProps) {
  // Process modal
  const [processOpen, setProcessOpen] = useState(false)

  // Reject modal
  const [rejectOpen, setRejectOpen]       = useState(false)
  const [rejectReason, setRejectReason]   = useState('')

  const processPayout = useProcessPayout()
  const rejectPayout  = useRejectPayout()

  // Both buttons completely disabled while either mutation is in-flight
  const isBusy = processPayout.isPending || rejectPayout.isPending

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleProcess() {
    processPayout.mutate(
      { withdrawId },
      { onSuccess: () => { setProcessOpen(false) } },
    )
  }

  function handleReject() {
    if (!rejectReason.trim()) return
    rejectPayout.mutate(
      { withdrawId, reason: rejectReason.trim() },
      { onSuccess: () => { setRejectOpen(false); setRejectReason('') } },
    )
  }

  function closeProcessModal() {
    if (processPayout.isPending) return
    setProcessOpen(false)
  }

  function closeRejectModal() {
    if (rejectPayout.isPending) return
    setRejectOpen(false)
    setRejectReason('')
  }

  // ── Already resolved ───────────────────────────────────────────────────────

  if (withdraw.status !== 'pending') {
    return <ResolvedBanner withdraw={withdraw} />
  }

  // ── Pending — show action buttons ─────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Section>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)', margin: '0 0 6px' }}>
          Finance Actions
        </h2>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '0 0 20px', lineHeight: 1.5 }}>
          Verify the bank details above before sending. Both actions are irreversible once confirmed.
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Button
            size="md"
            onClick={() => setProcessOpen(true)}
            disabled={isBusy}
          >
            Send Payout
          </Button>

          <Button
            variant="danger"
            size="md"
            onClick={() => setRejectOpen(true)}
            disabled={isBusy}
          >
            Reject Payout
          </Button>
        </div>

        {/* Inline feedback */}
        {processPayout.isError && (
          <div style={{ marginTop: 14, fontSize: 13, color: 'var(--color-error)' }}>
            Could not initiate the transfer — please try again.
          </div>
        )}
        {rejectPayout.isError && (
          <div style={{ marginTop: 14, fontSize: 13, color: 'var(--color-error)' }}>
            Rejection failed — please try again.
          </div>
        )}
      </Section>

      {/* ─── Process confirmation modal ─────────────────────── */}
      <Modal
        isOpen={processOpen}
        onClose={closeProcessModal}
        title="Send Payout"
        footer={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={closeProcessModal}
              disabled={processPayout.isPending}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleProcess}
              loading={processPayout.isPending}
              disabled={processPayout.isPending}
            >
              {processPayout.isPending ? 'Sending…' : 'Confirm & Send'}
            </Button>
          </>
        }
      >
        <p
          style={{
            fontSize: 14,
            color: 'var(--color-text-muted)',
            marginTop: 0,
            marginBottom: 0,
            lineHeight: 1.6,
          }}
        >
          This initiates a real bank transfer via Paystack — the amount moves out of the
          platform balance immediately. The status will show as "Processing" until Paystack
          confirms the transfer, at which point the organizer is notified automatically.
        </p>
      </Modal>

      {/* ─── Reject confirmation modal ──────────────────────── */}
      <Modal
        isOpen={rejectOpen}
        onClose={closeRejectModal}
        title="Reject Payout Request"
        footer={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={closeRejectModal}
              disabled={rejectPayout.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleReject}
              loading={rejectPayout.isPending}
              disabled={!rejectReason.trim() || rejectPayout.isPending}
            >
              {rejectPayout.isPending ? 'Rejecting…' : 'Confirm Rejection'}
            </Button>
          </>
        }
      >
        <p
          style={{
            fontSize: 14,
            color: 'var(--color-text-muted)',
            marginTop: 0,
            marginBottom: 16,
            lineHeight: 1.6,
          }}
        >
          Provide a clear reason. The organizer will receive an email explaining why
          their withdrawal failed and what action to take.
        </p>
        <label
          htmlFor="payout-reject-reason"
          style={{
            display: 'block',
            fontSize: 12,
            fontWeight: 500,
            color: 'var(--color-text-muted)',
            marginBottom: 6,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Rejection Reason *
        </label>
        <textarea
          id="payout-reject-reason"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="e.g. Invalid bank account number — please update your bank details and resubmit."
          rows={4}
          disabled={rejectPayout.isPending}
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface-2)',
            color: 'var(--color-text)',
            fontSize: 14,
            lineHeight: 1.6,
            resize: 'vertical',
            outline: 'none',
            boxSizing: 'border-box',
            opacity: rejectPayout.isPending ? 0.6 : 1,
          }}
        />
      </Modal>
    </div>
  )
}
