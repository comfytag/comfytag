'use client'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button, Input, ErrorMessage } from '@comfytag/ui'
import { SectionCard } from './SectionCard'
import { api } from '@/lib/api'
import type { BankAccount } from '@comfytag/types'

interface BankFormData {
  bankName: string
  acctName: string
  acctNumber: string
}

interface Props {
  banks: BankAccount[]
}

export function BankSection({ banks: initialBanks }: Props) {
  const { data: session } = useSession()
  const [banks, setBanks] = useState<BankAccount[]>(initialBanks)
  const [mode, setMode] = useState<'view' | 'add' | 'edit'>('view')
  const [editingBank, setEditingBank] = useState<BankAccount | null>(null)
  const [form, setForm] = useState<BankFormData>({ bankName: '', acctName: '', acctNumber: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAdd = () => {
    setForm({ bankName: '', acctName: '', acctNumber: '' })
    setEditingBank(null)
    setMode('add')
    setError(null)
  }

  const handleEdit = (bank: BankAccount) => {
    setForm({ bankName: bank.bankName, acctName: bank.acctName, acctNumber: bank.acctNumber })
    setEditingBank(bank)
    setMode('edit')
    setError(null)
  }

  const handleSave = async () => {
    if (!session?.user?.id || !session?.user?.token) return
    setIsSubmitting(true)
    setError(null)

    try {
      if (mode === 'add') {
        const res = await api.post(
          `/bank/${session.user.id}`,
          form
        )
        setBanks(prev => [...prev, res.data.data ?? res.data])
      } else if (mode === 'edit' && editingBank) {
        const res = await api.put(
          `/bank/edit/${editingBank._id}`,
          form
        )
        setBanks(prev => prev.map(b => b._id === editingBank._id ? (res.data.data ?? res.data) : b))
      }
      setMode('view')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save bank account')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (bankId: string) => {
    if (!session?.user?.token) return
    try {
      await api.delete(`/bank/${bankId}`)
      setBanks(prev => prev.filter(b => b._id !== bankId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete bank account')
    }
  }

  return (
    <SectionCard>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, color: 'var(--color-text-primary)', fontSize: '16px', fontWeight: 600 }}>Bank Details</h3>
        {mode === 'view' && <Button variant="ghost" size="sm" onClick={handleAdd}>Add Bank</Button>}
      </div>

      {error && <ErrorMessage message={error} />}

      {mode === 'view' ? (
        <div>
          {banks.length === 0 ? (
            <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>No bank accounts added yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {banks.map(bank => (
                <div key={bank._id} style={{ padding: '12px', background: 'var(--color-surface-2)', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{bank.bankName}</div>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>****{bank.acctNumber.slice(-4)}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(bank)}>Edit</Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(bank._id)}>Delete</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)', display: 'block', marginBottom: '4px' }}>Bank Name</label>
            <Input
              value={form.bankName}
              onChange={(e) => setForm(p => ({ ...p, bankName: e.target.value }))}
              placeholder="e.g. GTBank, First Bank"
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)', display: 'block', marginBottom: '4px' }}>Account Name</label>
            <Input
              value={form.acctName}
              onChange={(e) => setForm(p => ({ ...p, acctName: e.target.value }))}
              placeholder="Name on account"
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)', display: 'block', marginBottom: '4px' }}>Account Number</label>
            <Input
              value={form.acctNumber}
              onChange={(e) => setForm(p => ({ ...p, acctNumber: e.target.value }))}
              placeholder="10-digit NUBAN"
              disabled={isSubmitting}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', paddingTop: '8px' }}>
            <Button variant="ghost" onClick={() => setMode('view')} disabled={isSubmitting} className="flex-1">Cancel</Button>
            <Button variant="primary" onClick={handleSave} disabled={isSubmitting} className="flex-1">{isSubmitting ? 'Saving...' : 'Save'}</Button>
          </div>
        </div>
      )}
    </SectionCard>
  )
}

