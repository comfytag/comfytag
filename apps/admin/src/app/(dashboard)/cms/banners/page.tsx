'use client'

import { useState } from 'react'
import {
  Badge,
  Button,
  DataTable,
  ErrorMessage,
  Input,
  LoadingSpinner,
  Modal,
  PageHeader,
} from '@comfytag/ui'
import type { ColumnDef } from '@comfytag/ui'
import type { PromoBanner } from '@comfytag/types'
import { Pencil, Trash2 } from 'lucide-react'
import {
  usePromoBanners,
  useCreatePromoBanner,
  useUpdatePromoBanner,
  useDeletePromoBanner,
} from '@/hooks'

// ─── Local types ─────────────────────────────────────────
interface BannerForm {
  bannerKey: string
  title: string
  body: string
  targetPage: string
  targetAudience: string
  isActive: boolean
  startsAt: string
  expiresAt: string
}

const DEFAULT_FORM: BannerForm = {
  bannerKey: '',
  title: '',
  body: '',
  targetPage: '',
  targetAudience: '',
  isActive: true,
  startsAt: '',
  expiresAt: '',
}

// ─── Shared styles ────────────────────────────────────────
const textareaStyle: React.CSSProperties = {
  width: '100%',
  minHeight: '80px',
  padding: '10px 12px',
  borderRadius: '8px',
  border: '1px solid var(--color-border)',
  backgroundColor: 'var(--color-surface)',
  color: 'var(--color-text)',
  fontSize: '14px',
  lineHeight: 1.5,
  resize: 'vertical',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  color: 'var(--color-text-muted)',
  marginBottom: '6px',
}

// ─── Row action button ────────────────────────────────────
function ActionButton({
  onClick,
  disabled,
  title,
  children,
}: {
  onClick: () => void
  disabled?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      title={title}
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
        color: 'var(--color-text-muted)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {children}
    </button>
  )
}

// ─── Column definitions ───────────────────────────────────
function buildColumns(
  onEdit: (b: PromoBanner) => void,
  onDelete: (id: string) => void,
  isDeleting: boolean,
): ColumnDef<PromoBanner>[] {
  return [
    {
      key: 'bannerKey',
      header: 'Key',
      width: '160px',
      render: (b) => (
        <code
          style={{
            fontSize: '12px',
            backgroundColor: 'color-mix(in srgb, var(--color-brand) 12%, transparent)',
            color: 'var(--color-brand)',
            padding: '2px 6px',
            borderRadius: 4,
          }}
        >
          {b.bannerKey}
        </code>
      ),
    },
    {
      key: 'title',
      header: 'Title',
      render: (b) => (
        <span style={{ fontWeight: 500, color: 'var(--color-text)', fontSize: '14px' }}>
          {b.title}
        </span>
      ),
    },
    {
      key: 'targetAudience',
      header: 'Audience',
      width: '140px',
      render: (b) => (
        <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
          {b.targetAudience ?? '—'}
        </span>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      width: '90px',
      render: (b) =>
        b.isActive !== undefined ? (
          <Badge status={b.isActive ? 'approved' : 'rejected'} />
        ) : (
          <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>—</span>
        ),
    },
    {
      key: 'actions',
      header: '',
      width: '72px',
      render: (b) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <ActionButton
            title={b._id ? 'Edit banner' : 'Edit unavailable — no _id returned by GET'}
            disabled={!b._id}
            onClick={() => onEdit(b)}
          >
            <Pencil size={14} />
          </ActionButton>
          <ActionButton
            title={b._id ? 'Delete banner' : 'Delete unavailable — no _id returned by GET'}
            disabled={isDeleting || !b._id}
            onClick={() => b._id && onDelete(b._id)}
          >
            <Trash2 size={14} style={{ color: 'var(--color-error)' }} />
          </ActionButton>
        </div>
      ),
    },
  ]
}

// ─── Page ─────────────────────────────────────────────────
export default function CmsBannersPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<BannerForm>(DEFAULT_FORM)

  const { data: banners, isLoading, isError } = usePromoBanners()
  const createMutation = useCreatePromoBanner()
  const updateMutation = useUpdatePromoBanner()
  const deleteMutation = useDeletePromoBanner()

  function setField<K extends keyof BannerForm>(key: K, value: BannerForm[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function openCreate() {
    setEditingId(null)
    setForm(DEFAULT_FORM)
    setIsModalOpen(true)
  }

  function openEdit(banner: PromoBanner) {
    if (!banner._id) return
    setEditingId(banner._id)
    setForm({
      bannerKey: banner.bannerKey,
      title: banner.title,
      body: banner.body,
      targetPage: banner.targetPage ?? '',
      targetAudience: banner.targetAudience ?? '',
      isActive: banner.isActive,
      startsAt: banner.startsAt ? banner.startsAt.slice(0, 16) : '',
      expiresAt: banner.expiresAt ? banner.expiresAt.slice(0, 16) : '',
    })
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setEditingId(null)
    setForm(DEFAULT_FORM)
  }

  function handleSubmit() {
    if (!form.bannerKey.trim() || !form.title.trim() || !form.body.trim()) return

    const payload = {
      bannerKey: form.bannerKey.trim(),
      title: form.title.trim(),
      body: form.body.trim(),
      isActive: form.isActive,
      ...(form.targetPage.trim()     ? { targetPage:     form.targetPage.trim()     } : {}),
      ...(form.targetAudience.trim() ? { targetAudience: form.targetAudience.trim() } : {}),
      ...(form.startsAt  ? { startsAt:  new Date(form.startsAt).toISOString()  } : {}),
      ...(form.expiresAt ? { expiresAt: new Date(form.expiresAt).toISOString() } : {}),
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, payload }, { onSuccess: closeModal })
    } else {
      createMutation.mutate(payload, { onSuccess: closeModal })
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending
  const isError_  = createMutation.isError    || updateMutation.isError
  const columns   = buildColumns(openEdit, (id) => deleteMutation.mutate(id), deleteMutation.isPending)

  return (
    <div>
      <PageHeader
        title="Promo Banners"
        subtitle="Contextual banners shown on targeted pages of the attendee site"
        action={<Button onClick={openCreate}>+ Add Banner</Button>}
      />

      {isLoading && <LoadingSpinner size="md" centered />}
      {isError   && <ErrorMessage message="Failed to load banners" />}

      {!isLoading && !isError && (
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          <DataTable columns={columns} data={banners ?? []} />
        </div>
      )}

      {/* ── Create / Edit Modal ──────────────────────── */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingId ? 'Edit Banner' : 'New Banner'}
        footer={
          <>
            <Button variant="ghost" onClick={closeModal}>Cancel</Button>
            <Button variant="primary" loading={isPending} onClick={handleSubmit}>
              {editingId ? 'Save changes' : 'Create'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            id="banner-key"
            label="Banner key (unique identifier)"
            value={form.bannerKey}
            onChange={(e) => setField('bannerKey', e.target.value)}
          />
          <Input
            id="banner-title"
            label="Title"
            value={form.title}
            onChange={(e) => setField('title', e.target.value)}
          />

          <div>
            <label htmlFor="banner-body" style={labelStyle}>Body text</label>
            <textarea
              id="banner-body"
              value={form.body}
              onChange={(e) => setField('body', e.target.value)}
              style={textareaStyle}
            />
          </div>

          <Input
            id="banner-target-page"
            label="Target page (optional)"
            value={form.targetPage}
            onChange={(e) => setField('targetPage', e.target.value)}
          />
          <Input
            id="banner-target-audience"
            label="Target audience (optional)"
            value={form.targetAudience}
            onChange={(e) => setField('targetAudience', e.target.value)}
          />

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '14px', color: 'var(--color-text)' }}>
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setField('isActive', e.target.checked)}
            />
            Active
          </label>

          <Input
            id="banner-starts-at"
            label="Starts at (optional)"
            type="datetime-local"
            value={form.startsAt}
            onChange={(e) => setField('startsAt', e.target.value)}
          />
          <Input
            id="banner-expires-at"
            label="Expires at (optional)"
            type="datetime-local"
            value={form.expiresAt}
            onChange={(e) => setField('expiresAt', e.target.value)}
          />

          {isError_ && (
            <p style={{ fontSize: '13px', color: 'var(--color-error)', margin: 0 }}>
              Failed to save banner. Please try again.
            </p>
          )}
        </div>
      </Modal>
    </div>
  )
}
