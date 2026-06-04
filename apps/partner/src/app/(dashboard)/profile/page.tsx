'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Input, Modal, Skeleton, EmptyState, ErrorMessage, StatCard } from '@comfytag/ui'
import { formatNaira, authHeader } from '@comfytag/utils'
import { type User, type PartnerAnalytics, type Event } from '@comfytag/types'
import { Calendar, Users, TrendingUp } from 'lucide-react'
import { ProfileCoverHeader } from '@/components/profile/ProfileCoverHeader'
import { ImageUploadInput } from '@/components/ui/ImageUploadInput'
import { EventFilterTabs } from '@/components/events/EventFilterTabs'
import { EventCard } from '@/components/ui/EventCard'
import api from '@/lib/api'

interface FormData {
  name: string
  phone: string
  avatar: string
  bgImg: string
}

export default function ProfilePage() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const userId = session?.user?.id

  // State
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming')
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    avatar: '',
    bgImg: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  // Queries
  const profileQuery = useQuery<User | null>({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId || !session?.user?.token) return null
      const response = await api.get(`/users/${userId}`, authHeader(session.user.token))
      return response.data ?? null
    },
    enabled: !!userId && !!session?.user?.token,
  })

  const analyticsQuery = useQuery<PartnerAnalytics | null>({
    queryKey: ['partnerAnalytics', userId],
    queryFn: async () => {
      if (!userId || !session?.user?.token) return null
      const response = await api.get(`/partner/${userId}/analytics`, authHeader(session.user.token))
      return response.data ?? null
    },
    enabled: !!userId && !!session?.user?.token,
  })

  const eventsQuery = useQuery<Event[]>({
    queryKey: ['events-profile', userId],
    queryFn: async () => {
      if (!userId || !session?.user?.token) return []
      const response = await api.get(`/events/user/${userId}`, authHeader(session.user.token))
      return response.data ?? []
    },
    enabled: !!userId && !!session?.user?.token,
  })

  // Handlers
  const handleEditClick = () => {
    setFormData({
      name: profileQuery.data?.name || session?.user?.name || '',
      phone: profileQuery.data?.phone || '',
      avatar: profileQuery.data?.avatar ?? profileQuery.data?.image ?? '',
      bgImg: profileQuery.data?.bgImg || '',
    })
    setEditError(null)
    setIsEditing(true)
  }

  const handleFormChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    if (!userId || !session?.user?.token) return

    setIsSubmitting(true)
    setEditError(null)

    try {
      await api.patch(`/users/${userId}`, { ...formData, image: formData.avatar }, authHeader(session.user.token))
      queryClient.invalidateQueries({ queryKey: ['profile', userId] })
      setIsEditing(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update profile'
      setEditError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Filter events
  const upcomingEvents = eventsQuery.data?.filter((e) => e.status === 'published') ?? []
  const pastEvents = eventsQuery.data?.filter((e) => e.status === 'ended') ?? []
  const displayedEvents = activeTab === 'upcoming' ? upcomingEvents : pastEvents

  // Render content
  if (profileQuery.isLoading || analyticsQuery.isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-[200px] w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    )
  }

  if (profileQuery.isError || analyticsQuery.isError) {
    return <ErrorMessage message="Failed to load profile. Please try refreshing the page." />
  }

  const profile = profileQuery.data
  const analytics = analyticsQuery.data

  return (
    <div className="relative space-y-6">
      {/* Cover Header with Avatar */}
      <ProfileCoverHeader name={profile?.name ?? 'U'} avatar={profile?.avatar ?? profile?.image} coverImage={profile?.bgImg} />

      {/* Name and Edit Button */}
      <div className="flex flex-col gap-4 pt-0 sm:flex-row sm:items-center sm:justify-between" style={{ marginTop: 56}}>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {profile?.name || 'Organizer'}
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            @{profile?.username || 'username'}
          </p>
        </div>
        <Button variant="primary" onClick={handleEditClick}>
          Edit Profile
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={Calendar}
          label="Events"
          value={String(analytics?.totalEvents ?? 0)}
        />
        <StatCard
          icon={Users}
          label="Followers"
          value={String(analytics?.followers ?? 0)}
        />
        <StatCard
          icon={TrendingUp}
          label="Revenue"
          value={formatNaira(analytics?.totalLifetimeRevenue ?? 0)}
        />
      </div>

      {/* Tabs */}
      <EventFilterTabs
        active={activeTab}
        onChange={(tab) => setActiveTab(tab as 'upcoming' | 'past')}
        tabs={[
          { label: 'Upcoming', value: 'upcoming' },
          { label: 'Past', value: 'past' },
        ]}
      />

      {/* Event Grid */}
      {eventsQuery.isLoading ? (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-lg" />
          ))}
        </div>
      ) : displayedEvents.length === 0 ? (
        <EmptyState title="No events yet" />
      ) : (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
          {displayedEvents.map((event) => (
            <EventCard
              key={event._id}
              event={event}
              href={`/events/${event._id}`}
              onEdit={() => {
                window.location.href = `/events/${event._id}/edit`
              }}
            />
          ))}
        </div>
      )}

      {/* Edit Profile Modal */}
      <Modal isOpen={isEditing} onClose={() => setIsEditing(false)} title="Edit Profile">
        <div className="space-y-4">
          {editError && <ErrorMessage message={editError} />}

          <div>
            <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
              Name
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => handleFormChange('name', e.target.value)}
              placeholder="Your name"
              disabled={isSubmitting}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
              Phone
            </label>
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleFormChange('phone', e.target.value)}
              placeholder="Your phone number"
              disabled={isSubmitting}
              className="mt-1"
            />
          </div>

          <div>
            <ImageUploadInput
              label="Avatar"
              value={formData.avatar}
              onChange={(url) => setFormData(p => ({ ...p, avatar: url }))}
              previewShape="circle"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <ImageUploadInput
              label="Cover Image"
              value={formData.bgImg}
              onChange={(url) => setFormData(p => ({ ...p, bgImg: url }))}
              previewShape="rect"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="ghost"
              onClick={() => setIsEditing(false)}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
