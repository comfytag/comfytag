'use client'

import React, { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Copy, Check, Share2, TrendingUp, Wallet, Ticket, ArrowRight } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { LoadingSpinner, EmptyState } from '@comfytag/ui'
import { formatNaira, formatDate } from '@comfytag/utils'
import { useProfile } from '@/hooks/useProfile'

interface WalletTransaction {
  _id: string
  type: 'credit' | 'debit'
  amount: number
  description: string
  createdAt: string
  reference?: string
}

interface WalletData {
  balance: number
  transactions: WalletTransaction[]
}

export default function HypeLinkPage() {
  const { data: session, status } = useSession()
  const { data: user, isLoading } = useProfile()
  const [copied, setCopied] = useState(false)

  const wallet: WalletData = {
    balance: 0,
    transactions: [],
  }

  if (status === 'loading') {
    return (
      <>
        <Navbar />
        <div className="w-full min-h-screen bg-zinc-50/30 pt-28 pb-16 flex items-center justify-center">
          <LoadingSpinner size="lg" centered />
        </div>
      </>
    )
  }

  if (!session) {
    return (
      <>
        <Navbar />
        <div className="w-full min-h-screen bg-zinc-50/30 pt-28 pb-16 flex items-center justify-center">
          <EmptyState
            title="Sign in to access your Hype Link"
            action={{ label: 'Log In', href: '/login' }}
          />
        </div>
      </>
    )
  }

  const hypeUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}?ref=${session.user.id}`
      : `https://comfytag.com?ref=${session.user.id}`

  async function handleCopy() {
    await navigator.clipboard.writeText(hypeUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const canShare = typeof navigator !== 'undefined' && 'share' in navigator

  return (
    <>
      <Navbar />
      <div className="w-full min-h-screen bg-zinc-50/30 pt-28 pb-16">
        <div className="max-w-5xl mx-auto px-4 md:px-8">

          {/* Page header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-zinc-900">My Hype Links</h1>
              <p className="text-sm text-zinc-500 mt-1">
                Share your link and earn ₦500 for every ticket sold
              </p>
            </div>
            <div className="shrink-0 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
              <p className="text-xs text-emerald-600 font-semibold mb-0.5">Total Earned</p>
              <p className="text-lg font-black text-emerald-700">{formatNaira(wallet.balance)}</p>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            {[
              { label: 'Total Clicks', value: '0', Icon: TrendingUp },
              { label: 'Tickets Sold', value: '0', Icon: Ticket },
              { label: 'Total Earned', value: formatNaira(0), Icon: Wallet },
              { label: 'Withdrawable', value: formatNaira(wallet.balance), Icon: Wallet },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white border border-zinc-200 rounded-2xl p-4 flex flex-col gap-1"
              >
                <stat.Icon className="w-4 h-4 text-zinc-400 mb-1" aria-hidden="true" />
                <p className="text-xs text-zinc-500">{stat.label}</p>
                <p className="text-base font-bold text-zinc-900">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Hype link card — horizontal creator-dashboard style */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-zinc-300 transition-all mt-6">
            <div className="flex flex-col gap-1 min-w-0 flex-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                Personal Hype Link
              </span>
              <p className="text-sm font-bold text-violet-600 truncate font-mono">{hypeUrl}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-semibold rounded-full">
                  0 Clicks
                </span>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-semibold rounded-full">
                  0 Sales
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleCopy}
                className="border border-zinc-200 hover:bg-zinc-50 rounded-xl px-4 py-2 text-sm font-bold flex items-center gap-2 transition-colors"
              >
                {copied
                  ? <Check className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                  : <Copy className="w-4 h-4" aria-hidden="true" />
                }
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
              {canShare && (
                <button
                  onClick={() =>
                    navigator.share({ title: 'My ComfyTag Hype Link', url: hypeUrl })
                  }
                  className="border border-zinc-200 hover:bg-zinc-50 rounded-xl px-4 py-2 text-sm font-bold flex items-center gap-2 transition-colors"
                >
                  <Share2 className="w-4 h-4" aria-hidden="true" />
                  Share
                </button>
              )}
            </div>
          </div>

          {/* Transaction history */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-zinc-900">Transaction History</h2>
              <button
                onClick={() => { window.location.href = '/profile/bank' }}
                className="text-sm font-bold text-violet-600 hover:text-violet-700 transition-colors flex items-center gap-1"
              >
                Withdraw
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="md" centered />
              </div>
            ) : !wallet.transactions.length ? (
              <div className="bg-white border border-zinc-200 rounded-2xl p-8 text-center">
                <p className="text-zinc-500 text-sm">
                  No transactions yet. Start sharing your link to earn credits.
                </p>
                <p className="text-xs text-zinc-400 mt-1">Min. withdrawal ₦2,000 via bank account.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-0">
                {wallet.transactions.map((tx) => (
                  <div
                    key={tx._id}
                    className="bg-white border border-zinc-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-zinc-300 transition-all mt-4"
                  >
                    <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                      <p className="text-sm font-bold text-zinc-900 truncate">{tx.description}</p>
                      <p className="text-xs text-zinc-400">{formatDate(tx.createdAt)}</p>
                    </div>
                    <span
                      className={[
                        'text-sm font-bold shrink-0',
                        tx.type === 'credit' ? 'text-emerald-600' : 'text-red-500',
                      ].join(' ')}
                    >
                      {tx.type === 'credit' ? '+' : '−'}{formatNaira(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  )
}
