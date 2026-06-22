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
import type { FaqItem } from '@comfytag/types'
import { Pencil, Trash2 } from 'lucide-react'
import { useFaqs, useCreateFaq, useUpdateFaq, useDeleteFaq } from '@/hooks'

// ─── Types ───────────────────────────────────────────────
interface FaqForm {
  question: string
  answer: string
  category: string
  sortOrder: string
  isActive: boolean
}

const DEFAULT_FORM: FaqForm = {
  question: '',
  answer: '',
  category: '',
  sortOrder: '0',
  isActive: true,
}

// ─── Sub-components ──────────────────────────────────────
function ActiveBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: '999px',
        fontSize: '12px',
        fontWeight: 500,
        backgroundColor: isActive
          ? 'color-mix(in srgb, var(--color-success) 15%, transparent)'
          : 'color-mix(in srgb, var(--color-error) 12%, transparent)',
        color: isActive ? 'var(--color-success)' : 'var(--color-error)',
      }}
    >
      {isActive ? 'Active' : 'Inactive'}
    </span>
  )
}

function ActionButtons({
  onEdit,
  onDelete,
  disabled,
}: {
  onEdit: () => void
  onDelete: () => void
  disabled: boolean
}) {
  return (
    <div style={{ display: 'flex', gap: '6px' }}>
      <button
        title="Edit"
        onClick={onEdit}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 28,
          height: 28,
          borderRadius: 6,
          border: '1px solid var(--color-border)',
          backgroundColor: 'transparent',
          color: 'var(--color-text)',
          cursor: 'pointer',
        }}
      >
        <Pencil size={13} />
      </button>
      <button
        title="Delete"
        disabled={disabled}
        onClick={onDelete}
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
        <Trash2 size={13} />
      </button>
    </div>
  )
}

// ─── Column definitions ──────────────────────────────────
function buildColumns(
  onEdit: (item: FaqItem) => void,
  onDelete: (id: string) => void,
  isDeleting: boolean,
): ColumnDef<FaqItem>[] {
  return [
    {
      key: 'question',
      header: 'Question',
      render: (item) => (
        <span
          style={{
            fontSize: '14px',
            fontWeight: 500,
            color: 'var(--color-text)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {item.question}
        </span>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      width: '140px',
      render: (item) => (
        <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
          {item.category || '—'}
        </span>
      ),
    },
    {
      key: 'sortOrder',
      header: 'Order',
      width: '70px',
      render: (item) => (
        <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
          {item.sortOrder}
        </span>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      width: '90px',
      render: (item) => <ActiveBadge isActive={item.isActive} />,
    },
    {
      key: 'actions',
      header: '',
      width: '72px',
      render: (item) => (
        <ActionButtons
          onEdit={() => onEdit(item)}
          onDelete={() => onDelete(item._id)}
          disabled={isDeleting}
        />
      ),
    },
  ]
}

// ─── Page ────────────────────────────────────────────────
export default function CmsFaqsPage() {
  const [modalMode, setModalMode] = useState<'closed' | 'create' | 'edit'>('closed')
  const [editingId, setEditingId]  = useState<string | null>(null)
  const [form, setForm]            = useState<FaqForm>(DEFAULT_FORM)

  const { data: items, isLoading, isError } = useFaqs()
  const createMutation = useCreateFaq()
  const updateMutation = useUpdateFaq()
  const deleteMutation = useDeleteFaq()

  function setField<K extends keyof FaqForm>(key: K, value: FaqForm[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function openCreate() {
    setForm(DEFAULT_FORM)
    setEditingId(null)
    setModalMode('create')
  }

  function openEdit(item: FaqItem) {
    setForm({
      question:  item.question,
      answer:    item.answer,
      category:  item.category ?? '',
      sortOrder: String(item.sortOrder),
      isActive:  item.isActive,
    })
    setEditingId(item._id)
    setModalMode('edit')
  }

  function closeModal() {
    setModalMode('closed')
    setEditingId(null)
    setForm(DEFAULT_FORM)
  }

  function handleSubmit() {
    if (!form.question.trim() || !form.answer.trim()) return

    const payload = {
      question:  form.question.trim(),
      answer:    form.answer.trim(),
      category:  form.category.trim() || undefined,
      sortOrder: Number(form.sortOrder) || 0,
      isActive:  form.isActive,
    }

    if (modalMode === 'create') {
      createMutation.mutate(payload, { onSuccess: closeModal })
    } else if (modalMode === 'edit' && editingId) {
      updateMutation.mutate({ id: editingId, payload }, { onSuccess: closeModal })
    }
  }

  function handleDelete(id: string) {
    deleteMutation.mutate(id)
  }

  const isSaving = createMutation.isPending || updateMutation.isPending
  const columns  = buildColumns(openEdit, handleDelete, deleteMutation.isPending)

  return (
    <div>
      <PageHeader
        title="FAQs"
        subtitle="Frequently asked questions displayed on the attendee site"
        action={<Button onClick={openCreate}>+ Add FAQ</Button>}
      />

      {isLoading && <LoadingSpinner size="md" centered />}
      {isError   && <ErrorMessage message="Failed to load FAQs" />}

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

      {/* ── Create / Edit Modal ──────────────────────── */}
      <Modal
        isOpen={modalMode !== 'closed'}
        onClose={closeModal}
        title={modalMode === 'create' ? 'New FAQ' : 'Edit FAQ'}
        footer={
          <>
            <Button variant="ghost" onClick={closeModal}>Cancel</Button>
            <Button
              variant="primary"
              loading={isSaving}
              onClick={handleSubmit}
            >
              {modalMode === 'create' ? 'Create' : 'Save changes'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            id="faq-question"
            label="Question"
            value={form.question}
            onChange={(e) => setField('question', e.target.value)}
          />

          <div>
            <label
              htmlFor="faq-answer"
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--color-text)',
                marginBottom: '6px',
              }}
            >
              Answer
            </label>
            <textarea
              id="faq-answer"
              value={form.answer}
              rows={4}
              onChange={(e) => setField('answer', e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text)',
                fontSize: '14px',
                resize: 'vertical',
                outline: 'none',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <Input
            id="faq-category"
            label="Category (optional)"
            value={form.category}
            onChange={(e) => setField('category', e.target.value)}
          />

          <Input
            id="faq-sort-order"
            label="Sort order"
            type="number"
            value={form.sortOrder}
            onChange={(e) => setField('sortOrder', e.target.value)}
          />

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
              checked={form.isActive}
              onChange={(e) => setField('isActive', e.target.checked)}
            />
            Active (visible on site)
          </label>

          {(createMutation.isError || updateMutation.isError) && (
            <p style={{ fontSize: '13px', color: 'var(--color-error)', margin: 0 }}>
              Failed to save FAQ. Please try again.
            </p>
          )}
        </div>
      </Modal>
    </div>
  )
}
