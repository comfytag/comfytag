'use client'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { ErrorMessage, Select, SelectItem } from '@comfytag/ui'
import { api } from '@/lib/api'
import { payoutKeys } from '@/hooks/queryKeys'
import { useBankList } from '@/hooks/usePayouts'
import type { BankAccount } from '@comfytag/types'

interface BankFormData {
  bankCode: string
  acctNumber: string
}

interface Props {
  banks: BankAccount[]
}

const INPUT_CLASS =
  'w-full bg-zinc-800 border border-(--color-border) rounded-xl px-4 py-3 text-(--color-text) text-sm focus:bg-(--color-surface) focus:border-violet-500 transition-all placeholder:text-zinc-500 focus:outline-none focus-visible:outline-none disabled:opacity-50'
const LABEL_CLASS =
  'block text-[11px] font-mono font-semibold text-zinc-400 uppercase tracking-wider mb-2'

export function BankSection({ banks: initialBanks }: Props) {
  const { data: session } = useSession()
  const qc = useQueryClient()
  const { data: bankList = [], isLoading: isBankListLoading } = useBankList()
  const [banks, setBanks] = useState<BankAccount[]>(initialBanks)
  const [mode, setMode] = useState<'view' | 'add'>('view')
  const [form, setForm] = useState<BankFormData>({ bankCode: '', acctNumber: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAdd = () => {
    setForm({ bankCode: '', acctNumber: '' })
    setMode('add')
    setError(null)
  }

  const handleSave = async () => {
    if (!session?.user?.id || !session?.user?.token) return
    if (!form.bankCode || !form.acctNumber) {
      setError('Select a bank and enter the account number.')
      return
    }
    setIsSubmitting(true)
    setError(null)

    try {
      // The backend resolves this account number against Paystack and returns
      // the verified account holder name — that's what gets saved as acctName,
      // never whatever a client might send.
      const res = await api.post(`/bank/${session.user.id}`, form)
      setBanks(prev => [...prev, res.data.data ?? res.data])
      qc.invalidateQueries({ queryKey: payoutKeys.bank })
      setMode('view')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not verify this bank account. Double-check the details and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (bankId: string) => {
    if (!session?.user?.token) return
    try {
      await api.delete(`/bank/${bankId}`)
      setBanks(prev => prev.filter(b => b._id !== bankId))
      qc.invalidateQueries({ queryKey: payoutKeys.bank })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete bank account')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-(--color-text)">Bank Details</h2>
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
            <div className="text-center py-12 text-zinc-500 text-sm">
              No bank accounts added yet
            </div>
          ) : (
            banks.map(bank => (
              <div
                key={bank._id}
                className="flex items-center justify-between p-4 bg-zinc-800 border border-(--color-border) rounded-xl"
              >
                <div>
                  <p className="text-sm font-semibold text-(--color-text)">{bank.bankName}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {bank.acctName} · ****{bank.acctNumber.slice(-4)}
                  </p>
                  {!bank.recipientCode && (
                    <p className="text-xs text-amber-500 mt-1">
                      Payouts not yet enabled for this account — delete and re-add to retry.
                    </p>
                  )}
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleDelete(bank._id)}
                    aria-label="Delete bank account"
                    className="p-2 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-950/40 transition-all"
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
          <p className="text-xs text-zinc-400 -mt-2">
            We verify the account with your bank before saving — the account holder's
            name is confirmed automatically, not typed in.
          </p>
          <div>
            <label className={LABEL_CLASS}>Bank</label>
            <Select
              value={form.bankCode}
              onChange={(e) => setForm(p => ({ ...p, bankCode: e.target.value }))}
              disabled={isSubmitting || isBankListLoading}
            >
              <SelectItem value="">
                {isBankListLoading ? 'Loading banks…' : 'Select your bank'}
              </SelectItem>
              {bankList.map(b => (
                <SelectItem key={b.code} value={b.code}>
                  {b.name}
                </SelectItem>
              ))}
            </Select>
          </div>
          <div>
            <label className={LABEL_CLASS}>Account Number</label>
            <input
              className={INPUT_CLASS}
              value={form.acctNumber}
              onChange={(e) => setForm(p => ({ ...p, acctNumber: e.target.value.replace(/\D/g, '') }))}
              placeholder="10-digit NUBAN"
              inputMode="numeric"
              maxLength={10}
              disabled={isSubmitting}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setMode('view')}
              disabled={isSubmitting}
              className="text-sm font-medium text-zinc-400 hover:text-(--color-text) py-3 px-5 rounded-xl hover:bg-zinc-800 transition-all border border-(--color-border) disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className="bg-violet-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-violet-700 transition-all active:scale-95 w-full sm:w-auto disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Verifying...' : 'Verify & Add Account'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
