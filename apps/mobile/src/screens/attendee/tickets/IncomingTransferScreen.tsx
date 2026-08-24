import React, { useState } from 'react'
import {
  View,
  Text,
  Image,
  ScrollView,
  Alert,
  StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import type { StackScreenProps } from '@react-navigation/stack'
import { ChevronLeft, Ticket as TicketIcon, Sparkles } from 'lucide-react-native'
import { colors, sp, rd, fs } from '@comfytag/ui/tokens'
import { formatNaira, formatTime } from '@comfytag/utils'
import { FEATURES } from '../../../lib/features'
import { AnimatedPressable } from '../../../components/ui/AnimatedPressable'
import { Avatar } from '../../../components/ui/Avatar'
import StateScreen from '../../../components/ui/StateScreen'
import { useAuthStore } from '../../../store'
import { useIncomingTransfers, useAcceptTransfer, useDeclineTransfer } from '../../../hooks'
import type { TicketsStackParamList } from '../../../navigation/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

function getMonthDay(dateString: string): { month: string; day: string } {
  const d = new Date(dateString)
  if (isNaN(d.getTime())) return { month: '—', day: '—' }
  return { month: MONTHS[d.getMonth()], day: String(d.getDate()) }
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = StackScreenProps<TicketsStackParamList, 'IncomingTransfer'>

// ─── IncomingTransferScreen ───────────────────────────────────────────────────
// Reached via the "transfer_received" notification tap (InboxScreen) — that's
// currently the only place senderName + transferToken exist together, since
// GET /tickets/transfer/incoming deliberately never returns the token and
// GET /audience/:id 403s for a ticket you don't own yet. This screen calls
// the incoming-transfers list purely to get the ticket's display details
// (event name/date/type/amount), not to source the token.

export default function IncomingTransferScreen({ navigation, route }: Props) {
  const { ticketId, transferToken, senderName } = route.params

  const {
    data: incoming,
    isLoading,
    isError,
    refetch,
  } = useIncomingTransfers()

  const ticket = incoming?.find((t) => t._id === ticketId)
  const user = useAuthStore((s) => s.user)
  const [imageError, setImageError] = useState(false)

  const { mutate: acceptTransfer, isPending: isAccepting } = useAcceptTransfer()
  const { mutate: declineTransfer, isPending: isDeclining } = useDeclineTransfer()
  const [isDeclined, setIsDeclined] = React.useState(false)
  const [isSuccess, setIsSuccess] = React.useState(false)
  const [actionError, setActionError] = React.useState<string | null>(null)

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleAccept = () => {
    Alert.alert(
      'Accept Ticket?',
      'This ticket will be transferred to you.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: () => {
            setActionError(null)
            acceptTransfer(
              { ticketId, transferToken },
              {
                onSuccess: () => setIsSuccess(true),
                onError: (err) => {
                  setActionError(
                    err instanceof Error ? err.message : 'Could not accept ticket. Try again.'
                  )
                },
              }
            )
          },
        },
      ]
    )
  }

  const handleDecline = () => {
    Alert.alert(
      'Decline Transfer?',
      'The sender will be notified. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: () => {
            setActionError(null)
            declineTransfer(
              { ticketId, transferToken },
              {
                onSuccess: () => setIsDeclined(true),
                onError: (err) => {
                  setActionError(
                    err instanceof Error ? err.message : 'Could not decline. Try again.'
                  )
                },
              }
            )
          },
        },
      ]
    )
  }

  // ── Loading ───────────────────────────────────────────────────────────────

  if (isLoading || isAccepting || isDeclining) {
    return (
      <StateScreen
        type="loading"
        title={
          isAccepting
            ? 'Accepting ticket…'
            : isDeclining
            ? 'Declining…'
            : 'Loading transfer…'
        }
      />
    )
  }

  // ── Success ───────────────────────────────────────────────────────────────

  if (isSuccess) {
    const entryMethod = FEATURES.faceVerification ? 'your face or QR code' : 'your QR code'
    return (
      <StateScreen
        type="success"
        title="Ticket is now yours"
        subtitle={
          ticket !== undefined
            ? `${ticket.eventname}\n\nYou can now check in with ${entryMethod}.`
            : `You can now check in with ${entryMethod}.`
        }
        action={{
          label: 'View My Tickets',
          onPress: () => navigation.navigate('TicketsList'),
        }}
      />
    )
  }

  // ── Declined ──────────────────────────────────────────────────────────────

  if (isDeclined) {
    return (
      <StateScreen
        type="declined"
        title="Transfer declined"
        subtitle="The sender has been notified."
        action={{
          label: 'Back to Tickets',
          onPress: () => navigation.navigate('TicketsList'),
        }}
      />
    )
  }

  // ── Error ─────────────────────────────────────────────────────────────────

  if (isError || actionError !== null) {
    return (
      <StateScreen
        type="error"
        title="Something went wrong"
        subtitle={actionError ?? 'Transfer not found or already resolved.'}
        action={{ label: 'Try Again', onPress: () => void refetch() }}
      />
    )
  }

  // ── Review ────────────────────────────────────────────────────────────────

  if (ticket === undefined) {
    return (
      <StateScreen
        type="error"
        title="Transfer not found"
        subtitle="This transfer may have already been resolved."
      />
    )
  }

  const isVip = ticket.type.toLowerCase().includes('vip')
  const showImage = !!ticket.eventImage && !imageError
  const { month, day } = getMonthDay(ticket.eventDate ?? ticket.date)
  const doorsTime = formatTime(ticket.eventTime) || formatTime(ticket.date)

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* App bar */}
      <View style={styles.appBar}>
        <AnimatedPressable
          onPress={() => navigation.goBack()}
          hapticStyle="light"
          style={styles.backBtn}
        >
          <ChevronLeft size={24} color={colors.brand.DEFAULT} strokeWidth={2} />
        </AnimatedPressable>
        <Text style={styles.headerBrand}>ComfyTag</Text>
        <Avatar uri={user?.avatar ?? user?.image} name={user?.name} size="sm" />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Screen identity */}
        <View style={styles.reviewHeader}>
          <Text style={styles.reviewEyebrow}>Incoming Ticket</Text>
          <Text style={styles.reviewTitle}>From {senderName ?? 'someone you know'}</Text>
        </View>

        {/* Ticket card */}
        <View style={styles.ticketCard}>
          <View style={styles.imageSection}>
            {showImage ? (
              <Image
                source={{ uri: ticket.eventImage as string }}
                style={styles.image}
                resizeMode="cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <View style={[styles.image, styles.imageFallback]}>
                <TicketIcon size={28} color="rgba(255,255,255,0.6)" strokeWidth={1.5} />
              </View>
            )}
            <LinearGradient
              colors={['transparent', 'rgba(28,25,23,0.85)']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.imageTextWrap}>
              {isVip && (
                <View style={styles.vipBadge}>
                  <Text style={styles.vipBadgeText}>VIP ACCESS</Text>
                </View>
              )}
              <Text style={styles.eventName} numberOfLines={2}>
                {ticket.eventname}
              </Text>
            </View>
          </View>

          <View style={styles.cardBody}>
            <View style={styles.dateRow}>
              <View style={styles.dateChip}>
                <Text style={styles.dateChipMonth}>{month}</Text>
                <Text style={styles.dateChipDay}>{day}</Text>
              </View>
              <View style={styles.dateRowText}>
                {typeof ticket.eventVenue === 'string' && ticket.eventVenue.length > 0 && (
                  <Text style={styles.venueText} numberOfLines={1}>
                    {ticket.eventVenue}
                  </Text>
                )}
                {doorsTime.length > 0 && (
                  <Text style={styles.doorsText}>Doors open {doorsTime}</Text>
                )}
              </View>
            </View>

            {FEATURES.faceVerification && (
              <View style={styles.facePill}>
                <Sparkles size={14} color={colors.brand.DEFAULT} strokeWidth={2} />
                <Text style={styles.facePillText}>Face sync included</Text>
              </View>
            )}

            <View style={styles.divider} />

            <View style={styles.ticketTypeRow}>
              <Text style={styles.ticketTypeText}>{ticket.type}</Text>
              <Text style={styles.ticketPriceText}>{formatNaira(ticket.amount)}</Text>
            </View>
          </View>
        </View>

        {/* Action error */}
        {actionError !== null && (
          <Text style={styles.actionError}>{actionError}</Text>
        )}

        {/* Accept */}
        <AnimatedPressable
          style={styles.acceptButton}
          hapticStyle="medium"
          onPress={handleAccept}
        >
          <Text style={styles.acceptButtonText}>Accept Ticket</Text>
        </AnimatedPressable>

        {/* Decline */}
        <AnimatedPressable
          style={styles.declineButton}
          hapticStyle="light"
          onPress={handleDecline}
        >
          <Text style={styles.declineButtonText}>Decline</Text>
        </AnimatedPressable>

        <Text style={styles.footerNote}>
          {FEATURES.faceVerification
            ? 'Accepting syncs this ticket to your face instantly. No camera needed.'
            : "Accepting moves this ticket into your wallet — it's yours to check in with immediately."}
        </Text>
      </ScrollView>
    </SafeAreaView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.public.bg,
  },
  scrollContent: {
    padding: sp[4],
    paddingBottom: sp[10],
  },

  // ── App bar ───────────────────────────────────────────────────────────────
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sp[4],
    paddingTop: sp[2],
    paddingBottom: sp[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.public.border,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -sp[2],
  },
  headerBrand: {
    fontSize: fs.lg,
    fontWeight: '800',
    color: colors.brand.DEFAULT,
    letterSpacing: -0.3,
  },

  // ── Screen identity ──────────────────────────────────────────────────────
  reviewHeader: {
    alignItems: 'center',
    marginBottom: sp[6],
  },
  reviewEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPublic.secondary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: sp[2],
  },
  reviewTitle: {
    fontSize: fs['2xl'],
    fontWeight: '800',
    color: colors.textPublic.primary,
    textAlign: 'center',
  },

  // ── Ticket card ───────────────────────────────────────────────────────────
  ticketCard: {
    backgroundColor: colors.public.surface,
    borderRadius: rd.xl,
    overflow: 'hidden',
    marginBottom: sp[6],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.public.border,
  },
  imageSection: {
    height: 190,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  imageFallback: {
    backgroundColor: colors.brand.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageTextWrap: {
    position: 'absolute',
    left: sp[4],
    bottom: sp[4],
    right: sp[4],
  },
  vipBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.brand.DEFAULT,
    borderRadius: rd.full,
    paddingHorizontal: sp[3],
    paddingVertical: 3,
    marginBottom: sp[2],
  },
  vipBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  eventName: {
    fontSize: fs.lg,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  cardBody: {
    padding: sp[4],
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp[3],
    marginBottom: sp[3],
  },
  dateChip: {
    width: 44,
    height: 44,
    borderRadius: rd.lg,
    backgroundColor: colors.public.surfaceAlt,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.public.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  dateChipMonth: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textPublic.secondary,
    lineHeight: 11,
  },
  dateChipDay: {
    fontSize: fs.base,
    fontWeight: '800',
    color: colors.textPublic.primary,
    lineHeight: 19,
  },
  dateRowText: {
    flex: 1,
  },
  venueText: {
    fontSize: fs.sm,
    fontWeight: '600',
    color: colors.textPublic.primary,
  },
  doorsText: {
    fontSize: fs.xs,
    color: colors.textPublic.muted,
    marginTop: 1,
  },
  facePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp[2],
    backgroundColor: colors.brand.light,
    borderRadius: rd.lg,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.2)',
    paddingVertical: sp[2],
    paddingHorizontal: sp[3],
    alignSelf: 'stretch',
    marginBottom: sp[3],
  },
  facePillText: {
    fontSize: fs.sm,
    color: colors.brand.dark,
    fontWeight: '500',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.public.border,
    marginBottom: sp[3],
  },
  ticketTypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketTypeText: {
    fontSize: fs.sm,
    color: colors.textPublic.secondary,
    fontWeight: '500',
  },
  ticketPriceText: {
    fontSize: fs.base,
    fontWeight: '700',
    color: colors.textPublic.primary,
  },

  // ── Action error ──────────────────────────────────────────────────────────
  actionError: {
    fontSize: fs.sm,
    color: colors.error.DEFAULT,
    textAlign: 'center',
    marginBottom: sp[4],
    lineHeight: 20,
  },

  // ── Buttons ───────────────────────────────────────────────────────────────
  acceptButton: {
    width: '100%',
    minHeight: 56,
    backgroundColor: colors.brand.DEFAULT,
    borderRadius: rd.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: sp[3],
  },
  acceptButtonText: {
    fontSize: fs.base,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  declineButton: {
    width: '100%',
    minHeight: 56,
    backgroundColor: 'transparent',
    borderRadius: rd.lg,
    borderWidth: 2,
    borderColor: colors.error.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: sp[4],
  },
  declineButtonText: {
    fontSize: fs.base,
    fontWeight: '600',
    color: colors.error.DEFAULT,
  },

  // ── Footer ────────────────────────────────────────────────────────────────
  footerNote: {
    fontSize: fs.xs,
    color: colors.textPublic.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
})
