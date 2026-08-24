import React from 'react'
import { waitFor } from '@testing-library/react-native'
import { renderHookWithQuery } from '../test-utils'
import { useEvents, useEventBySlug, useCategories } from '../../hooks/useEvents'
import { get } from '../../lib/api'
import type { Event, PaginatedResponse, ApiResponse } from '@comfytag/types'

jest.mock('../../lib/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  del: jest.fn(),
}))

const mockGet = get as jest.MockedFunction<typeof get>

const mockEvent: Event = {
  _id: 'evt-1',
  title: 'Lagos Vibes',
  slug: 'lagos-vibes',
  category: 'music',
  status: 'upcoming',
} as unknown as Event

afterEach(() => {
  jest.clearAllMocks()
})

describe('useEvents', () => {
  it('returns loading initially', () => {
    mockGet.mockReturnValue(new Promise(() => {}))
    const { result } = renderHookWithQuery(() => useEvents())
    expect(result.current.isLoading).toBe(true)
  })

  it('returns data on success', async () => {
    const response: PaginatedResponse<Event> = {
      data: [mockEvent],
      total: 1,
      page: 1,
      limit: 12,
    } as unknown as PaginatedResponse<Event>
    mockGet.mockResolvedValue({ data: response } as never)

    const { result } = renderHookWithQuery(() => useEvents())
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(response)
  })

  it('passes category filter in the query', async () => {
    mockGet.mockResolvedValue({ data: { data: [], total: 0 } } as never)
    renderHookWithQuery(() => useEvents({ category: 'afrobeats' }))
    await waitFor(() => expect(mockGet).toHaveBeenCalled())
    expect((mockGet.mock.calls[0] as [string])[0]).toContain('category=afrobeats')
  })

  it('calls the /events endpoint', async () => {
    mockGet.mockResolvedValue({ data: { data: [], total: 0 } } as never)
    renderHookWithQuery(() => useEvents())
    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1))
    expect((mockGet.mock.calls[0] as [string])[0]).toMatch(/^\/events/)
  })
})

describe('useEventBySlug', () => {
  it('is disabled when slug is empty', () => {
    mockGet.mockReturnValue(new Promise(() => {}))
    const { result } = renderHookWithQuery(() => useEventBySlug(''))
    expect(result.current.fetchStatus).toBe('idle')
    expect(mockGet).not.toHaveBeenCalled()
  })

  it('fetches event when slug is provided', async () => {
    const apiResponse: ApiResponse<Event> = { success: true, data: mockEvent } as never
    mockGet.mockResolvedValue({ data: apiResponse } as never)

    const { result } = renderHookWithQuery(() => useEventBySlug('lagos-vibes'))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockEvent)
    expect((mockGet.mock.calls[0] as [string])[0]).toBe('/events/lagos-vibes')
  })
})

describe('useCategories', () => {
  it('returns categories array on success', async () => {
    const cats: string[] = ['Music', 'Nightlife']
    mockGet.mockResolvedValue({ data: { success: true, data: cats } } as never)

    const { result } = renderHookWithQuery(() => useCategories())
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(cats)
  })

  it('falls back to empty array on empty response', async () => {
    mockGet.mockResolvedValue({ data: { success: true, data: null } } as never)
    const { result } = renderHookWithQuery(() => useCategories())
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([])
  })
})
