import { useMutation, useQueryClient } from '@tanstack/react-query'
import { post } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { ticketKeys } from './queryKeys'
import type { ApiResponse, TicketTier } from '@comfytag/types'

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface PromoValidationResult {
  valid: boolean
  discount: number
  discountType: 'percentage' | 'fixed'
  finalAmount: number
}

export interface PaymentInitResult {
  authorizationUrl: string
  accessCode: string
  reference: string
}

export interface PaymentVerifyResult {
  success: boolean
  ticketId: string
  eventName: string
  tierName: string
}

export interface CheckoutDetails {
  eventId: string
  tierId: string
  quantity: number
  guestName: string
  guestEmail: string
  guestPhone: string
  promoCode?: string
}

// ─── Validate promo code ───────────────────────────────────────────────────────

export function useValidatePromo() {
  return useMutation({
    mutationFn: ({
      code,
      eventId,
      amount,
    }: {
      code: string
      eventId: string
      amount: number
    }) =>
      post<ApiResponse<PromoValidationResult>>('/promo/validate', {
        code,
        eventId,
        amount,
      }).then((r) => r.data.data),
  })
}

// ─── Initiate Paystack payment ─────────────────────────────────────────────────

export function useInitiatePayment() {
  return useMutation({
    mutationFn: (details: CheckoutDetails) =>
      post<ApiResponse<PaymentInitResult>>('/tickets/initiate', details).then(
        (r) => r.data.data
      ),
  })
}

// ─── Verify Paystack payment ───────────────────────────────────────────────────

export function useVerifyPayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ reference }: { reference: string }) =>
      post<ApiResponse<PaymentVerifyResult>>(
        `/paystack/verify/${reference}`
      ).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ticketKeys.mine })
    },
  })
}

// ─── Purchase free ticket ──────────────────────────────────────────────────────

export function usePurchaseFreeTicket() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      eventId,
      tierId,
      guestName,
      guestEmail,
      guestPhone,
    }: {
      eventId: string
      tierId: string
      guestName: string
      guestEmail: string
      guestPhone: string
    }) =>
      post(`/audience/free/${eventId}`, {
        userId: user?._id,
        tierId,
        name: guestName,
        email: guestEmail,
        phone: guestPhone,
      }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ticketKeys.mine })
    },
  })
}
