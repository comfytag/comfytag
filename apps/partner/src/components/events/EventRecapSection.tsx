'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MediaUploader } from '@comfytag/ui'
import type { Event } from '@comfytag/types'
import { api } from '@/lib/api'

interface EventRecapSectionProps {
  eventId: string
}

export function EventRecapSection({ eventId }: EventRecapSectionProps) {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [recapPhotos, setRecapPhotos] = useState<string[]>([])

  const eventQuery = useQuery<Event>({
    queryKey: ['event', eventId],
    queryFn: () => api.get<Event>('/events/' + eventId).then(r => r.data),
    enabled: !!eventId && eventId !== 'undefined' && !!session?.user?.token,
  })

  useEffect(() => {
    if (eventQuery.data?.recapPhotos) {
      setRecapPhotos(eventQuery.data.recapPhotos)
    }
  }, [eventQuery.data?.recapPhotos])

  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      const response = await api.post('/upload', formData)
      return response.data.url
    },
  })

  const updateRecapPhotosMutation = useMutation({
    mutationFn: (photos: string[]) =>
      api.patch('/events/' + eventId, { recapPhotos: photos }).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] })
    },
  })

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

  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        padding: '24px',
        marginTop: '32px',
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
  )
}

