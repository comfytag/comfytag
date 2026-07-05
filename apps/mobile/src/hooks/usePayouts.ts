import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { get, post, put, del } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { payoutKeys } from './queryKeys'
import type { BankAccount, WithdrawRequest, ApiResponse } from '@comfytag/types'

// ─── Wallet ────────────────────────────────────────────────────────────────────

interface WalletData {
  balance: number
  pendingBalance: number
  totalEarned: number
  transactions: Array<{
    _id: string
    type: 'credit' | 'debit'
    amount: number
    description: string
    createdAt: string
  }>
}

export function useWallet() {
  return useQuery({
    queryKey: payoutKeys.wallet,
    queryFn: () =>
      get<ApiResponse<WalletData>>('/partner/wallet').then(
        (r) => r.data.data
      ),
    staleTime: 60_000,
  })
}

// ─── Withdrawals ───────────────────────────────────────────────────────────────

export function useWithdrawals() {
  const { user } = useAuthStore()
  return useQuery({
    queryKey: payoutKeys.withdrawals,
    queryFn: () =>
      get<ApiResponse<WithdrawRequest[]>>(
        `/withdraw/${user!._id}`
      ).then((r) => r.data.data ?? []),
    staleTime: 60_000,
    enabled: !!user,
  })
}

// ─── Bank accounts ─────────────────────────────────────────────────────────────

export function useBankAccounts() {
  const { user } = useAuthStore()
  return useQuery({
    queryKey: payoutKeys.bank,
    queryFn: () =>
      get<ApiResponse<BankAccount[]>>(`/bank/${user!._id}`).then(
        (r) => r.data.data ?? []
      ),
    staleTime: 120_000,
    enabled: !!user,
  })
}

// ─── Mutations ─────────────────────────────────────────────────────────────────

export function useRequestPayout() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      amount,
      bankId,
    }: {
      amount: number
      bankId: string
    }) =>
      post<ApiResponse<WithdrawRequest>>(
        `/withdraw/${user!._id}`,
        { amount, bankId }
      ).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: payoutKeys.wallet })
      qc.invalidateQueries({ queryKey: payoutKeys.withdrawals })
    },
  })
}

export function useAddBankAccount() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      bankName,
      acctName,
      acctNumber,
    }: {
      bankName: string
      acctName: string
      acctNumber: string
    }) =>
      post<ApiResponse<BankAccount>>(
        `/bank/${user!._id}`,
        { bankName, acctName, acctNumber }
      ).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: payoutKeys.bank })
    },
  })
}

export function useSetPrimaryBank() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ bankId }: { bankId: string }) =>
      put(`/bank/${user!._id}/${bankId}`, { isActive: true }).then(
        (r) => r.data
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: payoutKeys.bank })
    },
  })
}

export function useDeleteBankAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ bankId }: { bankId: string }) =>
      del(`/bank/${bankId}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: payoutKeys.bank })
    },
  })
}
