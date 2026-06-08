'use client'

import { Search, X } from 'lucide-react'

interface AttendeeSearchFilterProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  statusFilter: 'all' | 'active' | 'used' | 'transferred' | 'refunded'
  onStatusFilterChange: (status: 'all' | 'active' | 'used' | 'transferred' | 'refunded') => void
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Search input */}
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          placeholder="Search by name, email, or phone..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{
            width: '100%',
            padding: '9px 36px 9px 12px',
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            fontSize: '14px',
            color: 'var(--color-text)',
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color var(--duration-fast) ease',
          }}
          onFocus={(e) => {
            (e.currentTarget as HTMLInputElement).style.borderColor = 'var(--color-brand)'
          }}
          onBlur={(e) => {
            (e.currentTarget as HTMLInputElement).style.borderColor = 'var(--color-border)'
          }}
        />
        {searchQuery ? (
          <button
            onClick={() => onSearchChange('')}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={16} />
          </button>
        ) : (
          <Search
            size={16}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-text-muted)',
              pointerEvents: 'none',
            }}
          />
        )}
      </div>

      {/* Status filter tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {[
          { value: 'all' as const, label: 'All' },
          { value: 'active' as const, label: 'Active' },
          { value: 'used' as const, label: 'Used' },
          { value: 'transferred' as const, label: 'Transferred' },
          { value: 'refunded' as const, label: 'Refunded' },
        ].map(tab => (
          <button
            key={tab.value}
            onClick={() => onStatusFilterChange(tab.value)}
            style={{
              padding: '8px 14px',
              backgroundColor: statusFilter === tab.value ? 'var(--color-brand)' : 'var(--color-surface)',
              color: statusFilter === tab.value ? 'white' : 'var(--color-text)',
              border: statusFilter === tab.value ? 'none' : '1px solid var(--color-border)',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background var(--duration-fast) ease, color var(--duration-fast) ease',
            }}
            onMouseEnter={(e) => {
              if (statusFilter !== tab.value) {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-surface-2)'
              }
            }}
            onMouseLeave={(e) => {
              if (statusFilter !== tab.value) {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-surface)'
              }
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Result count */}
      <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: 0 }}>
        Showing {attendeeCount} attendee{attendeeCount !== 1 ? 's' : ''}
      </p>
    </div>
  )
}
