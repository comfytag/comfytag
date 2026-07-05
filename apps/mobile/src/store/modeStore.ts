import { create } from 'zustand'

type AppMode = 'attendee' | 'organizer'

interface ModeState {
  mode: AppMode
  setMode: (mode: AppMode) => void
}

export const useModeStore = create<ModeState>((set) => ({
  mode: 'attendee',
  setMode: (mode) => set({ mode }),
}))
