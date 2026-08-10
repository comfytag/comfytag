import { create } from 'zustand'
import type { User } from '@comfytag/types'
import { clearTicketCache } from '../lib/ticketCache'

interface AuthState {
  user: User | null
  token: null | string
  isLoggedIn: boolean
  setUser: (user: User, token: string) => void
  // Merges a partial patch into the current user — for local state updates
  // after an action that returns less than a full user object (e.g. face
  // enrollment only returns { faceEnrolled, faceEnrolledAt }, not the whole
  // profile). No-ops if nobody is logged in.
  updateUser: (patch: Partial<User>) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoggedIn: false,
  setUser: (user, token) => set({ user, token, isLoggedIn: true }),
  updateUser: (patch) => {
    const current = get().user
    if (current === null) return
    set({ user: { ...current, ...patch } })
  },
  logout: () => {
    const currentUser = get().user
    if (currentUser !== null) {
      void clearTicketCache(currentUser._id)
    }
    set({ user: null, token: null, isLoggedIn: false })
  },
}))
