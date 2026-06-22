'use client'

import { useState } from 'react'
import {
  Button,
  DataTable,
  ErrorMessage,
  Input,
  LoadingSpinner,
  Modal,
  PageHeader,
} from '@comfytag/ui'
import type { ColumnDef } from '@comfytag/ui'
import type { MarqueeItem } from '@comfytag/types'
import { Trash2 } from 'lucide-react'
import {
  useMarquee,
  useCreateMarqueeItem,
  useDeleteMarqueeItem,
} from '@/hooks'

// ─── Local types ─────────────────────────────────────────
interface MarqueeForm {
  text: string
  dotColor: 'red' | 'violet'
  pulse: boolean
  sortOrder: string
  startsAt: string
  expiresAt: string
}

const DEFAULT_FORM: MarqueeForm = {
  text: '',
  dotColor: 'violet',
  pulse: false,
  sortOrder: '0',
  startsAt: '',
  expiresAt: '',
}

// ─── Sub-components ───────────────────────────────────────
function DotIndicator({ color, pulse }: { color: 'red' | 'violet'; pulse: boolean }) {
  return (
    <span
      title={`${color}${pulse ? ' · pulsing' : ''}`}
      style={{
        display: 'inline-block',
        width: 10,
        height: 10,
        borderRadius: '50%',
        flexShrink: 0,
        backgroundColor: color === 'red' ? 'var(--color-error)' : 'var(--color-brand)',
        boxShadow: pulse
          ? `0 0 0 3px color-mix(in srgb, ${color === 'red' ? 'var(--color-error)' : 'var(--color-brand)'} 25%, transparent)`
          : 'none',
      }}
    />
  )
}

function DeleteButton({
  onClick,
  disabled,
}: {
  onClick: () => void
  disabled: boolean
}) {
  return (
    <button
      title="Delete"
      disabled={disabled}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 28,
        height: 28,
        borderRadius: 6,
        border: '1px solid var(--color-border)',
        backgroundColor: 'transparent',
        color: 'var(--color-error)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <Trash2 size={14} />
    </button>
  )
}

// ─── Column definitions (module-level, stable reference) ──
function buildColumns(
  onDelete: (id: string) => void,
  isDeleting: boolean,
): ColumnDef<MarqueeItem>[] {
  return [
    {
      key: 'text',
      header: 'Text',
      render: (item) => (
        <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text)' }}>
          {item.text}
        </span>
      ),
    },
    {
      key: 'dotColor',
      header: 'Dot',
      width: '70px',
      render: (item) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <DotIndicator color={item.dotColor} pulse={item.pulse} />
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>
            {item.dotColor}
          </span>
        </div>
      ),
    },
    {
      key: 'pulse',
      header: 'Pulse',
      width: '70px',
      render: (item) => (
        <span
          style={{
            fontSize: '13px',
            color: item.pulse ? 'var(--color-success)' : 'var(--color-text-muted)',
          }}
        >
          {item.pulse ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      key: 'startsAt',
      header: 'Starts',
      width: '130px',
      render: (item) => (
        <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
          {item.startsAt
            ? new Date(item.startsAt).toLocaleDateString('en-NG', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })
            : '—'}
        </span>
      ),
    },
    {
      key: 'expiresAt',
      header: 'Expires',
      width: '130px',
      render: (item) => (
        <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
          {item.expiresAt
            ? new Date(item.expiresAt).toLocaleDateString('en-NG', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })
            : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '56px',
      render: (item) => (
        <DeleteButton
          disabled={isDeleting || !item._id}
          onClick={() => { if (item._id) onDelete(item._id) }}
        />
      ),
    },
  ]
}

// ─── Page ─────────────────────────────────────────────────
export default function CmsMarqueePage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [form, setForm] = useState<MarqueeForm>(DEFAULT_FORM)

  const { data: items, isLoading, isError } = useMarquee()
  const createMutation  = useCreateMarqueeItem()
  const deleteMutation  = useDeleteMarqueeItem()

  function setField<K extends keyof MarqueeForm>(key: K, value: MarqueeForm[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function handleCreate() {
    if (!form.text.trim()) return
    createMutation.mutate(
      {
        text:      form.text.trim(),
        dotColor:  form.dotColor,
        pulse:     form.pulse,
        sortOrder: Number(form.sortOrder) || 0,
        ...(form.startsAt  ? { startsAt:  new Date(form.startsAt).toISOString()  } : {}),
        ...(form.expiresAt ? { expiresAt: new Date(form.expiresAt).toISOString() } : {}),
      },
      {
        onSuccess: () => {
          setIsCreateOpen(false)
          setForm(DEFAULT_FORM)
        },
      },
    )
  }

  function handleDelete(id: string) {
    deleteMutation.mutate(id)
  }

  function closeCreate() {
    setIsCreateOpen(false)
    setForm(DEFAULT_FORM)
  }

  const columns = buildColumns(handleDelete, deleteMutation.isPending)

  return (
    <div>
      <PageHeader
        title="Marquee Strip"
        subtitle="Announcements that scroll across the top of the attendee site"
        action={
          <Button onClick={() => setIsCreateOpen(true)}>+ Add Item</Button>
        }
      />

      {isLoading && <LoadingSpinner size="md" centered />}
      {isError   && <ErrorMessage message="Failed to load marquee items" />}

      {!isLoading && !isError && (
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          <DataTable columns={columns} data={items ?? []} />
        </div>
      )}

      {/* ── Create Item Dialog ───────────────────────── */}
      <Modal
        isOpen={isCreateOpen}
        onClose={closeCreate}
        title="New Marquee Item"
        footer={
          <>
            <Button variant="ghost" onClick={closeCreate}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={createMutation.isPending}
              onClick={handleCreate}
            >
              Create
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            id="marquee-text"
            label="Announcement text"
            value={form.text}
            onChange={(e) => setField('text', e.target.value)}
          />

          {/* Dot colour picker */}
          <div>
            <p
              style={{
                fontSize: '13px',
                color: 'var(--color-text-muted)',
                marginBottom: '8px',
              }}
            >
              Dot colour
            </p>
            <div style={{ display: 'flex', gap: '16px' }}>
              {(['violet', 'red'] as const).map((c) => (
                <label
                  key={c}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: 'var(--color-text)',
                  }}
                >
                  <input
                    type="radio"
                    name="dotColor"
                    value={c}
                    checked={form.dotColor === c}
                    onChange={() => setField('dotColor', c)}
                  />
                  <DotIndicator color={c} pulse={false} />
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </label>
              ))}
            </div>
          </div>

          {/* Pulse toggle */}
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              fontSize: '14px',
              color: 'var(--color-text)',
            }}
          >
            <input
              type="checkbox"
              checked={form.pulse}
              onChange={(e) => setField('pulse', e.target.checked)}
            />
            Animate dot (pulse)
          </label>

          <Input
            id="marquee-starts-at"
            label="Starts at (optional)"
            type="datetime-local"
            value={form.startsAt}
            onChange={(e) => setField('startsAt', e.target.value)}
          />

          <Input
            id="marquee-expires-at"
            label="Expires at (optional)"
            type="datetime-local"
            value={form.expiresAt}
            onChange={(e) => setField('expiresAt', e.target.value)}
          />

          <Input
            id="marquee-sort-order"
            label="Sort order"
            type="number"
            value={form.sortOrder}
            onChange={(e) => setField('sortOrder', e.target.value)}
          />

          {createMutation.isError && (
            <p style={{ fontSize: '13px', color: 'var(--color-error)', margin: 0 }}>
              Failed to create marquee item. Please try again.
            </p>
          )}
        </div>
      </Modal>
    </div>
  )
}
