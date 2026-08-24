import { useMutation, useQueryClient } from '@tanstack/react-query'
import { post } from '../lib/api'
import { ticketKeys } from './queryKeys'
import type { ApiResponse, Ticket } from '@comfytag/types'

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface PromoValidationResult {
  valid: boolean
  discount: number
  discountType: 'percentage' | 'fixed'
  finalAmount: number
}

// Real shape of POST /paystack/verify/:reference — it only confirms the charge,
// it does NOT create a ticket. Ticket creation is a separate call (see
// useCreatePaidTicket below) — mirrors the two-step pattern the backend actually
// implements (and that apps/web already relies on).
export interface PaymentVerifyResult {
  status: string
  amount: number
  paid_at: string | null
  charged: boolean
}

// Body shape createAudience/createFreeAudience actually read from req.body —
// `type` is the ticket TIER NAME (matched against event.ticketType[].name on
// the server), not the tier's _id, and `eventname` is required for the emailed
// receipt/notification copy.
export interface CreateTicketDetails {
  eventId: string
  tierName: string
  eventname: string
  numOfTicket: number
  name: string
  email: string
  phone: string
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

// ─── Verify Paystack payment ───────────────────────────────────────────────────
// Confirms the charge server-side against Paystack's own /transaction/verify.
// Does not touch tickets — call useCreatePaidTicket next on success.

export function useVerifyPayment() {
  return useMutation({
    mutationFn: ({ reference }: { reference: string }) =>
      post<ApiResponse<PaymentVerifyResult>>(
        `/paystack/verify/${reference}`
      ).then((r) => r.data.data),
  })
}

// ─── Create ticket after a verified paid transaction ───────────────────────────
// POST /audience/:userId/:eventId — the same endpoint that ultimately creates
// every ticket, free or paid. Paid tickets require `reference` to already have
// been verified (the controller trusts it exists but re-derives the amount
// server-side from the tier price, never from the client).

export function useCreatePaidTicket() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      userId,
      eventId,
      tierName,
      eventname,
      numOfTicket,
      name,
      email,
      phone,
      reference,
    }: CreateTicketDetails & { userId: string; reference: string }) =>
      post<Ticket>(`/audience/${userId}/${eventId}`, {
        type: tierName,
        eventname,
        numOfTicket,
        name,
        email,
        phone,
        reference,
      }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ticketKeys.mine })
    },
  })
}

// ─── Purchase free ticket ──────────────────────────────────────────────────────

export function usePurchaseFreeTicket() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      eventId,
      tierName,
      eventname,
      numOfTicket,
      name,
      email,
      phone,
      userId,
    }: CreateTicketDetails & { userId?: string }) =>
      post<Ticket>(`/audience/free/${eventId}`, {
        userId,
        type: tierName,
        eventname,
        numOfTicket,
        name,
        email,
        phone,
      }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ticketKeys.mine })
    },
  })
}
