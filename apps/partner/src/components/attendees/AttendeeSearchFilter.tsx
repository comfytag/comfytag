'use client'

import { Search, X } from 'lucide-react'

type StatusFilterValue = 'all' | 'active' | 'used' | 'transferred' | 'refunded'

const STATUS_TABS: { value: StatusFilterValue; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'used', label: 'Used' },
  { value: 'transferred', label: 'Transferred' },
  { value: 'refunded', label: 'Refunded' },
]

interface AttendeeSearchFilterProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  statusFilter: StatusFilterValue
  onStatusFilterChange: (status: StatusFilterValue) => void
  attendeeCount: number
}

export function AttendeeSearchFilter({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  attendeeCount,
}: AttendeeSearchFilterProps) {
  return (
    <div className="space-y-3">
      {/* Search hub */}
      <div className="bg-(--color-surface) p-2 border border-(--color-border) rounded-xl flex items-center gap-3">
        <Search
          size={16}
          strokeWidth={1.5}
          className="text-zinc-400 shrink-0 ml-2 pointer-events-none"
          aria-hidden="true"
        />
        <input
          type="text"
          placeholder="Search by name, email, or phone…"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-transparent border-none px-2 py-2 text-(--color-text) placeholder:text-zinc-500 focus:outline-none focus:ring-0 text-base"
        />
        {searchQuery && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => onSearchChange('')}
            className="shrink-0 mr-1 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <X size={16} strokeWidth={1.5} aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Status filter pills + result count */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => onStatusFilterChange(tab.value)}
              className={
                statusFilter === tab.value
                  ? 'px-4 py-1.5 rounded-full text-xs font-semibold bg-violet-600 text-white transition-colors'
                  : 'px-4 py-1.5 rounded-full text-xs font-semibold bg-(--color-surface) border border-(--color-border) text-zinc-400 hover:bg-zinc-800 hover:border-zinc-700 transition-colors'
              }
            >
              {tab.label}
            </button>
          ))}
        </div>
        <span className="text-[10px] font-mono uppercase tracking-widest text-(--color-text-muted) font-semibold shrink-0">
          {attendeeCount} attendee{attendeeCount !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  )
}
