'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Users, Ticket, Banknote, Archive, Download, Search } from 'lucide-react'
import type { Event, Ticket as TicketType, TierStats } from '@comfytag/types'
import { formatNaira, formatDate } from '@comfytag/utils'
import { Badge, LoadingSpinner, ErrorMessage, Modal, Button, Input, StatCard, DataTable, PageHeader, MediaUploader } from '@comfytag/ui'
import type { ColumnDef } from '@comfytag/ui'
import { Breadcrumb } from '../../../../components/ui/Breadcrumb'
import { TierProgressCard } from '../../../../components/events/TierProgressCard'
import api, { authHeader } from '../../../../lib/api'

const ATTENDEES_PER_PAGE = 25

interface TierStatsResponse {
  eventId: string
  tiers: TierStats[]
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

export default function EventDetailPage() {
  const params = useParams<{ id: string }>()
  const eventId = params.id
  const { data: session } = useSession()

  const queryClient = useQueryClient()
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelError, setCancelError] = useState('')
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [showDraftModal, setShowDraftModal] = useState(false)
  const [statusError, setStatusError] = useState('')
  const [attendeesPage, setAttendeesPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string | null>(null)
  const [recapPhotos, setRecapPhotos] = useState<string[]>([])

  const eventQuery = useQuery<Event>({
    queryKey: ['event', eventId],
    queryFn: () => api.get<Event>('/events/' + eventId, authHeader(session?.user.token)).then((r) => r.data),
    enabled: !!eventId && eventId !== 'undefined' && !!session?.user?.token,
  })

  const attendeesQuery = useQuery<TicketType[]>({
    queryKey: ['audience', eventId, attendeesPage],
    queryFn: () =>
      api
        .get<{ data: TicketType[] }>('/audience/event/' + eventId, {
          params: { page: attendeesPage, limit: ATTENDEES_PER_PAGE },
          ...authHeader(session?.user.token),
        })
        .then((r) => r.data.data || []),
    enabled: !!eventId && eventId !== 'undefined' && !!session?.user?.token,
  })

  const tierStatsQuery = useQuery<TierStatsResponse>({
    queryKey: ['tierStats', eventId],
    queryFn: () =>
      api
        .get<TierStatsResponse>('/events/' + eventId + '/tiers/stats', authHeader(session?.user.token))
        .then((r) => r.data),
    enabled: !!eventId && eventId !== 'undefined' && !!session?.user?.token,
  })

  const cancelMutation = useMutation({
    mutationFn: () =>
      api.patch('/events/' + eventId, { status: 'cancelled' }, authHeader(session?.user.token)).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] })
      queryClient.invalidateQueries({ queryKey: ['events', session?.user?.id] })
      setShowCancelModal(false)
      setCancelError('')
    },
    onError: () => {
      setCancelError('Failed to cancel event. Please try again.')
    },
  })

  const statusMutation = useMutation({
    mutationFn: (status: 'published' | 'draft') =>
      api.patch('/events/' + eventId, { status }, authHeader(session?.user.token)).then((r) => r.data),
    onSuccess: (_data, status) => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] })
      queryClient.invalidateQueries({ queryKey: ['events', session?.user?.id] })
      setStatusError('')
      if (status === 'published') setShowPublishModal(false)
      else setShowDraftModal(false)
    },
    onError: (_err, status) => {
      setStatusError(
        status === 'published'
          ? 'Failed to publish event. Please try again.'
          : 'Failed to move event to draft. Please try again.'
      )
    },
  })

  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      const response = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data', ...authHeader(session?.user.token).headers },
      })
      return response.data.url
    },
  })

  const updateRecapPhotosMutation = useMutation({
    mutationFn: (photos: string[]) =>
      api.patch('/events/' + eventId, { recapPhotos: photos }, authHeader(session?.user.token)).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] })
    },
  })

  const event = eventQuery.data
  const rawAttendees = attendeesQuery.data ?? []
  const totalCapacity = (event?.ticketType ?? []).reduce((s, t) => s + t.capacity, 0)
  const avgTierPrice = event?.ticketType?.length
    ? event.ticketType.reduce((s, t) => s + t.price, 0) / event.ticketType.length
    : 0
  const estimatedRevenue = (event?.sold ?? 0) * avgTierPrice
  const available = Math.max(0, totalCapacity - (event?.sold ?? 0))

  // Filter attendees by search and status
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

  React.useEffect(() => {
    if (event?.recapPhotos) {
      setRecapPhotos(event.recapPhotos)
    }
  }, [event?.recapPhotos])

  // Export to CSV
  const handleExportCSV = async () => {
    try {
      const response = await api.get(`/audience/events/${eventId}/audience/export`, {
        ...authHeader(session?.user.token),
        responseType: 'text',
      })
      const csv = response.data
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `${event?.name || 'attendees'}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error('Failed to export CSV:', err)
    }
  }

  function handleAddRecapPhotos(urls: string[]) {
    const updatedPhotos = [...recapPhotos, ...urls]
    setRecapPhotos(updatedPhotos)
    updateRecapPhotosMutation.mutate(updatedPhotos)
  }

  function handleRemoveRecapPhoto(url: string) {
    const updatedPhotos = recapPhotos.filter((p) => p !== url)
    setRecapPhotos(updatedPhotos)
    updateRecapPhotosMutation.mutate(updatedPhotos)
  }

  if (eventQuery.isLoading) {
    return (
      <div
        style={{
          minHeight: '400px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <LoadingSpinner centered size="lg" />
      </div>
    )
  }

  if (eventQuery.isError) {
    return (
      <div style={{ padding: '24px' }}>
        <ErrorMessage message="Failed to load event." />
      </div>
    )
  }

  return (
    <div style={{ padding: '28px 32px' }}>
      <Breadcrumb items={[{ label: 'Events', href: '/events' }, { label: event?.name ?? 'Event' }]} />
      <PageHeader
        title={event?.name ?? 'Event'}
        subtitle={event ? formatDate(event.date) + ' · ' + (event.venue ?? '') : ''}
        action={
          <div style={{ display: 'flex', gap: '12px' }}>
            <Link
              href="/events"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                color: 'var(--color-text-muted)',
                fontSize: '14px',
                textDecoration: 'none',
              }}
            >
              <ArrowLeft size={16} /> All Events
            </Link>
            {event && (
              <>
                <Link href={`/events/${eventId}/edit`}>
                  <Button variant="ghost" size="sm">Edit Event</Button>
                </Link>
                {event.status === 'draft' && (
                  <Button variant="primary" size="sm" onClick={() => { setStatusError(''); setShowPublishModal(true) }}>
                    Publish
                  </Button>
                )}
                {event.status === 'published' && (
                  <Button variant="ghost" size="sm" onClick={() => { setStatusError(''); setShowDraftModal(true) }}>
                    Move to Draft
                  </Button>
                )}
                {event.status !== 'cancelled' && event.status !== 'ended' && (
                  <Button variant="danger" size="sm" onClick={() => setShowCancelModal(true)}>
                    Cancel Event
                  </Button>
                )}
              </>
            )}
          </div>
        }
      />

      {event && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '24px',
            flexWrap: 'wrap',
          }}
        >
          <Badge
            status={
              event.status === 'published'
                ? 'approved'
                : event.status === 'cancelled'
                  ? 'rejected'
                  : event.status
            }
          />
          <span style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
            {event.address}, {event.state}
          </span>
          <span style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
            {event.startTime} – {event.endTime}
          </span>
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        <StatCard
          icon={Users}
          value={(event?.sold ?? 0).toLocaleString('en-NG')}
          label="Tickets Sold"
          isLoading={eventQuery.isLoading}
        />
        <StatCard
          icon={Archive}
          value={available.toLocaleString('en-NG')}
          label="Available"
          isLoading={eventQuery.isLoading}
        />
        <StatCard
          icon={Banknote}
          value={formatNaira(estimatedRevenue)}
          label="Est. Revenue"
          isLoading={eventQuery.isLoading}
        />
        <StatCard
          icon={Ticket}
          value={totalCapacity.toLocaleString('en-NG')}
          label="Total Capacity"
          isLoading={eventQuery.isLoading}
        />
      </div>

      {/* Per-Tier Breakdown */}
      {tierStatsQuery.data?.tiers && tierStatsQuery.data.tiers.length > 0 && (
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            overflow: 'hidden',
            marginBottom: '32px',
          }}
        >
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>
              Ticket Tiers Breakdown
            </h2>
          </div>
          <div style={{ padding: '16px 20px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
              }}
            >
              {tierStatsQuery.data.tiers.map((tier) => (
                <TierProgressCard key={tier._id} tier={tier} />
              ))}
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>
              Attendees ({attendees.length})
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExportCSV}
              style={{ display: 'flex', gap: '6px', alignItems: 'center' }}
            >
              <Download size={16} /> Export CSV
            </Button>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%' }}
                prefix={<Search size={16} />}
              />
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

      {event?.status === 'ended' && (
        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '24px',
            marginTop: '24px',
          }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 8px 0' }}>
            Event Recap Photos
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: '0 0 16px 0' }}>
            Upload photos from your event to share with attendees
          </p>
          <MediaUploader
            label="Recap Photos"
            accept="image"
            multiple={true}
            urls={recapPhotos}
            onAdd={handleAddRecapPhotos}
            onRemove={handleRemoveRecapPhoto}
            uploadFn={uploadFileMutation.mutateAsync}
          />
        </div>
      )}

      <Modal
        isOpen={showCancelModal}
        onClose={() => {
          setShowCancelModal(false)
          setCancelError('')
        }}
        title="Cancel Event"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowCancelModal(false)}>
              Keep Event
            </Button>
            <Button
              variant="danger"
              loading={cancelMutation.isPending}
              onClick={() => cancelMutation.mutate()}
            >
              Yes, Cancel Event
            </Button>
          </>
        }
      >
        <p style={{ fontSize: '14px', color: 'var(--color-text)', lineHeight: '1.6' }}>
          Are you sure you want to cancel <strong>{event?.name}</strong>? This action cannot be
          undone. Attendees who purchased tickets will need to be refunded manually.
        </p>
        {cancelError && (
          <div style={{ marginTop: '16px' }}>
            <ErrorMessage message={cancelError} />
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showPublishModal}
        onClose={() => { setShowPublishModal(false); setStatusError('') }}
        title="Publish Event"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowPublishModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={statusMutation.isPending}
              onClick={() => statusMutation.mutate('published')}
            >
              Yes, Publish Event
            </Button>
          </>
        }
      >
        <p style={{ fontSize: '14px', color: 'var(--color-text)', lineHeight: '1.6' }}>
          Publishing <strong>{event?.name}</strong> will make it visible to the public and notify
          your followers. Are you ready to go live?
        </p>
        {statusError && (
          <div style={{ marginTop: '16px' }}>
            <ErrorMessage message={statusError} />
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showDraftModal}
        onClose={() => { setShowDraftModal(false); setStatusError('') }}
        title="Move to Draft"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowDraftModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={statusMutation.isPending}
              onClick={() => statusMutation.mutate('draft')}
            >
              Yes, Move to Draft
            </Button>
          </>
        }
      >
        <p style={{ fontSize: '14px', color: 'var(--color-text)', lineHeight: '1.6' }}>
          Moving <strong>{event?.name}</strong> back to draft will hide it from the public. You
          can re-publish it at any time.
        </p>
        {statusError && (
          <div style={{ marginTop: '16px' }}>
            <ErrorMessage message={statusError} />
          </div>
        )}
      </Modal>
    </div>
  )
}
