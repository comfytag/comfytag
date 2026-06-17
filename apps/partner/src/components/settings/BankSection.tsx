'use client'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { ErrorMessage } from '@comfytag/ui'
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

const INPUT_CLASS =
  'w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-zinc-900 text-sm focus:bg-white focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 transition-all placeholder:text-zinc-400 focus:outline-none disabled:opacity-50'
const LABEL_CLASS =
  'block text-[11px] font-mono font-semibold text-zinc-500 uppercase tracking-wider mb-2'

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-zinc-900">Bank Details</h2>
        {mode === 'view' && (
          <button
            onClick={handleAdd}
            className="flex items-center gap-1.5 text-sm font-semibold text-violet-600 hover:text-violet-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Bank
          </button>
        )}
      </div>

      {error && <ErrorMessage message={error} />}

      {mode === 'view' ? (
        <div className="space-y-3">
          {banks.length === 0 ? (
            <div className="text-center py-12 text-zinc-400 text-sm">
              No bank accounts added yet
            </div>
          ) : (
            banks.map(bank => (
              <div
                key={bank._id}
                className="flex items-center justify-between p-4 bg-zinc-50 border border-zinc-200 rounded-xl"
              >
                <div>
                  <p className="text-sm font-semibold text-zinc-900">{bank.bankName}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {bank.acctName} · ****{bank.acctNumber.slice(-4)}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleEdit(bank)}
                    aria-label="Edit bank account"
                    className="p-2 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 transition-all"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(bank._id)}
                    aria-label="Delete bank account"
                    className="p-2 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <label className={LABEL_CLASS}>Bank Name</label>
            <input
              className={INPUT_CLASS}
              value={form.bankName}
              onChange={(e) => setForm(p => ({ ...p, bankName: e.target.value }))}
              placeholder="e.g. GTBank, First Bank"
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>Account Name</label>
            <input
              className={INPUT_CLASS}
              value={form.acctName}
              onChange={(e) => setForm(p => ({ ...p, acctName: e.target.value }))}
              placeholder="Name on account"
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>Account Number</label>
            <input
              className={INPUT_CLASS}
              value={form.acctNumber}
              onChange={(e) => setForm(p => ({ ...p, acctNumber: e.target.value }))}
              placeholder="10-digit NUBAN"
              disabled={isSubmitting}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setMode('view')}
              disabled={isSubmitting}
              className="text-sm font-medium text-zinc-500 hover:text-zinc-900 py-3 px-5 rounded-xl hover:bg-zinc-100 transition-all border border-zinc-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className="bg-zinc-900 text-white font-bold py-3 px-6 rounded-xl hover:bg-zinc-800 transition-all active:scale-95 w-full sm:w-auto disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : mode === 'add' ? 'Add Account' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
