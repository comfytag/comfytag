import React from 'react'
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { StackScreenProps } from '@react-navigation/stack'
import { ChevronLeft, ChevronRight } from 'lucide-react-native'
import type { EventAnalytics, TicketTier } from '@comfytag/types'
import { colors, sp, rd, fs } from '@comfytag/ui/tokens'
import { formatNaira, formatDate, formatTime } from '@comfytag/utils'
import { AnimatedPressable } from '../../../components/ui/AnimatedPressable'
import { useOrganizerEventById, useEventAnalytics } from '../../../hooks'
import type { OrganizerEventsStackParamList } from '../../../navigation/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = StackScreenProps<OrganizerEventsStackParamList, 'OrganizerEventDetail'>

// ─── Constants ────────────────────────────────────────────────────────────────

const FINANCIAL_GOLD = '#D97706'

const STATUS_BADGE: Record<string, { bg: string; text: string }> = {
  draft:     { bg: '#292524', text: '#A8A29E' },
  published: { bg: '#14532D', text: '#86EFAC' },
  cancelled: { bg: '#450A0A', text: '#FCA5A5' },
  completed: { bg: '#1C1917', text: '#78716C' },
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  value: string
  label: string
  valueColor: string
}

function StatCard({ value, label, valueColor }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, { color: valueColor }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

// ─── InfoRow ──────────────────────────────────────────────────────────────────

interface InfoRowProps {
  label: string
  value: string
  isLast?: boolean
}

function InfoRow({ label, value, isLast = false }: InfoRowProps) {
  return (
    <View style={[styles.infoRow, !isLast && styles.infoRowBorder]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={2}>{value}</Text>
    </View>
  )
}

// ─── ManageActionRow ──────────────────────────────────────────────────────────

interface ActionRowProps {
  label: string
  onPress: () => void
  isLast?: boolean
}

function ActionRow({ label, onPress, isLast = false }: ActionRowProps) {
  return (
    <AnimatedPressable hapticStyle="light" onPress={onPress}>
      <View style={[styles.actionRow, !isLast && styles.actionRowBorder]}>
        <Text style={styles.actionLabel}>{label}</Text>
        <ChevronRight size={18} color={colors.mobile.textMuted} strokeWidth={2} />
      </View>
    </AnimatedPressable>
  )
}

// ─── TierRow ──────────────────────────────────────────────────────────────────

interface TierRowProps {
  tier: TicketTier
  isLast?: boolean
}

function TierRow({ tier, isLast = false }: TierRowProps) {
  return (
    <View style={[styles.tierRow, !isLast && styles.tierRowBorder]}>
      <Text style={styles.tierName}>{tier.name}</Text>
      <View style={styles.tierRight}>
        <Text style={styles.tierPrice}>{formatNaira(tier.price)}</Text>
        <Text style={styles.tierProgress}>
          {tier.sold ?? 0}/{tier.capacity} sold
        </Text>
      </View>
    </View>
  )
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function EventDetailScreen({ navigation, route }: Props) {
  const { eventId, eventName } = route.params

  const {
    data: event,
    isLoading: eventLoading,
    isError: eventError,
    refetch: refetchEvent,
  } = useOrganizerEventById(eventId)

  const {
    data: analytics,
    isLoading: analyticsLoading,
    isError: analyticsError,
    refetch: refetchAnalytics,
  } = useEventAnalytics(eventId)

  const isLoading = eventLoading || analyticsLoading
  const isError = eventError || analyticsError

  const handleRetry = (): void => {
    void refetchEvent()
    void refetchAnalytics()
  }

  const badge = event ? (STATUS_BADGE[event.status] ?? STATUS_BADGE.draft) : null

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <AnimatedPressable
          hapticStyle="light"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ChevronLeft size={24} color={colors.mobile.textPrimary} strokeWidth={2} />
        </AnimatedPressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{eventName}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {isLoading ? (
        <View style={styles.centeredMessage}>
          <Text style={styles.mutedText}>Loading event…</Text>
        </View>
      ) : isError ? (
        <View style={styles.centeredMessage}>
          <Text style={styles.mutedText}>Failed to load event</Text>
          <AnimatedPressable hapticStyle="medium" onPress={handleRetry} style={styles.retryButton}>
            <Text style={styles.retryText}>Try Again</Text>
          </AnimatedPressable>
        </View>
      ) : event !== undefined && analytics !== undefined ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero stats */}
          <View style={styles.statsRow}>
            <StatCard
              value={formatNaira(analytics.totalRevenue)}
              label="Revenue"
              valueColor={FINANCIAL_GOLD}
            />
            <StatCard
              value={String(analytics.totalTicketsSold)}
              label="Sold"
              valueColor={colors.brand.DEFAULT}
            />
            <StatCard
              value={String(analytics.checkInCount)}
              label="Check-ins"
              valueColor={colors.mobile.success}
            />
          </View>

          {/* Event info card */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Event Info</Text>
            <InfoRow label="Date" value={formatDate(event.date)} />
            <InfoRow label="Time" value={formatTime(event.date)} />
            <InfoRow label="Venue" value={event.venue} />
            {event.category ? (
              <InfoRow label="Category" value={event.category} />
            ) : null}
            {analytics.totalCapacity != null ? (
              <InfoRow
                label="Capacity"
                value={`${analytics.totalTicketsSold} / ${analytics.totalCapacity}`}
              />
            ) : null}
            <View style={[styles.infoRow, styles.infoRowStatus]}>
              <Text style={styles.infoLabel}>Status</Text>
              {badge ? (
                <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.statusBadgeText, { color: badge.text }]}>
                    {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Ticket tiers card */}
          {event.ticketType && event.ticketType.length > 0 ? (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Ticket Tiers</Text>
              {event.ticketType.map((tier, index) => (
                <TierRow
                  key={tier._id}
                  tier={tier}
                  isLast={index === event.ticketType.length - 1}
                />
              ))}
            </View>
          ) : null}

          {/* Manage actions card */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Manage</Text>
            <ActionRow
              label="Manage Tiers"
              onPress={() => navigation.navigate('TicketTiers', { eventId, eventName })}
            />
            <ActionRow
              label="Edit Event"
              onPress={() => navigation.navigate('EditEvent', { eventId })}
            />
            <ActionRow
              label="Manage Promos"
              onPress={() => navigation.navigate('PromoCodes', { eventId, eventName })}
            />
            <ActionRow
              label="View Audience"
              onPress={() => navigation.navigate('Audience', { eventId, eventName })}
              isLast
            />
          </View>
        </ScrollView>
      ) : null}
    </SafeAreaView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.mobile.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sp[4],
    paddingTop: sp[3],
    paddingBottom: sp[3],
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: fs.base,
    fontWeight: '700',
    color: colors.mobile.textPrimary,
    paddingHorizontal: sp[2],
  },
  headerSpacer: {
    width: 44,
  },
  scrollContent: {
    paddingHorizontal: sp[4],
    paddingBottom: sp[8],
    gap: sp[4],
  },
  statsRow: {
    flexDirection: 'row',
    gap: sp[3],
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.mobile.surface,
    borderRadius: rd.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.mobile.border,
    paddingVertical: sp[4],
    paddingHorizontal: sp[2],
    alignItems: 'center',
    gap: sp[1],
  },
  statValue: {
    fontSize: fs.xl,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: fs.xs,
    color: colors.mobile.textMuted,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.mobile.surface,
    borderRadius: rd.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.mobile.border,
    padding: sp[4],
  },
  sectionTitle: {
    fontSize: fs.sm,
    fontWeight: '700',
    color: colors.mobile.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: sp[3],
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: sp[3],
  },
  infoRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.mobile.border,
  },
  infoRowStatus: {
    // last row — no bottom border
  },
  infoLabel: {
    fontSize: fs.xs,
    color: colors.mobile.textMuted,
  },
  infoValue: {
    fontSize: fs.sm,
    color: colors.mobile.textPrimary,
    textAlign: 'right',
    flex: 1,
    marginLeft: sp[4],
  },
  statusBadge: {
    paddingHorizontal: sp[3],
    paddingVertical: sp[1],
    borderRadius: rd.full,
  },
  statusBadgeText: {
    fontSize: fs.xs,
    fontWeight: '600',
  },
  tierRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: sp[3],
  },
  tierRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.mobile.border,
  },
  tierName: {
    fontSize: fs.sm,
    fontWeight: '700',
    color: colors.mobile.textPrimary,
  },
  tierRight: {
    alignItems: 'flex-end',
    gap: sp[1],
  },
  tierPrice: {
    fontSize: fs.sm,
    fontWeight: '600',
    color: colors.brand.DEFAULT,
  },
  tierProgress: {
    fontSize: fs.xs,
    color: colors.mobile.textMuted,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
  },
  actionRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.mobile.border,
  },
  actionLabel: {
    fontSize: fs.base,
    color: colors.mobile.textPrimary,
  },
  centeredMessage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: sp[4],
  },
  mutedText: {
    fontSize: fs.base,
    color: colors.mobile.textMuted,
  },
  retryButton: {
    paddingHorizontal: sp[6],
    paddingVertical: sp[3],
    backgroundColor: colors.brand.DEFAULT,
    borderRadius: rd.md,
  },
  retryText: {
    fontSize: fs.sm,
    fontWeight: '600',
    color: '#FFFFFF',
  },
})
