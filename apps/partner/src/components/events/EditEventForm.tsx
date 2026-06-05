'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useMutation } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { Button, Input, Modal, ErrorMessage, MediaUploader } from '@comfytag/ui'
import type { Event } from '@comfytag/types'
import { NIGERIAN_STATES, EVENT_CATEGORIES } from '@comfytag/utils'
import { PerformerTag } from './PerformerTag'
import { TierListRow } from './TierListRow'
import { fieldStyle, selectStyle, labelStyle, fieldGroupStyle, twoColGrid, cardStyleWithMargin } from '@/lib/formStyles'
import { api } from '@/lib/api'

interface TierInput {
  name: string
  price: string
  capacity: string
}

interface EditEventFormProps {
  event: Event
  eventId: string
}

export function EditEventForm({ event, eventId }: EditEventFormProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const { mutate, isPending } = useMutation({
    mutationFn: (body: object) =>
      api.put(`/events/${eventId}`, body).then(r => r.data),
    onSuccess: () => router.push(`/events/${eventId}`),
  })
  const [form, setForm] = useState({
    name: '',
    category: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    venue: '',
    address: '',
    state: '',
  })
  const [tiers, setTiers] = useState<TierInput[]>([])
  const [performers, setPerformers] = useState<string[]>([])
  const [performerInput, setPerformerInput] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [videoUrl, setVideoUrl] = useState('')
  const [tierModal, setTierModal] = useState(false)
  const [currentTier, setCurrentTier] = useState<TierInput>({ name: '', price: '', capacity: '' })
  const [tierError, setTierError] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    setForm({
      name: event.name ?? '',
      category: event.category ?? '',
      description: event.description ?? '',
      date: event.date ? new Date(event.date).toISOString().split('T')[0] : '',
      startTime: event.startTime ?? '',
      endTime: event.endTime ?? '',
      venue: event.venue ?? '',
      address: event.address ?? '',
      state: event.state ?? '',
    })
    setTiers(
      event.ticketType?.map(t => ({ name: t.name, price: t.price.toString(), capacity: t.capacity.toString() })) ?? []
    )
    setPerformers(event.performers?.map(p => (typeof p === 'string' ? p : p.name)) ?? [])
    setImages(event.images ?? [])
  }, [event])

  async function handleUpload(file: File): Promise<string> {
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      return data.url
    } catch (err) {
      setError('Failed to upload file. Please try again.')
      throw err
    }
  }

  function handleAddTier() {
    const price = Number(currentTier.price)
    const capacity = Number(currentTier.capacity)
    if (!currentTier.name || price < 0 || capacity <= 0) {
      setTierError('Please enter a valid name, price â‰¥ 0, and capacity > 0.')
      return
    }
    setTiers([...tiers, currentTier])
    setCurrentTier({ name: '', price: '', capacity: '' })
    setTierError('')
    setTierModal(false)
  }

  function handleRemoveTier(index: number) {
    setTiers(tiers.filter((_, i) => i !== index))
  }

  function handleAddPerformer() {
    if (!performerInput.trim()) return
    setPerformers([...performers, performerInput.trim()])
    setPerformerInput('')
  }

  function handleRemovePerformer(index: number) {
    setPerformers(performers.filter((_, i) => i !== index))
  }

  function handleSubmit() {
    if (tiers.length === 0) {
      setError('Add at least one ticket tier')
      return
    }
    setError('')
    mutate({
      ...form,
      ticketType: tiers.map(t => ({ name: t.name, price: Number(t.price), capacity: Number(t.capacity) })),
      performers: performers.length > 0 ? performers : undefined,
      images,
    })
  }

  return (
    <div style={{ maxWidth: '720px' }}>
      <div style={cardStyleWithMargin}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 20px 0', color: 'var(--color-text)' }}>
          Event Details
        </h2>

        <div style={fieldGroupStyle}>
          <Input
            label="Event Name"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>

        <div style={fieldGroupStyle}>
          <label style={labelStyle}>Description</label>
          <textarea
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            style={{ ...fieldStyle, height: '100px', resize: 'vertical' }}
          />
        </div>

        <div style={{ ...twoColGrid, marginBottom: '20px' }}>
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Category</label>
            <select
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
              style={selectStyle}
            >
              <option value="">Select category</option>
              {EVENT_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Date</label>
            <input
              type="date"
              value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })}
              style={fieldStyle}
            />
          </div>
        </div>

        <div style={{ ...twoColGrid, marginBottom: '20px' }}>
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Start Time</label>
            <input
              type="time"
              value={form.startTime}
              onChange={e => setForm({ ...form, startTime: e.target.value })}
              style={fieldStyle}
            />
          </div>
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>End Time</label>
            <input
              type="time"
              value={form.endTime}
              onChange={e => setForm({ ...form, endTime: e.target.value })}
              style={fieldStyle}
            />
          </div>
        </div>

        <div style={fieldGroupStyle}>
          <Input
            label="Venue"
            value={form.venue}
            onChange={e => setForm({ ...form, venue: e.target.value })}
          />
        </div>

        <div style={{ ...twoColGrid, marginBottom: '20px' }}>
          <div style={fieldGroupStyle}>
            <Input
              label="Address"
              value={form.address}
              onChange={e => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>State</label>
            <select
              value={form.state}
              onChange={e => setForm({ ...form, state: e.target.value })}
              style={selectStyle}
            >
              <option value="">Select state</option>
              {NIGERIAN_STATES.map(s => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={fieldGroupStyle}>
          <label style={labelStyle}>Performers/Lineup (Optional)</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={performerInput}
              onChange={e => setPerformerInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddPerformer()}
              placeholder="Add performer name and press Enter"
              style={fieldStyle}
            />
            <Button variant="ghost" size="sm" onClick={handleAddPerformer}>
              <Plus size={16} />
            </Button>
          </div>
          {performers.length > 0 && (
            <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {performers.map((performer, idx) => (
                <PerformerTag key={idx} name={performer} onRemove={() => handleRemovePerformer(idx)} />
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={cardStyleWithMargin}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: 'var(--color-text)' }}>
            Ticket Tiers
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setTierModal(true)
              setTierError('')
            }}
          >
            <Plus size={14} /> Add Tier
          </Button>
        </div>

        {tiers.length === 0 ? (
          <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', padding: '20px', textAlign: 'center', margin: 0 }}>
            No ticket tiers yet. Add at least one.
          </p>
        ) : (
          <div>
            {tiers.map((tier, i) => (
              <TierListRow
                key={i}
                name={tier.name}
                price={tier.price}
                capacity={tier.capacity}
                onRemove={() => handleRemoveTier(i)}
              />
            ))}
          </div>
        )}
      </div>

      <div style={cardStyleWithMargin}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 20px 0', color: 'var(--color-text)' }}>
          Event Media
        </h2>

        <div style={fieldGroupStyle}>
          <MediaUploader
            label="Event Images"
            accept="image"
            multiple
            urls={images}
            onAdd={(newUrls) => setImages([...images, ...newUrls])}
            onRemove={(url) => setImages(images.filter(u => u !== url))}
            uploadFn={handleUpload}
          />
        </div>

        <div style={fieldGroupStyle}>
          <MediaUploader
            label="Promo Video (Optional)"
            accept="video"
            urls={videoUrl ? [videoUrl] : []}
            onAdd={(newUrls) => setVideoUrl(newUrls[0] ?? '')}
            onRemove={() => setVideoUrl('')}
            uploadFn={handleUpload}
          />
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: '20px' }}>
          <ErrorMessage message={error} />
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px', maxWidth: '720px' }}>
        <a href={`/events/${eventId}`} style={{ textDecoration: 'none' }}>
          <Button variant="ghost">Cancel</Button>
        </a>
        <Button variant="primary" loading={isPending} onClick={handleSubmit} fullWidth>
          Save Changes
        </Button>
      </div>

      <Modal
        isOpen={tierModal}
        onClose={() => setTierModal(false)}
        title="Add Ticket Tier"
        footer={
          <>
            <Button variant="ghost" onClick={() => setTierModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAddTier}>
              Add Tier
            </Button>
          </>
        }
      >
        <Input
          label="Tier Name"
          placeholder="e.g. Regular, VIP, VVIP"
          value={currentTier.name}
          onChange={e => setCurrentTier({ ...currentTier, name: e.target.value })}
        />
        <div style={{ ...twoColGrid, marginTop: '16px' }}>
          <Input
            label="Price (â‚¦)"
            type="number"
            placeholder="0"
            value={currentTier.price}
            onChange={e => setCurrentTier({ ...currentTier, price: e.target.value })}
          />
          <Input
            label="Capacity"
            type="number"
            placeholder="0"
            value={currentTier.capacity}
            onChange={e => setCurrentTier({ ...currentTier, capacity: e.target.value })}
          />
        </div>
        {tierError && (
          <div style={{ marginTop: '12px' }}>
            <ErrorMessage message={tierError} />
          </div>
        )}
      </Modal>
    </div>
  )
}

