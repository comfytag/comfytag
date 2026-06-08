'use client'

import { useState } from 'react'
import { formatNaira, formatDate } from '@comfytag/utils'
import { AttendeeStatusBadge } from './AttendeeStatusBadge'

interface Attendee {
  _id: string
  name: string
  email: string
  phone?: string
  numOfTicket: number
  ticketType?: string
  amount?: number
  date?: string
  status: 'active' | 'used' | 'transferred' | 'refunded' | 'ended'
  checkedIn?: boolean
  checkInDate?: string
}

interface AttendeeRowProps {
  attendee: Attendee
  onCheckInToggle: () => void
  isCheckingIn?: boolean
}

export function AttendeeRow({ attendee, onCheckInToggle, isCheckingIn = false }: AttendeeRowProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        alignItems: 'center',
        padding: '16px',
        borderBottom: '1px solid var(--color-border)',
        backgroundColor: isHovered ? 'var(--color-surface-2)' : 'transparent',
        transition: 'background var(--duration-fast) ease',
      }}
    >
      {/* Left: Info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ fontWeight: 500, color: 'var(--color-text)', fontSize: '14px' }}>
            {attendee.name}
          </div>
          <AttendeeStatusBadge status={attendee.status} />
        </div>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '13px', color: 'var(--color-text-muted)' }}>
          <span>{attendee.email}</span>
          {attendee.phone && <span>{attendee.phone}</span>}
          {attendee.ticketType && <span>Tier: {attendee.ticketType}</span>}
          {attendee.amount && <span>{formatNaira(attendee.amount)} · {attendee.numOfTicket} ticket{attendee.numOfTicket !== 1 ? 's' : ''}</span>}
        </div>
        {attendee.checkedIn && attendee.checkInDate && (
          <div style={{ fontSize: '12px', color: 'var(--color-success)', marginTop: '4px' }}>
            ✓ Checked in {formatDate(attendee.checkInDate)}
          </div>
        )}
      </div>

      {/* Right: Check-in toggle (for active tickets only) */}
      {attendee.status === 'active' && (
        <div style={{ marginLeft: '16px' }}>
          <button
            onClick={onCheckInToggle}
            disabled={isCheckingIn}
            style={{
              padding: '8px 14px',
              backgroundColor: attendee.checkedIn ? 'var(--color-success)' : 'var(--color-surface)',
              color: attendee.checkedIn ? 'white' : 'var(--color-text)',
              border: attendee.checkedIn ? 'none' : '1px solid var(--color-border)',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: isCheckingIn ? 'not-allowed' : 'pointer',
              opacity: isCheckingIn ? 0.6 : 1,
              transition: 'background var(--duration-fast) ease, color var(--duration-fast) ease',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              if (!isCheckingIn && !attendee.checkedIn) {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-surface-2)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isCheckingIn && !attendee.checkedIn) {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-surface)'
              }
            }}
          >
            {isCheckingIn ? 'Checking in...' : attendee.checkedIn ? '✓ Checked in' : 'Check in'}
          </button>
        </div>
      )}
    </div>
  )
}
