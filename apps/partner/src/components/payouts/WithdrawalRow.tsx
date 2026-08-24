'use client'

import type { WithdrawRequest, WithdrawStatus } from '@comfytag/types'
import { formatNaira, formatDate } from '@comfytag/utils'

interface WithdrawalRowProps {
  withdrawal: WithdrawRequest
}

export function WithdrawalRow({ withdrawal }: WithdrawalRowProps) {
  const getStatusColor = (status: WithdrawStatus): string => {
    switch (status) {
      case 'pending':
        return 'var(--color-warning)'
      case 'approved':
      case 'processing':
        return 'var(--color-brand)'
      case 'sent':
        return 'var(--color-success)'
      case 'failed':
      case 'rejected':
        return 'var(--color-error)'
      default:
        return 'var(--color-text-muted)'
    }
  }

  const getStatusLabel = (status: string): string => {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  return (
    <tr>
      <td
        style={{
          padding: '12px 16px',
          fontSize: '13px',
          color: 'var(--color-text)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        {withdrawal.eventName}
      </td>
      <td
        style={{
          padding: '12px 16px',
          fontSize: '13px',
          color: 'var(--color-text)',
          borderBottom: '1px solid var(--color-border)',
          fontWeight: 600,
        }}
      >
        {formatNaira(withdrawal.amount)}
      </td>
      <td
        style={{
          padding: '12px 16px',
          fontSize: '13px',
          color: 'var(--color-text)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        {withdrawal.acctName}
      </td>
      <td
        style={{
          padding: '12px 16px',
          fontSize: '13px',
          color: 'var(--color-text)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        {withdrawal.bankName}
      </td>
      <td
        style={{
          padding: '12px 16px',
          fontSize: '13px',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            padding: '4px 8px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: `${getStatusColor(withdrawal.status)}15`,
            color: getStatusColor(withdrawal.status),
            fontWeight: 600,
            fontSize: '12px',
          }}
        >
          {getStatusLabel(withdrawal.status)}
        </span>
      </td>
      <td
        style={{
          padding: '12px 16px',
          fontSize: '13px',
          color: 'var(--color-text-muted)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        {formatDate(withdrawal.createdAt)}
      </td>
    </tr>
  )
}
