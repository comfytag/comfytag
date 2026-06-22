'use client'

import { useMemo } from 'react'
import { EmptyState } from '@comfytag/ui'
import { formatNaira } from '@comfytag/utils'
import type { WithdrawRequest } from '@comfytag/types'

interface WalletTransaction {
  _id: string
  type: 'credit' | 'debit'
  amount: number
  reason?: string
  referenceId?: string
  createdAt: string
}

interface LedgerEntry {
  id: string
  createdAt: string
  dateKey: string
  label: string
  amount: number
  positive: boolean
  kind: 'sale' | 'debit' | 'withdrawal'
  status?: WithdrawRequest['status']
}

interface ReceiptRollProps {
  transactions: WalletTransaction[]
  withdrawals: WithdrawRequest[]
}

const STATUS_PILL: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-600',
  approved: 'bg-violet-50 text-violet-600',
  sent: 'bg-emerald-50 text-emerald-600',
  rejected: 'bg-red-50 text-red-500',
}

function dateKey(iso: string): string {
  const d = new Date(iso)
  return isNaN(d.getTime()) ? '0000-00-00' : d.toISOString().slice(0, 10)
}

function dateLabel(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return 'Unknown'
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

function TicketIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600" aria-hidden="true">
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
      <path d="M13 5v2" />
      <path d="M13 17v2" />
      <path d="M13 11v2" />
    </svg>
  )
}

function ArrowUpIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500" aria-hidden="true">
      <path d="M12 19V5" />
      <path d="M5 12l7-7 7 7" />
    </svg>
  )
}

function MinusIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400" aria-hidden="true">
      <path d="M5 12h14" />
    </svg>
  )
}

export function ReceiptRoll({ transactions, withdrawals }: ReceiptRollProps) {
  const groups = useMemo(() => {
    const entries: LedgerEntry[] = [
      ...(transactions ?? []).map((tx) => ({
        id: `tx-${tx._id}`,
        createdAt: tx.createdAt,
        dateKey: dateKey(tx.createdAt),
        label: tx.reason ?? tx.referenceId ?? (tx.type === 'credit' ? 'Ticket Sale' : 'Debit'),
        amount: tx.amount,
        positive: tx.type === 'credit',
        kind: (tx.type === 'credit' ? 'sale' : 'debit') as LedgerEntry['kind'],
      })),
      ...(withdrawals ?? []).map((w) => ({
        id: `wd-${w._id}`,
        createdAt: w.createdAt,
        dateKey: dateKey(w.createdAt),
        label: w.eventName || 'Withdrawal',
        amount: w.amount,
        positive: false,
        kind: 'withdrawal' as const,
        status: w.status,
      })),
    ]

    // Newest first
    entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    // Group by date key — Map preserves insertion order
    const map = new Map<string, { label: string; entries: LedgerEntry[] }>()
    for (const entry of entries) {
      if (!map.has(entry.dateKey)) {
        map.set(entry.dateKey, { label: dateLabel(entry.createdAt), entries: [] })
      }
      map.get(entry.dateKey)!.entries.push(entry)
    }
    return map
  }, [transactions, withdrawals])

  if (groups.size === 0) {
    return (
      <div className="bg-white border border-zinc-200 rounded-2xl p-10">
        <EmptyState
          title="No transactions yet"
          subtitle="Your earnings and withdrawals will appear here"
        />
      </div>
    )
  }

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-zinc-100">
        <h3 className="text-base font-bold text-zinc-900">Transaction History</h3>
        <p className="text-xs text-zinc-500 mt-0.5">All earnings and withdrawals</p>
      </div>

      {/* Ledger */}
      <div>
        {Array.from(groups.entries()).map(([key, group]) => (
          <div key={key}>
            {/* Date group divider */}
            <div className="px-6 py-2 bg-zinc-50 border-y border-zinc-100 first:border-t-0">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                {group.label}
              </span>
            </div>

            {/* Rows */}
            {group.entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-4 px-6 py-4 border-b border-zinc-50 last:border-b-0 hover:bg-zinc-50/60 transition-colors"
              >
                {/* Icon pill */}
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    entry.kind === 'sale'
                      ? 'bg-emerald-50'
                      : entry.kind === 'withdrawal'
                        ? 'bg-zinc-100'
                        : 'bg-red-50'
                  }`}
                >
                  {entry.kind === 'sale' ? (
                    <TicketIcon />
                  ) : entry.kind === 'withdrawal' ? (
                    <ArrowUpIcon />
                  ) : (
                    <MinusIcon />
                  )}
                </div>

                {/* Label + status */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-800 truncate">{entry.label}</p>
                  {entry.status != null && (
                    <span
                      className={`mt-0.5 inline-block text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${STATUS_PILL[entry.status] ?? 'bg-zinc-100 text-zinc-500'}`}
                    >
                      {entry.status}
                    </span>
                  )}
                </div>

                {/* Amount — right-aligned */}
                <p
                  className={`text-sm tabular-nums shrink-0 ${
                    entry.positive ? 'text-zinc-900 font-bold' : 'text-zinc-500 font-medium'
                  }`}
                >
                  {entry.positive ? '+' : '−'}
                  {formatNaira(entry.amount)}
                </p>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
