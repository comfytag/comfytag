import { create } from 'zustand'
import type { User } from '@comfytag/types'
import { clearTicketCache } from '../lib/ticketCache'

interface AuthState {
  user: User | null
  token: null | string
  isLoggedIn: boolean
  setUser: (user: User, token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoggedIn: false,
  setUser: (user, token) => set({ user, token, isLoggedIn: true }),
  logout: () => {
    const currentUser = get().user
    if (currentUser !== null) {
      void clearTicketCache(currentUser._id)
    }
    set({ user: null, token: null, isLoggedIn: false })
  },
}))
