'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useMutation } from '@tanstack/react-query'
import Link from 'next/link'
import { ArrowLeft, Plus } from 'lucide-react'
import { Button, Input, Modal, ErrorMessage, PageHeader, MediaUploader } from '@comfytag/ui'
import { NIGERIAN_STATES, EVENT_CATEGORIES } from '@comfytag/utils'
import api, { authHeader } from '@/lib/api'
import { fieldStyle, selectStyle, labelStyle, fieldGroupStyle, twoColGrid, cardStyle } from '@/lib/formStyles'
import { PerformerTag } from '@/components/events/PerformerTag'
import { TierListRow } from '@/components/events/TierListRow'

interface Step1Form {
  name: string
  category: string
  description: string
  date: string
  startTime: string
  endTime: string
  venue: string
  address: string
  state: string
}

interface TierInput {
  name: string
  price: string
  capacity: string
}

export default function CreateEventPage() {
  const router = useRouter()
  const { data: session } = useSession()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [form, setForm] = useState<Step1Form>({
    name: '', category: '', description: '', date: '',
    startTime: '', endTime: '', venue: '', address: '', state: '',
  })
  const [tiers, setTiers] = useState<TierInput[]>([])
  const [tierModal, setTierModal] = useState(false)
  const [currentTier, setCurrentTier] = useState<TierInput>({ name: '', price: '', capacity: '' })
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [performers, setPerformers] = useState<string[]>([])
  const [performerInput, setPerformerInput] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [videoUrls, setVideoUrls] = useState<string[]>([])
  const [step1Error, setStep1Error] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [tierError, setTierError] = useState('')

  const { mutate, isPending } = useMutation({
    mutationFn: (body: object) =>
      api.post('/events/' + session!.user.id, body, authHeader(session?.user.token)).then(r => r.data),
    onSuccess: (data: { _id: string }) => router.push('/events/' + data._id),
    onError: () => setSubmitError('Failed to create event. Please try again.'),
  })

  function handleStep1Next() {
    const emptyFields: string[] = []
    if (!form.name) emptyFields.push('Event Name')
    if (!form.category) emptyFields.push('Category')
    if (!form.description) emptyFields.push('Description')
    if (!form.date) emptyFields.push('Date')
    if (!form.startTime) emptyFields.push('Start Time')
    if (!form.endTime) emptyFields.push('End Time')
    if (!form.venue) emptyFields.push('Venue')
    if (!form.address) emptyFields.push('Address')
    if (!form.state) emptyFields.push('State')
    if (emptyFields.length > 0) {
      setStep1Error(`Please fill in: ${emptyFields.join(', ')}`)
      return
    }
    setStep(2)
    setStep1Error('')
  }

  function handleAddTier() {
    const price = Number(currentTier.price)
    const capacity = Number(currentTier.capacity)
    if (!currentTier.name || price < 0 || capacity <= 0) {
      setTierError('Please enter a valid name, price ≥ 0, and capacity > 0.')
      return
    }
    if (editingIndex !== null) {
      // Update existing tier
      const updated = [...tiers]
      updated[editingIndex] = currentTier
      setTiers(updated)
      setEditingIndex(null)
    } else {
      // Add new tier
      setTiers([...tiers, currentTier])
    }
    setCurrentTier({ name: '', price: '', capacity: '' })
    setTierError('')
    setTierModal(false)
  }

  function handleEditTier(index: number) {
    setCurrentTier(tiers[index])
    setEditingIndex(index)
    setTierModal(true)
    setTierError('')
  }

  function handleOpenTierModal() {
    setCurrentTier({ name: '', price: '', capacity: '' })
    setEditingIndex(null)
    setTierModal(true)
    setTierError('')
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

  async function handleUpload(file: File): Promise<string> {
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await api.post<{ url: string }>('/upload', fd, authHeader(session?.user.token))
      return res.data.url
    } catch (error) {
      setSubmitError('Failed to upload file. Please try again.')
      throw error
    }
  }

  function handleStep2Next() {
    if (tiers.length === 0) {
      setSubmitError('Add at least one ticket tier')
      return
    }
    setSubmitError('')
    setStep(3)
  }

  function handleSubmit(status: 'draft' | 'published') {
    mutate({
      name: form.name,
      category: form.category,
      description: form.description,
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      venue: form.venue,
      address: form.address,
      state: form.state,
      ticketType: tiers.map(t => ({ name: t.name, price: Number(t.price), capacity: Number(t.capacity) })),
      performers: performers.length > 0 ? performers : undefined,
      images,
      videoUrl: videoUrls[0] ?? '',
      status,
    })
  }

  return (
    <div style={{ padding: '28px 32px' }}>
      <PageHeader
        title="Create Event"
        subtitle="Fill in the details for your new event"
        action={
          <Link
            href="/events"
            style={{
              color: 'var(--color-text-muted)',
              fontSize: '14px',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <ArrowLeft size={16} /> Back
          </Link>
        }
      />

      <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '24px', marginTop: 0 }}>
        {step === 1 ? 'Step 1 of 3: Event Details' : step === 2 ? 'Step 2 of 3: Ticket Tiers' : 'Step 3 of 3: Media'}
      </p>

      <div style={{ maxWidth: '720px' }}>
        {step === 1 && (
          <div style={cardStyle}>
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
                    <option key={cat} value={cat}>{cat}</option>
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
                    <option key={s} value={s}>{s}</option>
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
                <Button variant="secondary" size="sm" onClick={handleAddPerformer}>
                  <Plus size={16} />
                </Button>
              </div>
              {performers.length > 0 && (
                <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {performers.map((performer, idx) => (
                    <PerformerTag
                      key={idx}
                      name={performer}
                      onRemove={() => handleRemovePerformer(idx)}
                    />
                  ))}
                </div>
              )}
            </div>

            {step1Error && <ErrorMessage message={step1Error} />}

            <div style={{ marginTop: '24px' }}>
              <Button variant="primary" onClick={handleStep1Next} fullWidth>
                Next: Add Ticket Tiers →
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: 'var(--color-text)' }}>
                Ticket Tiers
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleOpenTierModal}
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
                    onEdit={() => handleEditTier(i)}
                    onRemove={() => handleRemoveTier(i)}
                  />
                ))}
              </div>
            )}

            {submitError && (
              <div style={{ marginTop: '16px' }}>
                <ErrorMessage message={submitError} />
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <Button variant="ghost" onClick={() => setStep(1)}>← Back</Button>
              <Button variant="primary" onClick={handleStep2Next}>
                Next: Add Media →
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={cardStyle}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0, marginBottom: '20px', color: 'var(--color-text)' }}>
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
                urls={videoUrls}
                onAdd={(newUrls) => setVideoUrls(newUrls)}
                onRemove={() => setVideoUrls([])}
                uploadFn={handleUpload}
              />
            </div>

            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '12px', marginBottom: 0 }}>
              Images will be shown in the event gallery. Video will be the promo clip.
            </p>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <Button variant="ghost" onClick={() => setStep(2)}>← Back</Button>
              <Button variant="ghost" loading={isPending} onClick={() => handleSubmit('draft')}>
                Save as Draft
              </Button>
              <Button variant="primary" loading={isPending} onClick={() => handleSubmit('published')}>
                Publish Event
              </Button>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={tierModal}
        onClose={() => setTierModal(false)}
        title={editingIndex !== null ? 'Edit Ticket Tier' : 'Add Ticket Tier'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setTierModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAddTier}>
              {editingIndex !== null ? 'Update Tier' : 'Add Tier'}
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
            label="Price (₦)"
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
