import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { STORAGE_KEYS } from '@comfytag/utils'

export type CreateEventStep = 'basics' | 'tickets' | 'review'

export interface TierDraft {
  id: string
  name: string
  price: string
  capacity: string
}

export interface EventDraftForm {
  name: string
  category: string
  description: string
  date: string
  startTime: string
  endTime: string
  venue: string
  address: string
  state: string
  tiers: TierDraft[]
  imageUrl: string
}

export const INITIAL_EVENT_DRAFT_FORM: EventDraftForm = {
  name: '',
  category: '',
  description: '',
  date: '',
  startTime: '',
  endTime: '',
  venue: '',
  address: '',
  state: '',
  tiers: [],
  imageUrl: '',
}

interface EventDraftState {
  step: CreateEventStep
  form: EventDraftForm
  setStep: (step: CreateEventStep) => void
  updateForm: (patch: Partial<EventDraftForm>) => void
  resetDraft: () => void
}

export const useEventDraftStore = create<EventDraftState>()(
  persist(
    (set) => ({
      step: 'basics',
      form: INITIAL_EVENT_DRAFT_FORM,
      setStep: (step) => set({ step }),
      updateForm: (patch) => set((s) => ({ form: { ...s.form, ...patch } })),
      resetDraft: () => set({ step: 'basics', form: INITIAL_EVENT_DRAFT_FORM }),
    }),
    {
      name: STORAGE_KEYS.EVENT_DRAFT,
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
