import { NavigatorScreenParams } from '@react-navigation/native'
import type { TicketTier } from '@comfytag/types'

export type GuestStackParamList = {
  Splash: undefined
  Welcome: undefined
  GuestHome: undefined
  Login: undefined
  Register: undefined
  ForgotPassword: undefined
}

export type AttendeeTabParamList = {
  Discover: undefined
  Search: undefined
  // Nested-navigator params — lets InboxScreen deep-link a notification tap
  // straight to e.g. Tickets > IncomingTransfer instead of just the tab root.
  Tickets: NavigatorScreenParams<TicketsStackParamList> | undefined
  Inbox: undefined
  Profile: undefined
}

export type OrganizerTabParamList = {
  Dashboard: undefined
  Events: undefined
  CheckIn: undefined
  Payouts: undefined
  Account: undefined
}

export type OrganizerCheckInStackParamList = {
  CheckInHome: undefined
  FaceCheckIn: { eventId: string; eventName: string }
  ManualCheckIn: { eventId: string; eventName: string }
}

export type OrganizerEventsStackParamList = {
  EventsList: undefined
  OrganizerEventDetail: { eventId: string; eventName: string }
  CreateEvent: undefined
  EditEvent: { eventId: string }
  TicketTiers: { eventId: string; eventName: string }
  PromoCodes: { eventId: string; eventName: string }
  Audience: { eventId: string; eventName: string }
}

export type RootStackParamList = {
  GuestApp: NavigatorScreenParams<GuestStackParamList>
  AttendeeApp: NavigatorScreenParams<AttendeeTabParamList>
  OrganizerApp: NavigatorScreenParams<OrganizerTabParamList>
}

export type DiscoverStackParamList = {
  HomeMain: undefined
  Category: { slug: string; name: string; gradient?: string }
  EventDetail: { slug: string }
  OrganizerProfile: { organizerId: string; organizerName: string }
  Checkout: {
    eventId: string
    eventName: string
    eventDate: string
    eventVenue: string
    tiers: TicketTier[]
    preSelectedTierId?: string
  }
  OrderConfirmation: {
    eventName: string
    tierName: string
    quantity: number
    totalAmount: number
    reference: string
  }
}

export type SearchStackParamList = {
  ExploreMain: undefined
  SearchMain: undefined
  EventDetail: { slug: string }
}

export type TicketsStackParamList = {
  TicketsList: undefined
  TicketDetail: { ticketId: string }
  FaceCheckIn: { ticketId: string }
  TransferTicket: { ticketId: string; eventName: string; ticketType: string }
  IncomingTransfer: { ticketId: string; transferToken: string; senderName?: string }
}

export type ProfileStackParamList = {
  ProfileMain: undefined
  EditProfile: undefined
  Following: undefined
  FaceEnrollmentStatus: undefined
  FaceEnrollment: undefined
}

export type OrganizerAccountStackParamList = {
  AccountHome: undefined
  Bank: undefined
  Kyc: undefined
}
