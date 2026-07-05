import React from 'react'
import {
  View,
  Text,
  ScrollView,
  Image,
  ActivityIndicator,
  StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { StackScreenProps } from '@react-navigation/stack'
import { ChevronLeft, QrCode, CheckCircle2 } from 'lucide-react-native'
import { colors, sp, rd, fs } from '@comfytag/ui/tokens'
import { formatNaira, formatDate, formatTime } from '@comfytag/utils'
import { AnimatedPressable } from '../../../components/ui/AnimatedPressable'
import { useTicketDetail, useTicketStatus } from '../../../hooks'
import type { Ticket } from '@comfytag/types'
import type { TicketsStackParamList } from '../../../navigation/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = StackScreenProps<TicketsStackParamList, 'TicketDetail'>

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<Ticket['status'], { bg: string; text: string }> = {
  active:      { bg: 'rgba(16,185,129,0.15)', text: colors.mobile.success },
  used:        { bg: colors.mobile.surfaceRaised, text: colors.mobile.textMuted },
  transferred: { bg: colors.mobile.surfaceRaised, text: colors.mobile.textMuted },
  refunded:    { bg: 'rgba(239,68,68,0.15)', text: colors.mobile.error },
  ended:       { bg: colors.mobile.surfaceRaised, text: colors.mobile.textMuted },
}

// ─── TicketDetailScreen ───────────────────────────────────────────────────────

export default function TicketDetailScreen({ route, navigation }: Props) {
  const { ticketId } = route.params

  const {
    data: ticket,
    isLoading,
    isError,
    refetch,
  } = useTicketDetail(ticketId)

  const { data: statusData } = useTicketStatus(ticketId)

  // ── Loading ───────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <AnimatedPressable
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hapticStyle="light"
          >
            <ChevronLeft size={24} color={colors.mobile.textPrimary} strokeWidth={2} />
          </AnimatedPressable>
          <Text style={styles.headerTitle}>Ticket</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color={colors.brand.DEFAULT} />
        </View>
      </SafeAreaView>
    )
  }

  // ── Error ─────────────────────────────────────────────────────────────────

  if (isError || ticket === undefined) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <AnimatedPressable
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hapticStyle="light"
          >
            <ChevronLeft size={24} color={colors.mobile.textPrimary} strokeWidth={2} />
          </AnimatedPressable>
          <Text style={styles.headerTitle}>Ticket</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.centeredContainer}>
          <Text style={styles.errorText}>Couldn't load ticket</Text>
          <AnimatedPressable onPress={() => void refetch()} style={styles.retryPressable}>
            <Text style={styles.retryText}>Tap to retry</Text>
          </AnimatedPressable>
        </View>
      </SafeAreaView>
    )
  }

  // ── Derived ───────────────────────────────────────────────────────────────

  // Real-time status wins when available
  const currentStatus = statusData?.status ?? ticket.status
  const isCheckedIn = statusData?.checkedIn === true
  const badge = STATUS_COLORS[currentStatus]
  const isFaceLinked = typeof ticket.faceOwner === 'string' && ticket.faceOwner.length > 0
  const hasQr = typeof ticket.qrCode === 'string' && ticket.qrCode.length > 0

  // ── Loaded ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <AnimatedPressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hapticStyle="light"
        >
          <ChevronLeft size={24} color={colors.mobile.textPrimary} strokeWidth={2} />
        </AnimatedPressable>
        <Text style={styles.headerTitle}>Ticket</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Checked-in banner */}
        {isCheckedIn && (
          <View style={styles.checkedInBanner}>
            <CheckCircle2 size={16} color={colors.mobile.success} />
            <Text style={styles.checkedInText}>Checked in</Text>
          </View>
        )}

        {/* Event card */}
        <View style={styles.card}>
          <View style={styles.eventCardRow}>
            <View style={styles.eventCardLeft}>
              <Text style={styles.eventName} numberOfLines={2}>
                {ticket.eventname}
              </Text>
              <Text style={styles.eventMeta}>
                {ticket.type} · {ticket.numOfTicket} ticket{ticket.numOfTicket > 1 ? 's' : ''}
              </Text>
              <Text style={styles.eventDate}>
                {formatDate(ticket.date)} · {formatTime(ticket.date)}
              </Text>
            </View>
            <Text style={styles.eventAmount}>{formatNaira(ticket.amount)}</Text>
          </View>
        </View>

        {/* QR card */}
        <View style={[styles.card, styles.qrCard]}>
          {hasQr ? (
            <Image
              source={{ uri: ticket.qrCode }}
              style={styles.qrImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.qrPlaceholder}>
              <QrCode size={48} color={colors.mobile.textMuted} strokeWidth={1.5} />
              <Text style={styles.qrPlaceholderText}>QR not available</Text>
            </View>
          )}
          <Text style={styles.qrRef}>
            {ticket.reference.slice(-8).toUpperCase()}
          </Text>
        </View>

        {/* Status card */}
        <View style={[styles.card, styles.statusCard]}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Status</Text>
            <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
              <Text style={[styles.statusBadgeText, { color: badge.text }]}>
                {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
              </Text>
            </View>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Face Entry</Text>
            {isFaceLinked ? (
              <Text style={styles.faceLinkedText}>Linked ✓</Text>
            ) : (
              <Text style={styles.faceNotLinkedText}>Not linked</Text>
            )}
          </View>
          <View style={[styles.statusRow, styles.statusRowLast]}>
            <Text style={styles.statusLabel}>Reference</Text>
            <Text style={styles.refText}>{ticket.reference.toUpperCase()}</Text>
          </View>
        </View>

        {/* Transfer button */}
        {ticket.status === 'active' && !isCheckedIn && (
          <AnimatedPressable
            onPress={() =>
              navigation.navigate('TransferTicket', {
                ticketId: ticket._id,
                eventName: ticket.eventname,
                ticketType: ticket.type,
              })
            }
            style={styles.transferButton}
            hapticStyle="medium"
          >
            <Text style={styles.transferButtonText}>Transfer Ticket</Text>
          </AnimatedPressable>
        )}

        <View style={styles.bottomSpacer} />
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

  // ── Loading / error ───────────────────────────────────────────────────────
  centeredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: sp[4],
  },
  errorText: {
    fontSize: fs.base,
    fontWeight: '600',
    color: colors.mobile.textPrimary,
    textAlign: 'center',
  },
  retryPressable: {
    paddingHorizontal: sp[6],
    paddingVertical: sp[3],
  },
  retryText: {
    fontSize: fs.sm,
    fontWeight: '600',
    color: colors.brand.DEFAULT,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sp[4],
    paddingTop: sp[2],
    paddingBottom: sp[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.mobile.border,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: fs.base,
    fontWeight: '700',
    color: colors.mobile.textPrimary,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 44,
  },

  // ── Scroll ────────────────────────────────────────────────────────────────
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: sp[4],
    paddingTop: sp[4],
  },

  // ── Checked-in banner ─────────────────────────────────────────────────────
  checkedInBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp[2],
    backgroundColor: 'rgba(16,185,129,0.12)',
    borderRadius: rd.md,
    paddingVertical: sp[3],
    paddingHorizontal: sp[4],
    marginBottom: sp[4],
  },
  checkedInText: {
    fontSize: fs.sm,
    fontWeight: '700',
    color: colors.mobile.success,
  },

  // ── Card ──────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: colors.mobile.surface,
    borderRadius: rd.xl,
    padding: sp[4],
    marginBottom: sp[4],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.mobile.border,
  },

  // ── Event card ────────────────────────────────────────────────────────────
  eventCardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: sp[3],
  },
  eventCardLeft: {
    flex: 1,
  },
  eventName: {
    fontSize: fs.lg,
    fontWeight: '700',
    color: colors.mobile.textPrimary,
    marginBottom: sp[1],
  },
  eventMeta: {
    fontSize: fs.sm,
    color: colors.mobile.textSecondary,
    marginBottom: sp[1],
  },
  eventDate: {
    fontSize: fs.sm,
    color: colors.mobile.textMuted,
  },
  eventAmount: {
    fontSize: fs.xl,
    fontWeight: '700',
    color: colors.brand.DEFAULT,
    flexShrink: 0,
  },

  // ── QR card ───────────────────────────────────────────────────────────────
  qrCard: {
    padding: sp[6],
    alignItems: 'center',
  },
  qrImage: {
    width: 200,
    height: 200,
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    borderRadius: rd.xl,
    backgroundColor: colors.mobile.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
    gap: sp[3],
  },
  qrPlaceholderText: {
    fontSize: fs.xs,
    color: colors.mobile.textMuted,
  },
  qrRef: {
    fontSize: fs.xs,
    color: colors.mobile.textMuted,
    textAlign: 'center',
    marginTop: sp[3],
    letterSpacing: 2,
    fontFamily: 'monospace',
  },

  // ── Status card ───────────────────────────────────────────────────────────
  statusCard: {
    padding: 0,
    paddingHorizontal: sp[4],
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: sp[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.mobile.border,
  },
  statusRowLast: {
    borderBottomWidth: 0,
  },
  statusLabel: {
    fontSize: fs.sm,
    color: colors.mobile.textMuted,
  },
  statusBadge: {
    borderRadius: rd.full,
    paddingVertical: 4,
    paddingHorizontal: sp[3],
  },
  statusBadgeText: {
    fontSize: fs.xs,
    fontWeight: '600',
  },
  faceLinkedText: {
    fontSize: fs.sm,
    fontWeight: '700',
    color: colors.mobile.success,
  },
  faceNotLinkedText: {
    fontSize: fs.sm,
    color: colors.mobile.textMuted,
  },
  refText: {
    fontSize: fs.xs,
    color: colors.mobile.textSecondary,
    fontFamily: 'monospace',
    letterSpacing: 1,
  },

  // ── Transfer button ───────────────────────────────────────────────────────
  transferButton: {
    height: 52,
    backgroundColor: 'transparent',
    borderRadius: rd.full,
    borderWidth: 1,
    borderColor: colors.mobile.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transferButtonText: {
    fontSize: fs.base,
    fontWeight: '700',
    color: colors.mobile.textPrimary,
  },

  // ── Bottom spacer ─────────────────────────────────────────────────────────
  bottomSpacer: {
    height: sp[8],
  },
})
