'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { api } from '@/lib/api'
import { payoutKeys } from './queryKeys'
import type { BankAccount, WithdrawRequest } from '@comfytag/types'

interface WalletData {
  balance: number
  transactions: Array<{
    _id: string
    type: 'credit' | 'debit'
    amount: number
    reason?: string
    referenceId?: string
    createdAt: string
  }>
}

export function useWallet() {
  const { data: session } = useSession()

  return useQuery({
    queryKey: payoutKeys.wallet,
    queryFn: () =>
      api.get<WalletData>('/partner/wallet/').then((r) => r.data),
    staleTime: 60_000,
    enabled: !!session?.user?.id,
  })
}

export function useWithdrawals(id: string) {
  return useQuery({
    queryKey: payoutKeys.withdrawals,
    queryFn: () =>
      api
        .get<WithdrawRequest[]>(`/withdraw/${id}`)
        .then((r) => r.data ?? []),
    staleTime: 60_000,
    enabled: !!id,
  })
}

export function useBankAccount(id: string) {
  return useQuery({
    queryKey: payoutKeys.bank,
    queryFn: () =>
      api.get<BankAccount[]>(`/bank/${id}`).then((r) => r.data ?? []),
    staleTime: 300_000,
    enabled: !!id,
  })
}

interface RequestPayoutPayload {
  bankAccountId: string
  amount: number
  [key: string]: string | number
}

export function useRequestPayout() {
  const { data: session } = useSession()
  const userId = session?.user?.id
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (payload: RequestPayoutPayload) =>
      api.post(`/withdraw/${userId}`, payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: payoutKeys.withdrawals })
      qc.invalidateQueries({ queryKey: payoutKeys.wallet })
    },
  })
}
