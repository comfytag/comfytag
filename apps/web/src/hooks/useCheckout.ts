'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { calculatePlatformFee, calculatePaystackFee } from '@comfytag/utils'
import type { Event, TicketTier, ApiResponse, PromoCode } from '@comfytag/types'

export type CheckoutStatus = 'loading' | 'ready' | 'processing' | 'success' | 'failed'

export interface GuestDetails {
  name: string
  email: string
  phone: string
}

// Subset of PromoCode containing only discount fields for checkout state
export type PromoCodeDiscount = Pick<PromoCode, 'discountType' | 'discountValue'>

export interface CheckoutHookResult {
  status: CheckoutStatus
  event: Event | null
  tier: TicketTier | null
  quantity: number
  fees: {
    subtotal: number
    discountedSubtotal: number
    platformFee: number
    paystackFee: number
    total: number
  }
  promoApplied: PromoCodeDiscount | null
  error: string | null
  initPayment: (guestDetails: GuestDetails | null, promoCode: string | null) => Promise<void>
  applyPromo: (code: string) => Promise<PromoCodeDiscount | null>
  reset: () => void
}

export function useCheckout(
  eventId: string,
  tierId: string,
  quantity: number
): CheckoutHookResult {
  const [status, setStatus] = useState<CheckoutStatus>('loading')
  const [promoApplied, setPromoApplied] = useState<PromoCodeDiscount | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Fetch event data with useQuery
  const { data: event, isLoading: eventLoading, error: eventError } = useQuery({
    queryKey: ['checkout', eventId, tierId],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Event>>(`/events/${eventId}`)
      const eventData = res.data.data
      const foundTier = eventData.ticketType.find((t) => t._id === tierId)
      if (!foundTier) throw new Error('Ticket tier not found')
      return eventData
    },
    staleTime: 0,
    retry: 1,
    enabled: !!eventId && !!tierId,
  })

  const tier = event?.ticketType.find((t) => t._id === tierId) ?? null

  // Update status based on query state
  useEffect(() => {
    if (!eventId || !tierId) {
      setError('Missing event or tier information.')
      setStatus('ready')
      return
    }
    if (eventLoading) {
      setStatus('loading')
      return
    }
    if (eventError) {
      setError(eventError instanceof Error ? eventError.message : 'Failed to load event')
      setStatus('ready')
      return
    }
    if (event && tier) {
      setError(null)
      setStatus('ready')
    }
  }, [eventLoading, eventError, event, tier, eventId, tierId])

  // Calculate fees
  const subtotal = tier ? tier.price * quantity : 0
  const discountedSubtotal = applyPromoDiscount(subtotal, promoApplied)
  const platformFee = calculatePlatformFee(discountedSubtotal, 4)
  const paystackFee = calculatePaystackFee(discountedSubtotal)
  const total = discountedSubtotal + platformFee + paystackFee

  function applyPromoDiscount(base: number, promo: PromoCodeDiscount | null): number {
    if (!promo) return base
    if (promo.discountType === 'percentage') {
      return Math.round(base * (1 - promo.discountValue / 100))
    }
    return Math.max(0, base - promo.discountValue)
  }

  // Promo validation mutation
  const promoMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await api.post<ApiResponse<PromoCodeDiscount>>('/promo/validate', {
        code,
        eventId,
      })
      return res.data.data
    },
  })

  const applyPromo = useCallback(
    async (code: string): Promise<PromoCodeDiscount | null> => {
      try {
        const result = await promoMutation.mutateAsync(code)
        setPromoApplied(result)
        return result
      } catch {
        setPromoApplied(null)
        return null
      }
    },
    [promoMutation]
  )

  // Payment initiation mutation
  const paymentMutation = useMutation({
    mutationFn: async (payload: {
      guestDetails: GuestDetails | null
      promoCode: string | null
      tierId: string
      quantity: number
    }) => {
      const res = await api.post('/tickets/initiate', payload)
      return res.data
    },
    onSuccess: () => {
      setStatus('success')
    },
    onError: () => {
      setStatus('failed')
    },
  })

  const initPayment = useCallback(
    async (guestDetails: GuestDetails | null, promoCode: string | null) => {
      setStatus('processing')
      try {
        await paymentMutation.mutateAsync({
          guestDetails,
          promoCode,
          tierId,
          quantity,
        })
      } catch {
        setStatus('failed')
      }
    },
    [paymentMutation, tierId, quantity]
  )

  const reset = useCallback(() => {
    setStatus('ready')
    setError(null)
    setPromoApplied(null)
  }, [])

  return {
    status,
    event: event ?? null,
    tier,
    quantity,
    fees: {
      subtotal,
      discountedSubtotal,
      platformFee,
      paystackFee,
      total,
    },
    promoApplied,
    error,
    initPayment,
    applyPromo,
    reset,
  }
}
