'use client'

import { useState, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import { Download, Search } from 'lucide-react'
import { Badge, Button, Input, DataTable, ErrorMessage } from '@comfytag/ui'
import type { Ticket as TicketType } from '@comfytag/types'
import { formatNaira, formatDate } from '@comfytag/utils'
import { api } from '@/lib/api'

const ATTENDEES_PER_PAGE = 25

interface ColumnDef<T> {
  key: string
  header: string
  render: (row: T) => React.ReactNode
}

const attendeeColumns: ColumnDef<TicketType>[] = [
  {
    key: 'name',
    header: 'Name',
    render: (row) => <span style={{ fontWeight: 500 }}>{row.name}</span>,
  },
  {
    key: 'email',
    header: 'Email',
    render: (row) => String(row.email ?? ''),
  },
  {
    key: 'numOfTicket',
    header: 'Tickets',
    render: (row) => String(row.numOfTicket ?? 1),
  },
  {
    key: 'amount',
    header: 'Amount',
    render: (row) => formatNaira((row.amount as number) ?? 0),
  },
  {
    key: 'date',
    header: 'Date',
    render: (row) => formatDate(String(row.date ?? '')),
  },
  {
    key: 'status',
    header: 'Status',
    render: (row) => <Badge status={String(row.status ?? '')} />,
  },
]

interface AttendeesSectionProps {
  eventId: string
}

export function AttendeesSection({ eventId }: AttendeesSectionProps) {
  const { data: session } = useSession()
  const [attendeesPage, setAttendeesPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string | null>(null)

  const attendeesQuery = useQuery<TicketType[]>({
    queryKey: ['audience', eventId, attendeesPage],
    queryFn: () =>
      api
        .get<{ data: TicketType[] }>('/audience/event/' + eventId, {
          params: { page: attendeesPage, limit: ATTENDEES_PER_PAGE },
          })
        .then((r) => r.data.data || []),
    enabled: !!eventId && eventId !== 'undefined' && !!session?.user?.token,
  })

  const rawAttendees = attendeesQuery.data ?? []

  const attendees = useMemo(() => {
    let filtered = rawAttendees
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (a) =>
          a.name?.toLowerCase().includes(q) ||
          a.email?.toLowerCase().includes(q) ||
          a.phone?.toString().includes(q)
      )
    }
    if (filterStatus) {
      filtered = filtered.filter((a) => a.status === filterStatus)
    }
    return filtered
  }, [rawAttendees, searchQuery, filterStatus])

  const handleExportCSV = async () => {
    try {
      const response = await api.get(`/audience/events/${eventId}/audience/export`, {
        responseType: 'text',
      })
      const csv = response.data
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `attendees.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error('Failed to export CSV:', err)
    }
  }

  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>
            Attendees ({attendees.length})
          </h2>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExportCSV}
            >
              <Download size={16} /> Export CSV
            </Button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              variant={filterStatus === null ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilterStatus(null)}
            >
              All
            </Button>
            <Button
              variant={filterStatus === 'active' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilterStatus('active')}
            >
              Active
            </Button>
            <Button
              variant={filterStatus === 'used' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilterStatus('used')}
            >
              Used
            </Button>
            <Button
              variant={filterStatus === 'transferred' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilterStatus('transferred')}
            >
              Transferred
            </Button>
          </div>
        </div>
      </div>

      {attendeesQuery.isError && (
        <div style={{ padding: '16px 20px' }}>
          <ErrorMessage message="Failed to load attendees." />
        </div>
      )}

      <DataTable
        columns={attendeeColumns}
        data={attendees}
        isLoading={attendeesQuery.isLoading}
        keyField="_id"
        emptyTitle="No attendees yet"
        emptySubtitle="Tickets sold will appear here"
      />

      {!attendeesQuery.isLoading &&
        attendees.length > 0 &&
        attendees.length % ATTENDEES_PER_PAGE === 0 && (
          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--color-border)', textAlign: 'center' }}>
            <Button variant="ghost" onClick={() => setAttendeesPage(attendeesPage + 1)}>
              Load More Attendees
            </Button>
          </div>
        )}
    </div>
  )
}

