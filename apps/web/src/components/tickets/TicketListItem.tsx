import Link from 'next/link'
import type { Ticket } from '@comfytag/types'
import { formatNaira, formatDate } from '@comfytag/utils'

export interface TicketListItemProps {
  ticket: Ticket
  isPast?: boolean
  onAction?: (action: 'show-qr' | 'transfer' | 'details', ticket: Ticket) => void
}

export function TicketListItem({ ticket, isPast, onAction }: TicketListItemProps): React.ReactElement {
  const getStatusBadge = (): { label: string; color: string } | null => {
    switch (ticket.status) {
      case 'used':
        return { label: 'Used', color: 'var(--color-text-muted)' }
      case 'transferred':
        return { label: 'Transferred', color: 'var(--color-error)' }
      case 'refunded':
        return { label: 'Refunded', color: 'var(--color-warning)' }
      case 'active':
        return null
      default:
        return null
    }
  }

  const statusBadge = getStatusBadge()
  const isExpired = ticket.status === 'used' || ticket.status === 'transferred' || ticket.status === 'refunded'

  const handleAction = (
    e: React.MouseEvent<HTMLButtonElement>,
    action: 'show-qr' | 'transfer' | 'details'
  ): void => {
    e.preventDefault()
    onAction?.(action, ticket)
  }

  return (
    <Link
      href={`/tickets/${ticket._id}`}
      style={{
        display: 'flex',
        alignItems: 'stretch',
        gap: '12px',
        padding: '16px',
        border: `1px solid var(--color-border)`,
        borderRadius: 'var(--radius-md)',
        marginBottom: '12px',
        cursor: 'pointer',
        background: 'var(--color-surface)',
        opacity: isPast || isExpired ? 0.65 : 1,
        textDecoration: 'none',
        color: 'inherit',
        transition: `all var(--duration-fast)`,
      }}
      onMouseEnter={(e) => {
        if (!isExpired) {
          ;(e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--color-brand)'
          ;(e.currentTarget as HTMLAnchorElement).style.background = 'var(--color-surface-2)'
        }
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--color-border)'
        ;(e.currentTarget as HTMLAnchorElement).style.background = 'var(--color-surface)'
      }}
    >
      {/* Left accent bar */}
      <div
        aria-hidden="true"
        style={{
          width: '4px',
          background: isExpired ? 'var(--color-text-muted)' : 'var(--color-brand)',
          borderRadius: '2px',
          flexShrink: 0,
        }}
      />

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)' }}>
          {ticket.eventname}
        </div>

        <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: '1.3' }}>
          <div>{ticket.type}</div>
          <div>{formatDate(ticket.date)}</div>
        </div>

        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-brand)' }}>
          {formatNaira(ticket.amount)}
        </div>

        {statusBadge && (
          <div
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: statusBadge.color,
              marginTop: '4px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {statusBadge.label}
          </div>
        )}
      </div>

      {/* Action buttons (for non-expired tickets) */}
      {!isExpired && onAction && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            flexShrink: 0,
          }}
          onClick={(e) => {
            e.preventDefault()
          }}
        >
          <button
            onClick={(e) => handleAction(e, 'show-qr')}
            style={{
              padding: '8px 12px',
              background: 'var(--color-brand)',
              color: 'var(--color-text-on-brand)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: `background var(--duration-fast)`,
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.background = 'var(--color-brand-dark)'
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.background = 'var(--color-brand)'
            }}
          >
            QR Code
          </button>
          <button
            onClick={(e) => handleAction(e, 'transfer')}
            style={{
              padding: '8px 12px',
              background: 'var(--color-surface-2)',
              color: 'var(--color-text)',
              border: `1px solid var(--color-border)`,
              borderRadius: 'var(--radius-sm)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: `all var(--duration-fast)`,
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.borderColor = 'var(--color-text)'
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.borderColor = 'var(--color-border)'
            }}
          >
            Transfer
          </button>
        </div>
      )}

      {/* Chevron for expired tickets */}
      {isExpired && (
        <span style={{ fontSize: '20px', color: 'var(--color-text-muted)', flexShrink: 0, alignSelf: 'center' }} aria-hidden="true">
          ›
        </span>
      )}
    </Link>
  )
}
