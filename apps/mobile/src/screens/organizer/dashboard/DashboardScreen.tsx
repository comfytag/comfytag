import React, { useEffect, useRef } from 'react'
import {
  Animated,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import { Plus, ScanFace, ChevronRight } from 'lucide-react-native'
import type { Event } from '@comfytag/types'
import { colors, sp, rd, fs } from '@comfytag/ui/tokens'
import { formatNaira, formatDate } from '@comfytag/utils'
import { AnimatedPressable } from '../../../components/ui/AnimatedPressable'
import { useAuthStore, useModeStore } from '../../../store'
import { usePartnerRevenue, useMyEvents } from '../../../hooks'
import type { OrganizerTabParamList } from '../../../navigation/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type TabNav = BottomTabNavigationProp<OrganizerTabParamList>

// ─── Constants ────────────────────────────────────────────────────────────────

const FINANCIAL_GOLD = '#D97706'

const STATUS_BADGE: Record<string, { bg: string; text: string }> = {
  draft:     { bg: '#292524', text: '#A8A29E' },
  published: { bg: '#14532D', text: '#86EFAC' },
  cancelled: { bg: '#450A0A', text: '#FCA5A5' },
  completed: { bg: '#1C1917', text: '#78716C' },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

function getUpcomingEvents(events: Event[]): Event[] {
  const now = new Date()
  return events
    .filter((e) => e.status === 'published' && new Date(e.date) > now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3)
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SkeletonBlock({ height, style }: { height: number; style?: object }) {
  const opacity = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ])
    )
    pulse.start()
    return () => pulse.stop()
  }, [opacity])

  return (
    <Animated.View
      style={[
        {
          height,
          borderRadius: rd.md,
          backgroundColor: colors.mobile.surface,
          opacity,
        },
        style,
      ]}
    />
  )
}

function LoadingSkeleton() {
  return (
    <View style={styles.skeletonContainer}>
      <SkeletonBlock height={100} style={styles.skeletonFull} />
      <SkeletonBlock height={120} style={styles.skeletonFull} />
      <View style={styles.skeletonRow}>
        <SkeletonBlock height={80} style={styles.skeletonThird} />
        <SkeletonBlock height={80} style={styles.skeletonThird} />
        <SkeletonBlock height={80} style={styles.skeletonThird} />
      </View>
    </View>
  )
}

interface StatCardProps {
  label: string
  value: string | number
  valueColor?: string
}

function StatCard({ label, value, valueColor }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, { color: valueColor ?? colors.mobile.textPrimary }]}>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

interface EventRowProps {
  event: Event
}

function EventRow({ event }: EventRowProps) {
  const badge = STATUS_BADGE[event.status] ?? STATUS_BADGE.draft
  return (
    <View style={styles.eventRow}>
      <View style={styles.eventRowLeft}>
        <Text style={styles.eventName} numberOfLines={1}>
          {event.name}
        </Text>
        <Text style={styles.eventDate}>{formatDate(event.date)}</Text>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
        <Text style={[styles.statusBadgeText, { color: badge.text }]}>
          {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
        </Text>
      </View>
    </View>
  )
}

interface QuickActionRowProps {
  icon: React.ReactElement
  label: string
  onPress: () => void
}

function QuickActionRow({ icon, label, onPress }: QuickActionRowProps) {
  return (
    <AnimatedPressable onPress={onPress} hapticStyle="light" style={styles.quickActionRow}>
      <View style={styles.quickActionLeft}>
        <View style={styles.quickActionIconWrap}>{icon}</View>
        <Text style={styles.quickActionLabel}>{label}</Text>
      </View>
      <ChevronRight size={18} color={colors.mobile.textMuted} strokeWidth={2} />
    </AnimatedPressable>
  )
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const tabNavigation = useNavigation<TabNav>()
  const user = useAuthStore((state) => state.user)
  const setMode = useModeStore((state) => state.setMode)

  const userName = user?.name ?? 'Organizer'
  const firstName = userName.split(' ')[0]

  const {
    data: revenue,
    isLoading: revenueLoading,
    isError: revenueError,
    isFetching: revenueFetching,
    refetch: refetchRevenue,
  } = usePartnerRevenue()

  const {
    data: events = [],
    isLoading: eventsLoading,
    isFetching: eventsFetching,
    refetch: refetchEvents,
  } = useMyEvents()

  const isLoading = revenueLoading || eventsLoading
  const isError = revenueError
  const isFetching = revenueFetching || eventsFetching

  const handleRetry = (): void => {
    void refetchRevenue()
    void refetchEvents()
  }

  const upcomingEvents = getUpcomingEvents(events)
  const publishedCount = events.filter((e) => e.status === 'published').length
  const totalEvents = revenue?.totalEvents ?? events.length
  const totalSold = revenue?.totalTicketsSold ?? 0

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={handleRetry}
            tintColor={colors.brand.DEFAULT}
            colors={[colors.brand.DEFAULT]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTextGroup}>
            <Text style={styles.greetingText}>
              {greeting()}, {firstName}
            </Text>
            <Text style={styles.subGreeting}>Organizer Dashboard</Text>
          </View>
          <AnimatedPressable
            onPress={() => setMode('attendee')}
            hapticStyle="light"
            style={styles.switchPill}
          >
            <Text style={styles.switchPillText}>Switch to Attendee</Text>
          </AnimatedPressable>
        </View>

        {isLoading && <LoadingSkeleton />}

        {isError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Failed to load dashboard data.</Text>
            <AnimatedPressable onPress={handleRetry} hapticStyle="medium" style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </AnimatedPressable>
          </View>
        )}

        {!isLoading && !isError && revenue !== undefined && (
          <>
            {/* Revenue Card */}
            <View style={styles.revenueCard}>
              <Text style={styles.revenueTotalLabel}>TOTAL REVENUE</Text>
              <Text style={styles.revenueTotalValue}>
                {formatNaira(revenue.totalRevenue)}
              </Text>
              <View style={styles.revenueDivider} />
              <View style={styles.revenueRow}>
                <View style={styles.revenueRowItem}>
                  <Text style={styles.revenueSubLabel}>Available Balance</Text>
                  <Text style={styles.revenueSubValue}>
                    {formatNaira(revenue.availableBalance)}
                  </Text>
                </View>
                <View style={styles.revenueRowDivider} />
                <View style={styles.revenueRowItem}>
                  <Text style={styles.revenueSubLabel}>Pending Withdrawals</Text>
                  <Text style={styles.revenueSubValue}>
                    {formatNaira(revenue.pendingWithdrawals)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Quick Stats Row */}
            <View style={styles.statsRow}>
              <StatCard label="Total Events" value={totalEvents} />
              <StatCard label="Published" value={publishedCount} />
              <StatCard
                label="Total Sold"
                value={totalSold}
                valueColor={colors.brand.DEFAULT}
              />
            </View>

            {/* Upcoming Events */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Upcoming Events</Text>
                <AnimatedPressable
                  onPress={() => tabNavigation.navigate('Events')}
                  hapticStyle="light"
                  style={styles.seeAllButton}
                >
                  <Text style={styles.seeAllText}>See All →</Text>
                </AnimatedPressable>
              </View>

              <View style={styles.sectionCard}>
                {upcomingEvents.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>No upcoming events.</Text>
                    <Text style={styles.emptyStateSubText}>
                      Published events with future dates appear here.
                    </Text>
                  </View>
                ) : (
                  upcomingEvents.map((event, index) => (
                    <React.Fragment key={event._id}>
                      <EventRow event={event} />
                      {index < upcomingEvents.length - 1 && (
                        <View style={styles.rowDivider} />
                      )}
                    </React.Fragment>
                  ))
                )}
              </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.quickActionsGroup}>
                <QuickActionRow
                  icon={<Plus size={20} color={colors.brand.DEFAULT} strokeWidth={2} />}
                  label="Create New Event"
                  onPress={() => tabNavigation.navigate('Events')}
                />
                <QuickActionRow
                  icon={<ScanFace size={20} color={colors.brand.DEFAULT} strokeWidth={2} />}
                  label="View Check-ins"
                  onPress={() => tabNavigation.navigate('CheckIn')}
                />
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.mobile.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: sp[4],
    paddingBottom: sp[8],
    paddingTop: sp[4],
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: sp[6],
  },
  headerTextGroup: {
    flex: 1,
    marginRight: sp[3],
  },
  greetingText: {
    fontSize: fs.xl,
    fontWeight: '700',
    color: colors.mobile.textPrimary,
  },
  subGreeting: {
    fontSize: fs.sm,
    color: colors.mobile.textMuted,
    marginTop: 2,
  },
  switchPill: {
    height: 28,
    paddingHorizontal: sp[3],
    borderRadius: rd.full,
    borderWidth: 1,
    borderColor: colors.brand.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchPillText: {
    fontSize: fs.xs,
    color: colors.brand.DEFAULT,
    fontWeight: '600',
  },

  // Skeleton
  skeletonContainer: {
    gap: sp[4],
  },
  skeletonFull: {
    width: '100%',
  },
  skeletonRow: {
    flexDirection: 'row',
    gap: sp[3],
  },
  skeletonThird: {
    flex: 1,
  },

  // Error
  errorContainer: {
    alignItems: 'center',
    paddingVertical: sp[8],
    gap: sp[4],
  },
  errorText: {
    fontSize: fs.base,
    color: colors.mobile.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: sp[6],
    paddingVertical: sp[3],
    borderRadius: rd.md,
    backgroundColor: colors.brand.DEFAULT,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: {
    fontSize: fs.sm,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Revenue Card
  revenueCard: {
    backgroundColor: colors.mobile.surface,
    borderRadius: rd.xl,
    padding: sp[5],
    marginBottom: sp[4],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.mobile.border,
  },
  revenueTotalLabel: {
    fontSize: fs.xs,
    color: colors.mobile.textMuted,
    letterSpacing: 1,
    fontWeight: '600',
    marginBottom: sp[1],
  },
  revenueTotalValue: {
    fontSize: fs['2xl'],
    fontWeight: '700',
    color: FINANCIAL_GOLD,
    marginBottom: sp[4],
  },
  revenueDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.mobile.border,
    marginBottom: sp[4],
  },
  revenueRow: {
    flexDirection: 'row',
  },
  revenueRowItem: {
    flex: 1,
  },
  revenueRowDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.mobile.border,
    marginHorizontal: sp[4],
  },
  revenueSubLabel: {
    fontSize: fs.xs,
    color: colors.mobile.textMuted,
    marginBottom: 4,
  },
  revenueSubValue: {
    fontSize: fs.lg,
    fontWeight: '700',
    color: colors.mobile.textPrimary,
  },

  // Quick Stats Row
  statsRow: {
    flexDirection: 'row',
    gap: sp[3],
    marginBottom: sp[5],
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.mobile.surface,
    borderRadius: rd.lg,
    paddingVertical: sp[4],
    paddingHorizontal: sp[3],
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.mobile.border,
  },
  statValue: {
    fontSize: fs['2xl'],
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: fs.xs,
    color: colors.mobile.textMuted,
    textAlign: 'center',
  },

  // Sections
  section: {
    marginBottom: sp[5],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: sp[3],
  },
  sectionTitle: {
    fontSize: fs.base,
    fontWeight: '700',
    color: colors.mobile.textPrimary,
  },
  seeAllButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: sp[2],
  },
  seeAllText: {
    fontSize: fs.sm,
    color: colors.brand.DEFAULT,
    fontWeight: '600',
  },
  sectionCard: {
    backgroundColor: colors.mobile.surface,
    borderRadius: rd.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.mobile.border,
    overflow: 'hidden',
  },

  // Event Rows
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sp[4],
    paddingVertical: sp[4],
    minHeight: 44,
  },
  eventRowLeft: {
    flex: 1,
    marginRight: sp[3],
  },
  eventName: {
    fontSize: fs.sm,
    fontWeight: '600',
    color: colors.mobile.textPrimary,
    marginBottom: 2,
  },
  eventDate: {
    fontSize: fs.xs,
    color: colors.mobile.textMuted,
  },
  statusBadge: {
    paddingHorizontal: sp[2],
    paddingVertical: 4,
    borderRadius: rd.sm,
  },
  statusBadgeText: {
    fontSize: fs.xs,
    fontWeight: '600',
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.mobile.border,
    marginHorizontal: sp[4],
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: sp[6],
    paddingHorizontal: sp[4],
  },
  emptyStateText: {
    fontSize: fs.sm,
    fontWeight: '600',
    color: colors.mobile.textSecondary,
    marginBottom: sp[1],
  },
  emptyStateSubText: {
    fontSize: fs.xs,
    color: colors.mobile.textMuted,
    textAlign: 'center',
  },

  // Quick Actions
  quickActionsGroup: {
    gap: sp[3],
  },
  quickActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.mobile.surface,
    borderRadius: rd.lg,
    paddingHorizontal: sp[4],
    minHeight: 56,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.mobile.border,
  },
  quickActionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp[3],
    flex: 1,
  },
  quickActionIconWrap: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontSize: fs.sm,
    fontWeight: '600',
    color: colors.mobile.textPrimary,
  },
})
