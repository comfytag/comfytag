'use client'

import { useState } from 'react'
import { Badge, Button, LoadingSpinner, ErrorMessage, Modal } from '@comfytag/ui'
import type { Category } from '@comfytag/types'
import { DataTable } from '@comfytag/ui'
import type { ColumnDef } from '@comfytag/ui'
import { PageHeader } from '@comfytag/ui'
import { Pencil, Eye, EyeOff } from 'lucide-react'
import { CategoryForm as CategoryFormFields } from '@/components/categories/CategoryForm'
import type { CategoryFormValues } from '@/components/categories/CategoryForm'
import { useCategories, useCreateCategory, useUpdateCategory } from '@/hooks'

// ─── Local type alias for form state ────────────────────
type CategoryForm = CategoryFormValues

const DEFAULT_FORM: CategoryForm = {
  title: '',
  icon: '🎵',
  gradient: 'linear-gradient(135deg, #7C3AED, #8B5CF6)',
  description: '',
  sortOrder: '0',
  isActive: true,
}

// ─── Column definitions (MODULE LEVEL) ─────────────────
const buildColumns = (
  onEdit: (cat: Category) => void,
  onToggle: (cat: Category) => void,
): ColumnDef<Category>[] => [
  {
    key: 'icon',
    header: 'Icon',
    render: (cat) => (
      <span style={{ fontSize: '20px', display: 'block', textAlign: 'center' }}>
        {cat.icon ?? '🎵'}
      </span>
    ),
    width: '60px',
  },
  {
    key: 'title',
    header: 'Name',
    render: (cat) => (
      <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>
        {cat.title}
      </span>
    ),
  },
  {
    key: 'gradient',
    header: 'Gradient',
    render: (cat) => (
      <div
        style={{
          width: 32,
          height: 16,
          borderRadius: 'var(--radius-sm)',
          background: cat.gradient ?? 'linear-gradient(135deg, #7C3AED, #8B5CF6)',
        }}
      />
    ),
    width: '80px',
  },
  {
    key: 'status',
    header: 'Status',
    render: (cat) => (
      <Badge status={cat.isActive ? 'approved' : 'rejected'} />
    ),
    width: '100px',
  },
  {
    key: 'sortOrder',
    header: 'Order',
    render: (cat) => (
      <span style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>
        {cat.sortOrder}
      </span>
    ),
    width: '70px',
  },
  {
    key: 'actions',
    header: 'Actions',
    render: (cat) => (
      <div style={{ display: 'flex', gap: 8 }}>
        <ActionButton
          title="Edit category"
          onClick={() => onEdit(cat)}
        >
          <Pencil size={14} />
        </ActionButton>
        <ActionButton
          title={cat.isActive ? 'Deactivate' : 'Activate'}
          onClick={() => onToggle(cat)}
        >
          {cat.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
        </ActionButton>
      </div>
    ),
    width: '90px',
  },
]

// ─── Small helper component (not shared across pages) ──
function ActionButton({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode
  onClick: () => void
  title: string
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 28,
        height: 28,
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)',
        backgroundColor: 'transparent',
        color: 'var(--color-text-muted)',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

// ─── Page ───────────────────────────────────────────────
export default function CategoriesPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  const [addForm, setAddForm] = useState<CategoryForm>(DEFAULT_FORM)
  const [editForm, setEditForm] = useState<CategoryForm>(DEFAULT_FORM)

  const { data: categories, isLoading, isError } = useCategories()
  const createMutation = useCreateCategory()
  const updateMutation = useUpdateCategory()

  const handleCreateSubmit = (form: CategoryForm) => {
    createMutation.mutate({
      ...form,
      sortOrder: Number(form.sortOrder) || 0,
    })
    setIsAddModalOpen(false)
    setAddForm(DEFAULT_FORM)
  }

  const handleUpdateSubmit = (id: string, form: CategoryForm) => {
    updateMutation.mutate({
      id,
      payload: {
        ...form,
        sortOrder: Number(form.sortOrder) || 0,
      },
    })
    setIsEditModalOpen(false)
    setEditingCategory(null)
  }

  const handleToggleCategory = (id: string, currentIsActive: boolean) => {
    updateMutation.mutate({
      id,
      payload: { isActive: !currentIsActive },
    })
  }

  const handleEdit = (cat: Category) => {
    setEditingCategory(cat)
    setEditForm({
      title: cat.title,
      icon: cat.icon ?? '🎵',
      gradient: cat.gradient ?? 'linear-gradient(135deg, #7C3AED, #8B5CF6)',
      description: cat.description ?? '',
      sortOrder: String(cat.sortOrder ?? 0),
      isActive: cat.isActive,
    })
    setIsEditModalOpen(true)
  }

  const handleToggle = (cat: Category) => {
    handleToggleCategory(cat._id, cat.isActive)
  }

  const columns = buildColumns(handleEdit, handleToggle)

  return (
    <div>
      <PageHeader
        title="Categories"
        subtitle="Manage event categories shown on the web app"
        action={
          <Button onClick={() => setIsAddModalOpen(true)}>+ Add Category</Button>
        }
      />

      {isLoading && <LoadingSpinner size="md" centered />}
      {isError && <ErrorMessage message="Failed to load categories" />}
      {!isLoading && !isError && (
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
          }}
        >
          <DataTable columns={columns} data={categories ?? []} />
        </div>
      )}

      {/* Add Category Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
          setAddForm(DEFAULT_FORM)
        }}
        title="Add Category"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setIsAddModalOpen(false)
                setAddForm(DEFAULT_FORM)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={createMutation.isPending}
              onClick={() => {
                if (!addForm.title.trim()) return
                handleCreateSubmit(addForm)
              }}
            >
              Save
            </Button>
          </>
        }
      >
        <CategoryFormFields
          form={addForm}
          onChange={(updates) => setAddForm((f) => ({ ...f, ...updates }))}
        />
        {createMutation.isError && (
          <p style={{ color: 'var(--color-error)', fontSize: 13, marginTop: 12 }}>
            Failed to create category. Please try again.
          </p>
        )}
      </Modal>

      {/* Edit Category Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setEditingCategory(null)
        }}
        title="Edit Category"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setIsEditModalOpen(false)
                setEditingCategory(null)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={updateMutation.isPending}
              onClick={() => {
                if (!editingCategory || !editForm.title.trim()) return
                handleUpdateSubmit(editingCategory._id, editForm)
              }}
            >
              Save
            </Button>
          </>
        }
      >
        <CategoryFormFields
          form={editForm}
          onChange={(updates) => setEditForm((f) => ({ ...f, ...updates }))}
        />
        {updateMutation.isError && (
          <p style={{ color: 'var(--color-error)', fontSize: 13, marginTop: 12 }}>
            Failed to update category. Please try again.
          </p>
        )}
      </Modal>
    </div>
  )
}
