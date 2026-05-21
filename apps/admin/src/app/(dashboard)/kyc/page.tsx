'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { LoadingSpinner, ErrorMessage, Badge } from '@comfytag/ui'
import type { User } from '@comfytag/types'
import api from '@/lib/api'
import { DataTable } from '@comfytag/ui'
import type { ColumnDef } from '@comfytag/ui'
import { PageHeader } from '@comfytag/ui'

// ─── Fetch ─────────────────────────────────────────────
const fetchUsers = async (): Promise<User[]> => {
  const { data } = await api.get<User[]>('/admin/users')
  return data
}

// ─── Table columns ─────────────────────────────────────
const columns: ColumnDef<User>[] = [
  {
    key: 'name',
    header: 'Organizer',
    render: (u) => (
      <Link
        href={`/kyc/${u._id}`}
        style={{ color: 'var(--color-brand)', textDecoration: 'none', fontWeight: 500 }}
      >
        {u.name}
      </Link>
    ),
  },
  { key: 'email', header: 'Email', render: (u) => u.email },
  { key: 'emailV', header: 'Email Verified', render: (u) => <Badge status={u.isVerify?.email ? 'verified' : 'pending'} /> },
  { key: 'photo', header: 'Photo', render: (u) => <Badge status={u.isVerify?.photo ? 'verified' : 'pending'} /> },
  { key: 'idcard', header: 'ID Card', render: (u) => <Badge status={u.isVerify?.idCard ? 'verified' : 'pending'} /> },
  { key: 'address', header: 'Address', render: (u) => <Badge status={u.isVerify?.address ? 'verified' : 'pending'} /> },
]

// ─── Page ──────────────────────────────────────────────
export default function KycPage() {
  useSession({ required: true })

  const { data: users, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: fetchUsers,
  })

  const organizers = (users ?? []).filter((u) => u.isPartner)

  if (isLoading) return <LoadingSpinner size="lg" centered />

  if (isError) {
    return (
      <ErrorMessage
        message="Failed to load KYC data"
        onRetry={() => void refetch()}
      />
    )
  }

  return (
    <div>
      <PageHeader
        title="KYC Review"
        subtitle={isLoading ? 'Loading...' : `${organizers.length} organizers`}
      />

      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 12,
          padding: 24,
        }}
      >
        <DataTable<User> columns={columns} data={organizers} isLoading={isLoading} />
      </div>
    </div>
  )
}
