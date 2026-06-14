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
import type { HowItWorksStep } from '@comfytag/types'
import { Pencil, Trash2 } from 'lucide-react'
import {
  useHowItWorks,
  useCreateHowItWorksStep,
  useUpdateHowItWorksStep,
  useDeleteHowItWorksStep,
} from '@/hooks'

// ─── Local types ─────────────────────────────────────────
interface StepForm {
  stepNumber: string
  title: string
  description: string
  iconType: string
  isComingSoon: boolean
  isActive: boolean
  sortOrder: string
}

const DEFAULT_FORM: StepForm = {
  stepNumber: '1',
  title: '',
  description: '',
  iconType: '',
  isComingSoon: false,
  isActive: true,
  sortOrder: '0',
}

// ─── Shared styles ────────────────────────────────────────
const textareaStyle: React.CSSProperties = {
  width: '100%',
  minHeight: '72px',
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

// ─── Toggle switch ────────────────────────────────────────
function ToggleSwitch({
  id,
  label,
  checked,
  onChange,
}: {
  id: string
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label
      htmlFor={id}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      {/* Track */}
      <span
        style={{
          position: 'relative',
          display: 'inline-block',
          width: 36,
          height: 20,
          borderRadius: 10,
          backgroundColor: checked
            ? 'var(--color-brand)'
            : 'var(--color-border)',
          transition: 'background-color 0.2s',
          flexShrink: 0,
        }}
      >
        {/* Thumb */}
        <span
          style={{
            position: 'absolute',
            top: 2,
            left: checked ? 18 : 2,
            width: 16,
            height: 16,
            borderRadius: '50%',
            backgroundColor: '#fff',
            transition: 'left 0.2s',
          }}
        />
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
        />
      </span>
      <span style={{ fontSize: '14px', color: 'var(--color-text)' }}>{label}</span>
    </label>
  )
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
  onEdit: (s: HowItWorksStep) => void,
  onDelete: (id: string) => void,
  isDeleting: boolean,
): ColumnDef<HowItWorksStep>[] {
  return [
    {
      key: 'stepNumber',
      header: '#',
      width: '52px',
      render: (s) => (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            borderRadius: '50%',
            backgroundColor: 'color-mix(in srgb, var(--color-brand) 15%, transparent)',
            color: 'var(--color-brand)',
            fontSize: '13px',
            fontWeight: 700,
          }}
        >
          {s.stepNumber}
        </span>
      ),
    },
    {
      key: 'title',
      header: 'Title',
      render: (s) => (
        <span style={{ fontWeight: 500, color: 'var(--color-text)', fontSize: '14px' }}>
          {s.title}
        </span>
      ),
    },
    {
      key: 'iconType',
      header: 'Icon',
      width: '110px',
      render: (s) => (
        <code
          style={{
            fontSize: '12px',
            backgroundColor: 'var(--color-surface-2, color-mix(in srgb, var(--color-border) 40%, transparent))',
            color: 'var(--color-text-muted)',
            padding: '2px 6px',
            borderRadius: 4,
          }}
        >
          {s.iconType}
        </code>
      ),
    },
    {
      key: 'isComingSoon',
      header: 'Coming soon',
      width: '110px',
      render: (s) => (
        <span
          style={{
            fontSize: '13px',
            color: s.isComingSoon ? 'var(--color-brand)' : 'var(--color-text-muted)',
          }}
        >
          {s.isComingSoon ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      width: '90px',
      render: (s) =>
        s.isActive !== undefined ? (
          <Badge status={s.isActive ? 'approved' : 'rejected'} />
        ) : (
          <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>—</span>
        ),
    },
    {
      key: 'actions',
      header: '',
      width: '72px',
      render: (s) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <ActionButton
            title={s._id ? 'Edit step' : 'Edit unavailable — no _id returned by GET'}
            disabled={!s._id}
            onClick={() => onEdit(s)}
          >
            <Pencil size={14} />
          </ActionButton>
          <ActionButton
            title={s._id ? 'Delete step' : 'Delete unavailable — no _id returned by GET'}
            disabled={isDeleting || !s._id}
            onClick={() => s._id && onDelete(s._id)}
          >
            <Trash2 size={14} style={{ color: 'var(--color-error)' }} />
          </ActionButton>
        </div>
      ),
    },
  ]
}

// ─── Page ─────────────────────────────────────────────────
export default function CmsHowItWorksPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<StepForm>(DEFAULT_FORM)

  const { data: steps, isLoading, isError } = useHowItWorks()
  const createMutation = useCreateHowItWorksStep()
  const updateMutation = useUpdateHowItWorksStep()
  const deleteMutation = useDeleteHowItWorksStep()

  function setField<K extends keyof StepForm>(key: K, value: StepForm[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function openCreate() {
    setEditingId(null)
    setForm(DEFAULT_FORM)
    setIsModalOpen(true)
  }

  function openEdit(step: HowItWorksStep) {
    if (!step._id) return
    setEditingId(step._id)
    setForm({
      stepNumber:   String(step.stepNumber),
      title:        step.title,
      description:  step.description,
      iconType:     step.iconType,
      isComingSoon: step.isComingSoon,
      isActive:     step.isActive,
      sortOrder:    String(step.sortOrder),
    })
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setEditingId(null)
    setForm(DEFAULT_FORM)
  }

  function handleSubmit() {
    if (!form.title.trim() || !form.description.trim() || !form.iconType.trim()) return

    const payload = {
      stepNumber:   Number(form.stepNumber) || 1,
      title:        form.title.trim(),
      description:  form.description.trim(),
      iconType:     form.iconType.trim(),
      isComingSoon: form.isComingSoon,
      isActive:     form.isActive,
      sortOrder:    Number(form.sortOrder) || 0,
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
        title="How It Works"
        subtitle="Steps explaining the ComfyTag experience on the public landing page"
        action={<Button onClick={openCreate}>+ Add Step</Button>}
      />

      {isLoading && <LoadingSpinner size="md" centered />}
      {isError   && <ErrorMessage message="Failed to load steps" />}

      {!isLoading && !isError && (
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          <DataTable columns={columns} data={steps ?? []} />
        </div>
      )}

      {/* ── Create / Edit Modal ──────────────────────── */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingId ? 'Edit Step' : 'New Step'}
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
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <Input
                id="step-number"
                label="Step number"
                type="number"
                value={form.stepNumber}
                onChange={(e) => setField('stepNumber', e.target.value)}
              />
            </div>
            <div style={{ flex: 1 }}>
              <Input
                id="step-sort-order"
                label="Sort order"
                type="number"
                value={form.sortOrder}
                onChange={(e) => setField('sortOrder', e.target.value)}
              />
            </div>
          </div>

          <Input
            id="step-title"
            label="Title"
            value={form.title}
            onChange={(e) => setField('title', e.target.value)}
          />

          <div>
            <label htmlFor="step-description" style={labelStyle}>Description</label>
            <textarea
              id="step-description"
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              style={textareaStyle}
            />
          </div>

          <Input
            id="step-icon-type"
            label="Icon type (e.g. face, ticket, scan)"
            value={form.iconType}
            onChange={(e) => setField('iconType', e.target.value)}
          />

          <ToggleSwitch
            id="step-coming-soon"
            label="Coming soon"
            checked={form.isComingSoon}
            onChange={(v) => setField('isComingSoon', v)}
          />

          <ToggleSwitch
            id="step-is-active"
            label="Active"
            checked={form.isActive}
            onChange={(v) => setField('isActive', v)}
          />

          {isError_ && (
            <p style={{ fontSize: '13px', color: 'var(--color-error)', margin: 0 }}>
              Failed to save step. Please try again.
            </p>
          )}
        </div>
      </Modal>
    </div>
  )
}
