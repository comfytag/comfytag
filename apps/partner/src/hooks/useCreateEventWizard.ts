'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

// ─── Type Definitions ───────────────────────────────────────────────────────
export interface TierInput {
  name: string
  price: string
  capacity: string
}

export interface DetailsState {
  specialNotes: string
  isPublic: boolean
}

export interface CreateEventFormData {
  // Step 1: Basic Info
  name: string
  headline: string
  category: string
  secondaryCategory: string
  date: string
  startTime: string
  endTime: string
  venue: string
  address: string
  state: string
  // Step 3: Tiers
  tiers: TierInput[]
  // Step 4: Details
  description: string
  performers: string[]
  details: DetailsState
  // Step 5: Media
  images: string[]
}

interface UseCreateEventWizardReturn {
  step: 1 | 2 | 3 | 4 | 5
  formData: CreateEventFormData
  updateField: (field: keyof CreateEventFormData, value: unknown) => void
  nextStep: () => void
  prevStep: () => void
  goToStep: (n: 1 | 2 | 3 | 4 | 5) => void
  isStepValid: (step: number) => boolean
  submitEvent: {
    mutate: (status: 'draft' | 'published') => void
    isPending: boolean
    error: Error | null
  }
  stepErrors: string
  setStepErrors: (msg: string) => void
  // Tier management
  handleAddTier: () => void
  handleEditTier: (index: number) => void
  handleRemoveTier: (index: number) => void
  handleOpenTierModal: () => void
  tierModal: boolean
  setTierModal: (open: boolean) => void
  currentTier: TierInput
  setCurrentTier: (tier: TierInput) => void
  editingIndex: number | null
  // Performer management
  handleAddPerformer: () => void
  handleRemovePerformer: (index: number) => void
  performerInput: string
  setPerformerInput: (val: string) => void
  // Media upload
  handleUpload: (file: File) => Promise<string>
  // Draft persistence
  hasDraft: boolean
  discardDraft: () => void
}

const DRAFT_KEY = 'comfytag_event_wizard_draft'

// ─── Hook Implementation ────────────────────────────────────────────────────
export function useCreateEventWizard(): UseCreateEventWizardReturn {
  const router = useRouter()
  const { data: session } = useSession()
  const queryClient = useQueryClient()

  // Wizard state
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1)
  const [stepErrors, setStepErrors] = useState('')
  const [hasDraft, setHasDraft] = useState(false)

  // Form state — initialized from localStorage if a draft exists
  const [formData, setFormData] = useState<CreateEventFormData>(() => {
    const empty: CreateEventFormData = {
      name: '',
      headline: '',
      category: '',
      secondaryCategory: '',
      date: '',
      startTime: '',
      endTime: '',
      venue: '',
      address: '',
      state: '',
      tiers: [],
      description: '',
      performers: [],
      details: { specialNotes: '', isPublic: true },
      images: [],
    }
    if (typeof window === 'undefined') return empty
    try {
      const saved = localStorage.getItem(DRAFT_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as CreateEventFormData
        return parsed
      }
    } catch { /* ignore */ }
    return empty
  })

  // Detect draft on mount (after hydration)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as CreateEventFormData
        const hasContent = parsed.name || parsed.tiers.length > 0 || parsed.description
        setHasDraft(!!hasContent)
      }
    } catch { /* ignore */ }
  }, [])

  // Persist form data to localStorage on every change
  useEffect(() => {
    try {
      const hasContent = formData.name || formData.tiers.length > 0 || formData.description
      if (hasContent) {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(formData))
        setHasDraft(true)
      }
    } catch { /* ignore */ }
  }, [formData])

  // Tier management
  const [tierModal, setTierModal] = useState(false)
  const [currentTier, setCurrentTier] = useState<TierInput>({ name: '', price: '', capacity: '' })
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  // Performer management
  const [performerInput, setPerformerInput] = useState('')

  // ─── Mutations ──────────────────────────────────────────────────────────
  const { mutate, isPending, error } = useMutation({
    mutationFn: (body: object) =>
      api.post(`/events/${session!.user.id}`, body).then(r => r.data),
    onSuccess: (data: { _id: string; status: string }) => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      try { localStorage.removeItem(DRAFT_KEY) } catch { /* ignore */ }
      setHasDraft(false)
      if (data.status === 'draft') {
        router.push('/events')
      } else {
        router.push(`/events/${data._id}`)
      }
    },
    onError: () => {
      setStepErrors('Network error. Please check your connection and try again.')
    },
  })

  // ─── Field Updates ──────────────────────────────────────────────────────
  const updateField = (field: keyof CreateEventFormData, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // ─── Step Validation ────────────────────────────────────────────────────
  function validateStep1(): boolean {
    const missing: string[] = []
    if (!formData.name) missing.push('Event Name')
    if (!formData.category) missing.push('Category')
    if (!formData.date) missing.push('Date')
    if (!formData.startTime) missing.push('Start Time')
    if (!formData.endTime) missing.push('End Time')
    if (!formData.venue) missing.push('Venue')
    if (!formData.address) missing.push('Address')
    if (!formData.state) missing.push('State')

    if (missing.length > 0) {
      setStepErrors(`Please fill in: ${missing.join(', ')}`)
      return false
    }
    setStepErrors('')
    return true
  }

  function validateStep2(): boolean {
    if (formData.images.length === 0) {
      setStepErrors('Please upload at least one image')
      return false
    }
    setStepErrors('')
    return true
  }

  function validateStep3(): boolean {
    if (formData.tiers.length === 0) {
      setStepErrors('Add at least one ticket tier')
      return false
    }
    setStepErrors('')
    return true
  }

  function validateStep4(): boolean {
    if (!formData.description) {
      setStepErrors('Please add an event description')
      return false
    }
    setStepErrors('')
    return true
  }

  function isStepValid(stepNum: number): boolean {
    if (stepNum === 1) return validateStep1()
    if (stepNum === 2) return validateStep2()
    if (stepNum === 3) return validateStep3()
    if (stepNum === 4) return validateStep4()
    return true
  }

  // ─── Navigation ─────────────────────────────────────────────────────────
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

  // ─── Tier Management ────────────────────────────────────────────────────
  function handleAddTier() {
    const price = Number(currentTier.price)
    const capacityStr = currentTier.capacity.trim()
    const isUnlimited = capacityStr === ''
    const capacity = isUnlimited ? null : Number(capacityStr)
    if (!currentTier.name || price < 0 || (!isUnlimited && (Number.isNaN(capacity) || (capacity as number) <= 0))) {
      setStepErrors('Please enter a valid name and price ≥ 0. Leave capacity blank for unlimited.')
      return
    }
    if (editingIndex !== null) {
      const updated = [...formData.tiers]
      updated[editingIndex] = currentTier
      updateField('tiers', updated)
      setEditingIndex(null)
    } else {
      updateField('tiers', [...formData.tiers, currentTier])
    }
    setCurrentTier({ name: '', price: '', capacity: '' })
    setStepErrors('')
    setTierModal(false)
  }

  function handleEditTier(index: number) {
    setCurrentTier(formData.tiers[index])
    setEditingIndex(index)
    setTierModal(true)
  }

  function handleOpenTierModal() {
    setCurrentTier({ name: '', price: '', capacity: '' })
    setEditingIndex(null)
    setTierModal(true)
  }

  function handleRemoveTier(index: number) {
    updateField('tiers', formData.tiers.filter((_, i) => i !== index))
  }

  // ─── Performer Management ───────────────────────────────────────────────
  function handleAddPerformer() {
    if (!performerInput.trim()) return
    updateField('performers', [...formData.performers, performerInput.trim()])
    setPerformerInput('')
  }

  function handleRemovePerformer(index: number) {
    updateField('performers', formData.performers.filter((_, i) => i !== index))
  }

  // ─── Media Upload ───────────────────────────────────────────────────────
  async function handleUpload(file: File): Promise<string> {
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await api.post<{ url: string }>('/upload', fd)
      return res.data.url
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to upload file. Please try again.'
      setStepErrors(message)
      throw new Error(message)
    }
  }

  // ─── Draft Management ───────────────────────────────────────────────────
  function discardDraft() {
    try { localStorage.removeItem(DRAFT_KEY) } catch { /* ignore */ }
    setHasDraft(false)
    setFormData({
      name: '', headline: '', category: '', secondaryCategory: '',
      date: '', startTime: '', endTime: '', venue: '', address: '', state: '',
      tiers: [], description: '', performers: [],
      details: { specialNotes: '', isPublic: true }, images: [],
    })
    setStep(1)
  }

  // ─── Submit Handler ─────────────────────────────────────────────────────
  function handleSubmit(status: 'draft' | 'published') {
    mutate({
      name: formData.name,
      headline: formData.headline || undefined,
      category: formData.category,
      secondaryCategory: formData.secondaryCategory || undefined,
      description: formData.description,
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      venue: formData.venue,
      address: formData.address,
      state: formData.state,
      coverImage: formData.images[0] ?? '',
      images: formData.images,
      ticketType: formData.tiers.map(t => ({
        name: t.name,
        price: Number(t.price),
        capacity: t.capacity.trim() === '' ? null : Number(t.capacity),
      })),
      performers: formData.performers.length > 0 ? formData.performers : undefined,
      gateRules: formData.details.specialNotes ? [formData.details.specialNotes] : undefined,
      status,
    })
  }

  return {
    step,
    formData,
    updateField,
    nextStep,
    prevStep,
    goToStep,
    isStepValid,
    submitEvent: {
      mutate: handleSubmit,
      isPending,
      error: error as Error | null,
    },
    stepErrors,
    setStepErrors,
    handleAddTier,
    handleEditTier,
    handleRemoveTier,
    handleOpenTierModal,
    tierModal,
    setTierModal,
    currentTier,
    setCurrentTier,
    editingIndex,
    handleAddPerformer,
    handleRemovePerformer,
    performerInput,
    setPerformerInput,
    handleUpload,
    hasDraft,
    discardDraft,
  }
}
