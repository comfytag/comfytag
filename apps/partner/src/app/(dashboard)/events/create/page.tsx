'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useMutation } from '@tanstack/react-query'
import Link from 'next/link'
import { ArrowLeft, Plus, Edit2 } from 'lucide-react'
import { Button, Input, Modal, ErrorMessage, PageHeader, MediaUploader } from '@comfytag/ui'
import { NIGERIAN_STATES, EVENT_CATEGORIES, formatDate, formatTime, formatNaira } from '@comfytag/utils'
import type { Event } from '@comfytag/types'
import { api } from '@/lib/api'
import { fieldStyle, selectStyle, labelStyle, fieldGroupStyle, twoColGrid, cardStyle } from '@/lib/formStyles'
import { PerformerTag } from '@/components/events/PerformerTag'
import { TierListRow } from '@/components/events/TierListRow'

interface FormState {
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

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1)
  const [form, setForm] = useState<FormState>({
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
  const [coverImage, setCoverImage] = useState<string>('')
  const [tiers, setTiers] = useState<TierInput[]>([])
  const [performers, setPerformers] = useState<string[]>([])
  const [performerInput, setPerformerInput] = useState('')
  const [details, setDetails] = useState({ specialNotes: '', isPublic: true })
  const [images, setImages] = useState<string[]>([])

  const [tierModal, setTierModal] = useState(false)
  const [currentTier, setCurrentTier] = useState<TierInput>({ name: '', price: '', capacity: '' })
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [stepErrors, setStepErrors] = useState<string>('')

  const { mutate, isPending } = useMutation({
    mutationFn: (body: object) =>
      api.post('/events/' + session!.user.id, body).then(r => r.data),
    onSuccess: (data: { _id: string; status: string }) => {
      if (data.status === 'draft') {
        router.push('/events')
      } else {
        router.push('/events/' + data._id)
      }
    },
    onError: () => setStepErrors('Failed to create event. Please try again.'),
  })

  // â”€â”€â”€ Step Validation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function validateStep1(): boolean {
    const missing: string[] = []
    if (!form.name) missing.push('Event Name')
    if (!form.category) missing.push('Category')
    if (!form.date) missing.push('Date')
    if (!form.startTime) missing.push('Start Time')
    if (!form.endTime) missing.push('End Time')
    if (!form.venue) missing.push('Venue')
    if (!form.address) missing.push('Address')
    if (!form.state) missing.push('State')

    if (missing.length > 0) {
      setStepErrors(`Please fill in: ${missing.join(', ')}`)
      return false
    }
    setStepErrors('')
    return true
  }

  function validateStep2(): boolean {
    if (!coverImage) {
      setStepErrors('Please upload a cover image')
      return false
    }
    setStepErrors('')
    return true
  }

  function validateStep3(): boolean {
    if (tiers.length === 0) {
      setStepErrors('Add at least one ticket tier')
      return false
    }
    setStepErrors('')
    return true
  }

  function validateStep4(): boolean {
    if (!form.description) {
      setStepErrors('Please add an event description')
      return false
    }
    setStepErrors('')
    return true
  }

  // â”€â”€â”€ Navigation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function nextStep() {
    if (step === 1 && validateStep1()) setStep(2)
    else if (step === 2 && validateStep2()) setStep(3)
    else if (step === 3 && validateStep3()) setStep(4)
    else if (step === 4 && validateStep4()) setStep(5)
  }

  function prevStep() {
    if (step > 1) setStep((step - 1) as 1 | 2 | 3 | 4 | 5)
  }

  function goToStep(target: 1 | 2 | 3 | 4 | 5) {
    if (target < step) {
      setStep(target)
      setStepErrors('')
    }
  }

  // â”€â”€â”€ Tier Management â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function handleAddTier() {
    const price = Number(currentTier.price)
    const capacity = Number(currentTier.capacity)
    if (!currentTier.name || price < 0 || capacity <= 0) {
      setStepErrors('Please enter a valid name, price â‰¥ 0, and capacity > 0.')
      return
    }
    if (editingIndex !== null) {
      const updated = [...tiers]
      updated[editingIndex] = currentTier
      setTiers(updated)
      setEditingIndex(null)
    } else {
      setTiers([...tiers, currentTier])
    }
    setCurrentTier({ name: '', price: '', capacity: '' })
    setStepErrors('')
    setTierModal(false)
  }

  function handleEditTier(index: number) {
    setCurrentTier(tiers[index])
    setEditingIndex(index)
    setTierModal(true)
  }

  function handleOpenTierModal() {
    setCurrentTier({ name: '', price: '', capacity: '' })
    setEditingIndex(null)
    setTierModal(true)
  }

  function handleRemoveTier(index: number) {
    setTiers(tiers.filter((_, i) => i !== index))
  }

  // â”€â”€â”€ Performer Management â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function handleAddPerformer() {
    if (!performerInput.trim()) return
    setPerformers([...performers, performerInput.trim()])
    setPerformerInput('')
  }

  function handleRemovePerformer(index: number) {
    setPerformers(performers.filter((_, i) => i !== index))
  }

  // â”€â”€â”€ Media Upload â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async function handleUpload(file: File): Promise<string> {
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await api.post<{ url: string }>('/upload', fd)
      return res.data.url
    } catch {
      setStepErrors('Failed to upload file. Please try again.')
      throw new Error('Upload failed')
    }
  }

  // â”€â”€â”€ Submit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
      coverImage,
      images: [coverImage, ...images],
      ticketType: tiers.map(t => ({
        name: t.name,
        price: Number(t.price),
        capacity: Number(t.capacity),
      })),
      performers: performers.length > 0 ? performers : undefined,
      gateRules: details.specialNotes ? [details.specialNotes] : undefined,
      status,
    })
  }

  // â”€â”€â”€ Step Indicator Bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const stepLabels = ['Basic', 'Cover', 'Tickets', 'Details', 'Review']

  return (
    <div style={{ padding: '28px 32px' }}>
      <PageHeader
        title="Create Event"
        subtitle="Build your event in 5 steps"
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

      {/* Step Indicator Bar */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '32px', maxWidth: '600px' }}>
        {stepLabels.map((label, idx) => {
          const num = idx + 1
          const isActive = num === step
          const isComplete = num < step
          return (
            <div
              key={num}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <button
                type="button"
                onClick={() => goToStep(num as 1 | 2 | 3 | 4 | 5)}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  border: 'none',
                  cursor: num < step ? 'pointer' : isActive ? 'default' : 'not-allowed',
                  background: isActive
                    ? 'var(--color-brand)'
                    : isComplete
                      ? 'var(--color-success)'
                      : 'var(--color-surface)',
                  color: isActive || isComplete ? '#fff' : 'var(--color-text)',
                  fontSize: '14px',
                  fontWeight: 600,
                  transition: 'all var(--duration-fast) ease',
                }}
              >
                {isComplete ? 'âœ“' : num}
              </button>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textAlign: 'center' }}>
                {label}
              </span>
            </div>
          )
        })}
      </div>

      <div style={{ maxWidth: '720px' }}>
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div style={cardStyle}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 20px 0', color: 'var(--color-text)' }}>
              Basic Event Info
            </h2>

            <div style={fieldGroupStyle}>
              <Input
                label="Event Name"
                placeholder="e.g. Summer Festival 2025"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div style={twoColGrid}>
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

            <div style={twoColGrid}>
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
                label="Venue Name"
                placeholder="e.g. Lekki Conservancy"
                value={form.venue}
                onChange={e => setForm({ ...form, venue: e.target.value })}
              />
            </div>

            <div style={fieldGroupStyle}>
              <Input
                label="Address"
                placeholder="e.g. Plot 50, Admiralty Way, Lekki"
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

            {stepErrors && <ErrorMessage message={stepErrors} />}

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <Button variant="ghost" onClick={prevStep} disabled>
                â† Back
              </Button>
              <Button variant="primary" onClick={nextStep} fullWidth>
                Next: Cover Image â†’
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Cover Image */}
        {step === 2 && (
          <div style={cardStyle}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 20px 0', color: 'var(--color-text)' }}>
              Cover Image
            </h2>

            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Event Cover (16:9 aspect ratio)</label>
              <MediaUploader
                label="Event Cover"
                accept="image"
                urls={coverImage ? [coverImage] : []}
                onAdd={async (newUrls) => setCoverImage(newUrls[0] ?? '')}
                onRemove={() => setCoverImage('')}
                uploadFn={handleUpload}
              />
            </div>

            {stepErrors && <ErrorMessage message={stepErrors} />}

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <Button variant="ghost" onClick={prevStep}>
                â† Back
              </Button>
              <Button variant="primary" onClick={nextStep} fullWidth>
                Next: Ticket Tiers â†’
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Ticket Tiers */}
        {step === 3 && (
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0, color: 'var(--color-text)' }}>
                Ticket Tiers
              </h2>
              <Button variant="ghost" size="sm" onClick={handleOpenTierModal}>
                <Plus size={14} /> Add Tier
              </Button>
            </div>

            {tiers.length === 0 ? (
              <p
                style={{
                  fontSize: '14px',
                  color: 'var(--color-text-muted)',
                  padding: '20px',
                  textAlign: 'center',
                  margin: 0,
                  marginBottom: '20px',
                }}
              >
                No ticket tiers yet. Add at least one.
              </p>
            ) : (
              <div style={{ marginBottom: '20px' }}>
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

            {stepErrors && <ErrorMessage message={stepErrors} />}

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <Button variant="ghost" onClick={prevStep}>
                â† Back
              </Button>
              <Button variant="primary" onClick={nextStep} fullWidth>
                Next: Event Details â†’
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Details */}
        {step === 4 && (
          <div style={cardStyle}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 20px 0', color: 'var(--color-text)' }}>
              Event Details
            </h2>

            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Tell attendees about your event..."
                style={{ ...fieldStyle, height: '120px', resize: 'vertical' }}
              />
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
                    <PerformerTag
                      key={idx}
                      name={performer}
                      onRemove={() => handleRemovePerformer(idx)}
                    />
                  ))}
                </div>
              )}
            </div>

            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Special Notes/Requirements (Optional)</label>
              <textarea
                value={details.specialNotes}
                onChange={e => setDetails({ ...details, specialNotes: e.target.value })}
                placeholder="e.g. Age restrictions, dress code, items not allowed..."
                style={{ ...fieldStyle, height: '80px', resize: 'vertical' }}
              />
            </div>

            <div style={fieldGroupStyle}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                <input
                  type="checkbox"
                  checked={details.isPublic}
                  onChange={e => setDetails({ ...details, isPublic: e.target.checked })}
                  style={{ cursor: 'pointer' }}
                />
                <span>Make event public (visible to all attendees)</span>
              </label>
            </div>

            {stepErrors && <ErrorMessage message={stepErrors} />}

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <Button variant="ghost" onClick={prevStep}>
                â† Back
              </Button>
              <Button variant="primary" onClick={nextStep} fullWidth>
                Review & Publish â†’
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: Review & Publish */}
        {step === 5 && (
          <div style={cardStyle}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 24px 0', color: 'var(--color-text)' }}>
              Review & Publish
            </h2>

            {/* Live Preview */}
            <div
              style={{
                background: 'var(--color-surface-2)',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '28px',
              }}
            >
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 16px 0' }}>
                Event Preview
              </h3>

              {/* Cover + Info */}
              <div
                style={{
                  background: 'var(--color-surface)',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  marginBottom: '16px',
                }}
              >
                {coverImage && (
                  <div style={{ width: '100%', height: '200px', position: 'relative', overflow: 'hidden' }}>
                    <img
                      src={coverImage}
                      alt={form.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                )}

                <div style={{ padding: '16px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 8px 0' }}>
                    {form.name || 'Event Name'}
                  </h4>
                  <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: 0 }}>
                    {form.date && form.startTime ? `${formatDate(form.date)} at ${formatTime(form.startTime)}` : 'Date & time'}
                  </p>
                  <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: '4px 0 0 0' }}>
                    {form.venue || 'Venue'} â€¢ {form.state || 'State'}
                  </p>
                </div>
              </div>

              {/* Summary Sections */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {/* Description */}
                <SummarySection
                  title="Description"
                  step={4}
                  onClick={() => goToStep(4)}
                >
                  <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.5 }}>
                    {form.description || 'Add description...'}
                  </p>
                </SummarySection>

                {/* Tickets */}
                <SummarySection
                  title={`Tickets (${tiers.length})`}
                  step={3}
                  onClick={() => goToStep(3)}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {tiers.slice(0, 2).map((tier, i) => (
                      <div key={i} style={{ fontSize: '13px', color: 'var(--color-text)' }}>
                        {tier.name} â€” {formatNaira(Number(tier.price))} (Ã—{tier.capacity})
                      </div>
                    ))}
                    {tiers.length > 2 && (
                      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                        +{tiers.length - 2} more tier{tiers.length - 2 > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </SummarySection>

                {/* Performers */}
                <SummarySection
                  title={`Lineup (${performers.length})`}
                  step={4}
                  onClick={() => goToStep(4)}
                >
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {performers.length > 0 ? (
                      performers.slice(0, 3).map((p, i) => (
                        <span key={i} style={{ fontSize: '12px', background: 'var(--color-brand)', color: '#fff', padding: '2px 6px', borderRadius: '4px' }}>
                          {p}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>None added</span>
                    )}
                  </div>
                </SummarySection>

                {/* Visibility */}
                <SummarySection
                  title="Visibility"
                  step={4}
                  onClick={() => goToStep(4)}
                >
                  <p style={{ fontSize: '13px', color: 'var(--color-text)', margin: 0 }}>
                    {details.isPublic ? 'ðŸŒ Public' : 'ðŸ”’ Private'}
                  </p>
                </SummarySection>
              </div>
            </div>

            {stepErrors && <ErrorMessage message={stepErrors} />}

            <div style={{ display: 'flex', gap: '12px' }}>
              <Button variant="ghost" onClick={prevStep}>
                â† Back
              </Button>
              <Button
                variant="ghost"
                loading={isPending}
                onClick={() => handleSubmit('draft')}
              >
                Save as Draft
              </Button>
              <Button
                variant="primary"
                loading={isPending}
                onClick={() => handleSubmit('published')}
                fullWidth
              >
                Publish Event
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Tier Modal */}
      <Modal
        isOpen={tierModal}
        onClose={() => setTierModal(false)}
        title={editingIndex !== null ? 'Edit Ticket Tier' : 'Add Ticket Tier'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setTierModal(false)}>
              Cancel
            </Button>
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
        {stepErrors && (
          <div style={{ marginTop: '12px' }}>
            <ErrorMessage message={stepErrors} />
          </div>
        )}
      </Modal>
    </div>
  )
}

// â”€â”€â”€ Summary Section Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function SummarySection({
  title,
  step,
  onClick,
  children,
}: {
  title: string
  step: 1 | 2 | 3 | 4 | 5
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        background: 'var(--color-bg)',
        borderRadius: '8px',
        padding: '12px',
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <h5 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', margin: 0 }}>
          {title}
        </h5>
        <button
          type="button"
          onClick={onClick}
          aria-label={`Edit ${title}`}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px',
            color: 'var(--color-text-muted)',
            transition: 'color var(--duration-fast) ease',
          }}
          onMouseEnter={e => {
            ;(e.target as HTMLElement).style.color = 'var(--color-brand)'
          }}
          onMouseLeave={e => {
            ;(e.target as HTMLElement).style.color = 'var(--color-text-muted)'
          }}
        >
          <Edit2 size={14} />
        </button>
      </div>
      {children}
    </div>
  )
}

