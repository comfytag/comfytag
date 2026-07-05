import { useAuthStore } from '../../store/authStore'
import { clearTicketCache } from '../../lib/ticketCache'
import type { User } from '@comfytag/types'

jest.mock('../../lib/ticketCache', () => ({
  clearTicketCache: jest.fn().mockResolvedValue(undefined),
}))

const mockUser: User = {
  _id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  role: 'attendee',
  isVerified: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
} as unknown as User

beforeEach(() => {
  useAuthStore.setState({ user: null, token: null, isLoggedIn: false })
  jest.clearAllMocks()
})

describe('authStore — initial state', () => {
  it('starts with no user', () => {
    expect(useAuthStore.getState().user).toBeNull()
  })
  it('starts with no token', () => {
    expect(useAuthStore.getState().token).toBeNull()
  })
  it('starts logged out', () => {
    expect(useAuthStore.getState().isLoggedIn).toBe(false)
  })
})

describe('authStore — setUser', () => {
  it('sets user and marks logged in', () => {
    useAuthStore.getState().setUser(mockUser, 'tok-123')
    const { user, token, isLoggedIn } = useAuthStore.getState()
    expect(user).toEqual(mockUser)
    expect(token).toBe('tok-123')
    expect(isLoggedIn).toBe(true)
  })
})

describe('authStore — logout', () => {
  it('clears user, token, and isLoggedIn', () => {
    useAuthStore.getState().setUser(mockUser, 'tok-123')
    useAuthStore.getState().logout()
    const { user, token, isLoggedIn } = useAuthStore.getState()
    expect(user).toBeNull()
    expect(token).toBeNull()
    expect(isLoggedIn).toBe(false)
  })

  it('calls clearTicketCache with the user id', () => {
    useAuthStore.getState().setUser(mockUser, 'tok-123')
    useAuthStore.getState().logout()
    expect(clearTicketCache).toHaveBeenCalledWith('user-1')
  })

  it('is a no-op when already logged out', () => {
    useAuthStore.getState().logout()
    expect(useAuthStore.getState().isLoggedIn).toBe(false)
    expect(clearTicketCache).not.toHaveBeenCalled()
  })
})
