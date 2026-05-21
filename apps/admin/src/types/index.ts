export type { Event, TicketTier, Ticket, Notification, BankAccount, WithdrawRequest, PaginatedResponse } from '@comfytag/types'
import type { AdminRole } from '../lib/roles'

export interface AdminUser {
  _id: string
  name: string
  email: string
  role: AdminRole
  isActive: boolean
  twoFactorEnabled: boolean
  lastLoginAt?: string
  createdAt: string
}
