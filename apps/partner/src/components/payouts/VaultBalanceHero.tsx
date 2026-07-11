'use client'

import { formatNaira } from '@comfytag/utils'

interface VaultBalanceHeroProps {
  balance: number
  available: number
  pending: number
}

export function VaultBalanceHero({ balance, available, pending }: VaultBalanceHeroProps) {
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-8 relative overflow-hidden">
      <div className="relative z-10">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">
          Total Balance
        </p>

        <h2 className="text-5xl font-black text-white tracking-tight leading-none mb-8">
          {formatNaira(balance)}
        </h2>

        <div className="flex items-center gap-8 flex-wrap">
          <div>
            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1">
              Available
            </p>
            <p className="text-xl font-bold text-amber-400">{formatNaira(available)}</p>
          </div>
          <div className="w-px h-8 bg-zinc-800" />
          <div>
            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1">
              Pending
            </p>
            <p className="text-xl font-bold text-amber-600">{formatNaira(pending)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
