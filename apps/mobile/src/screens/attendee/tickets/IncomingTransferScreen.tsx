import React, { useRef } from 'react'
import {
  View,
  Text,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import type { StackNavigationProp } from '@react-navigation/stack'
import { ChevronLeft } from 'lucide-react-native'
import { colors, sp, rd, fs } from '@comfytag/ui/tokens'
import { formatNaira, formatDate, formatTime } from '@comfytag/utils'
import { get, post } from '../../../lib/api'
import { AnimatedPressable } from '../../../components/ui/AnimatedPressable'
import StateScreen from '../../../components/ui/StateScreen'
import { useClaimTicket } from '../../../hooks'
import type { Ticket, ApiResponse } from '@comfytag/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  navigation: StackNavigationProp<Record<string, object | undefined>>
  route: {
    params?: {
      ticketId?: string
      transferToken?: string
    }
  }
}

interface IncomingTransferItem {
  ticket: Ticket
  senderName: string
  transferToken: string
  venue?: string
}

// ─── IncomingTransferScreen ───────────────────────────────────────────────────

export default function IncomingTransferScreen({ navigation, route }: Props) {
  const ticketId = route.params?.ticketId
  const transferToken = route.params?.transferToken
  const confirmingLabel = useRef<string>('Accepting…')

  const {
    data: transfer,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['incoming-transfer', ticketId],
    queryFn: async () => {
      const res = await get<ApiResponse<IncomingTransferItem[]>>(
        '/tickets/transfer/incoming'
      )
      const list = res.data.data ?? []
      const match = list.find((item) => item.ticket._id === ticketId)
      if (match === undefined) {
        throw new Error('Transfer not found or already resolved.')
      }
      return match
    },
    enabled: !!ticketId && !!transferToken,
    staleTime: 0,
  })

  const { mutate: claimTicket, isPending: isClaiming } = useClaimTicket()
  const [isDeclining, setIsDeclining] = React.useState(false)
  const [isDeclined, setIsDeclined] = React.useState(false)
  const [isSuccess, setIsSuccess] = React.useState(false)
  const [actionError, setActionError] = React.useState<string | null>(null)

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleAccept = () => {
    if (transferToken === undefined) return
    confirmingLabel.current = 'Accepting ticket…'
    Alert.alert(
      'Accept Ticket?',
      'This ticket will be transferred to you and synced to your face immediately.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: () => {
            claimTicket(
              { reference: transferToken },
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
    if (ticketId === undefined || transferToken === undefined) return
    Alert.alert(
      'Decline Transfer?',
      'The sender will be notified. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            setIsDeclining(true)
            try {
              await post('/tickets/transfer/decline', { ticketId, transferToken })
              setIsDeclined(true)
            } catch (err) {
              setActionError(
                err instanceof Error ? err.message : 'Could not decline. Try again.'
              )
            } finally {
              setIsDeclining(false)
            }
          },
        },
      ]
    )
  }

  // ── Guard: missing params ─────────────────────────────────────────────────

  if (ticketId === undefined || transferToken === undefined) {
    return (
      <StateScreen
        type="error"
        title="Invalid transfer link"
        subtitle="This transfer link is missing required information."
      />
    )
  }

  // ── Loading ───────────────────────────────────────────────────────────────

  if (isLoading || isClaiming || isDeclining) {
    return (
      <StateScreen
        type="loading"
        title={
          isClaiming
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
    return (
      <StateScreen
        type="success"
        title="Ticket is now yours"
        subtitle={
          transfer !== undefined
            ? `${transfer.ticket.eventname}\n\nYou can now check in with your face or QR code.`
            : 'You can now check in with your face or QR code.'
        }
        action={{
          label: 'View My Tickets',
          onPress: () => navigation.navigate('Tickets'),
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
          onPress: () => navigation.navigate('Tickets'),
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

  if (transfer === undefined) {
    return (
      <StateScreen
        type="error"
        title="Transfer not found"
        subtitle="This transfer may have already been resolved."
      />
    )
  }

  const { ticket, senderName, venue } = transfer

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.reviewHeader}>
          <AnimatedPressable
            onPress={() => navigation.goBack()}
            hapticStyle="light"
            style={styles.backBtn}
          >
            <ChevronLeft size={22} color={colors.mobile.textPrimary} />
          </AnimatedPressable>
          <Text style={styles.reviewTitle}>Incoming Ticket</Text>
          <Text style={styles.reviewSender}>From {senderName}</Text>
        </View>

        {/* Ticket card */}
        <View style={styles.ticketCard}>
          <Text style={styles.eventName}>{ticket.eventname}</Text>
          <Text style={styles.metaText}>
            {formatDate(ticket.date)} · {formatTime(ticket.date)}
          </Text>
          {typeof venue === 'string' && venue.length > 0 && (
            <Text style={styles.metaText}>{venue}</Text>
          )}
          <View style={styles.ticketTypeRow}>
            <Text style={styles.ticketTypeText}>{ticket.type}</Text>
            <Text style={styles.ticketPriceText}>{formatNaira(ticket.amount)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.facePill}>
            <Text style={styles.facePillText}>
              ✦ Face sync included — no camera needed to accept
            </Text>
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
          Accepting syncs this ticket to your face instantly. No camera needed.
        </Text>
      </ScrollView>
    </SafeAreaView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.mobile.bg,
  },
  scrollContent: {
    padding: sp[4],
    paddingBottom: sp[10],
  },

  // ── Header ────────────────────────────────────────────────────────────────
  reviewHeader: {
    marginBottom: sp[5],
  },
  backBtn: {
    minWidth: 44,
    minHeight: 44,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: sp[3],
    marginLeft: -sp[2],
  },
  reviewTitle: {
    fontSize: fs.xl,
    fontWeight: '700',
    color: colors.mobile.textPrimary,
    marginBottom: sp[1],
  },
  reviewSender: {
    fontSize: fs.sm,
    color: colors.mobile.textMuted,
  },

  // ── Ticket card ───────────────────────────────────────────────────────────
  ticketCard: {
    backgroundColor: colors.mobile.surface,
    borderRadius: rd.xl,
    padding: sp[4],
    marginBottom: sp[5],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.mobile.border,
  },
  eventName: {
    fontSize: fs.lg,
    fontWeight: '700',
    color: colors.mobile.textPrimary,
    marginBottom: sp[2],
  },
  metaText: {
    fontSize: fs.sm,
    color: colors.mobile.textMuted,
    marginBottom: sp[1],
  },
  ticketTypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: sp[3],
    marginBottom: sp[3],
  },
  ticketTypeText: {
    fontSize: fs.sm,
    color: colors.mobile.textSecondary,
    fontWeight: '500',
  },
  ticketPriceText: {
    fontSize: fs.base,
    fontWeight: '700',
    color: colors.mobile.textPrimary,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.mobile.border,
    marginBottom: sp[3],
  },
  facePill: {
    backgroundColor: 'rgba(124,58,237,0.1)',
    borderRadius: rd.full,
    paddingVertical: sp[2],
    paddingHorizontal: sp[3],
    alignSelf: 'flex-start',
  },
  facePillText: {
    fontSize: fs.xs,
    color: colors.brand.DEFAULT,
    fontWeight: '500',
  },

  // ── Action error ──────────────────────────────────────────────────────────
  actionError: {
    fontSize: fs.sm,
    color: colors.mobile.error,
    textAlign: 'center',
    marginBottom: sp[4],
    lineHeight: 20,
  },

  // ── Buttons ───────────────────────────────────────────────────────────────
  acceptButton: {
    width: '100%',
    minHeight: 52,
    backgroundColor: colors.brand.DEFAULT,
    borderRadius: rd.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: sp[3],
  },
  acceptButtonText: {
    fontSize: fs.base,
    fontWeight: '700',
    color: colors.mobile.textPrimary,
  },
  declineButton: {
    width: '100%',
    minHeight: 52,
    backgroundColor: 'transparent',
    borderRadius: rd.full,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: sp[4],
  },
  declineButtonText: {
    fontSize: fs.base,
    fontWeight: '600',
    color: colors.mobile.error,
  },

  // ── Footer ────────────────────────────────────────────────────────────────
  footerNote: {
    fontSize: fs.xs,
    color: colors.mobile.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
})
