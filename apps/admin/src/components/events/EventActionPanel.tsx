'use client'

import { useState } from 'react'
import { Modal, Button, Badge } from '@comfytag/ui'
import type { Event } from '@comfytag/types'
import { useSuspendEvent, useRestoreEvent } from '@/hooks'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface EventActionPanelProps {
  eventId: string
  event: Event
}

// ─── Section wrapper ───────────────────────────────────────────────────────────

function Section({ title, subtitle, children }: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 12,
        padding: 20,
      }}
    >
      <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)', margin: '0 0 4px' }}>
        {title}
      </h2>
      {subtitle && (
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '0 0 16px', lineHeight: 1.5 }}>
          {subtitle}
        </p>
      )}
      {!subtitle && <div style={{ marginBottom: 16 }} />}
      {children}
    </div>
  )
}

// ─── Resolved banner for ended events ─────────────────────────────────────────

function EndedBanner() {
  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 12,
        padding: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <Badge status="ended" />
      <span style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>
        This event has ended. No moderation actions are available.
      </span>
    </div>
  )
}

// ─── EventActionPanel ──────────────────────────────────────────────────────────

export function EventActionPanel({ eventId, event }: EventActionPanelProps) {
  const [suspendOpen, setSuspendOpen]       = useState(false)
  const [suspendReason, setSuspendReason]   = useState('')

  const suspendEvent  = useSuspendEvent()
  const restoreEvent  = useRestoreEvent()

  const isBusy = suspendEvent.isPending || restoreEvent.isPending

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleSuspend() {
    if (!suspendReason.trim()) return
    suspendEvent.mutate(eventId, {
      onSuccess: () => { setSuspendOpen(false); setSuspendReason('') },
    })
  }

  function handleRestore() {
    restoreEvent.mutate(eventId)
  }

  function closeSuspendModal() {
    if (suspendEvent.isPending) return
    setSuspendOpen(false)
    setSuspendReason('')
  }

  // ── Ended — no actions ────────────────────────────────────────────────────

  if (event.status === 'ended') return <EndedBanner />

  // ── Cancelled — restore only ───────────────────────────────────────────────

  if (event.status === 'cancelled') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Section
          title="Moderation Controls"
          subtitle="This event is currently suspended. Restoring will re-publish it and re-enable ticket sales."
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>
                Current status
              </div>
              <Badge status="cancelled" />
            </div>
            <Button
              size="md"
              onClick={handleRestore}
              loading={restoreEvent.isPending}
              disabled={isBusy}
            >
              {restoreEvent.isPending ? 'Restoring…' : 'Restore Event'}
            </Button>
          </div>

          {restoreEvent.isSuccess && (
            <div style={{ marginTop: 14, fontSize: 13, color: 'var(--color-success)' }}>
              Event restored — it is now published.
            </div>
          )}
          {restoreEvent.isError && (
            <div style={{ marginTop: 14, fontSize: 13, color: 'var(--color-error)' }}>
              Restore failed — please try again.
            </div>
          )}
        </Section>
      </div>
    )
  }

  // ── Draft / Published — suspend available ─────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Section
        title="Moderation Controls"
        subtitle="Suspending halts ticket sales and check-in. The event will be hidden from public listings."
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>
              Current status
            </div>
            <Badge status={event.status} />
          </div>
          <Button
            variant="danger"
            size="md"
            onClick={() => setSuspendOpen(true)}
            disabled={isBusy}
          >
            Suspend Event
          </Button>
        </div>

        {suspendEvent.isError && (
          <div style={{ marginTop: 14, fontSize: 13, color: 'var(--color-error)' }}>
            Suspension failed — please try again.
          </div>
        )}
      </Section>

      {/* ─── Suspend confirmation modal ─────────────────────── */}
      <Modal
        isOpen={suspendOpen}
        onClose={closeSuspendModal}
        title="Suspend Event"
        footer={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={closeSuspendModal}
              disabled={suspendEvent.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleSuspend}
              loading={suspendEvent.isPending}
              disabled={!suspendReason.trim() || suspendEvent.isPending}
            >
              {suspendEvent.isPending ? 'Suspending…' : 'Confirm Suspension'}
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
          Suspending{' '}
          <strong style={{ color: 'var(--color-text)' }}>{event.name}</strong>{' '}
          will halt all ticket sales and check-in immediately. Document the reason below
          before confirming.
        </p>
        <label
          htmlFor="suspend-reason"
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
          Suspension Reason *
        </label>
        <textarea
          id="suspend-reason"
          value={suspendReason}
          onChange={(e) => setSuspendReason(e.target.value)}
          placeholder="e.g. Repeated reports of fraudulent ticket listings — under investigation."
          rows={4}
          disabled={suspendEvent.isPending}
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: 8,
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface-2)',
            color: 'var(--color-text)',
            fontSize: 14,
            lineHeight: 1.6,
            resize: 'vertical',
            outline: 'none',
            boxSizing: 'border-box',
            opacity: suspendEvent.isPending ? 0.6 : 1,
          }}
        />
      </Modal>
    </div>
  )
}
