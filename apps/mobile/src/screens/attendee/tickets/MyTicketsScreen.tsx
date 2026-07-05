import React, { useRef, useEffect, useState } from 'react'
import {
  View,
  Text,
  FlatList,
  Animated,
  StyleSheet,
  RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import { Ticket as TicketIcon } from 'lucide-react-native'
import { colors, sp, rd, fs } from '@comfytag/ui/tokens'
import { formatNaira, formatDate } from '@comfytag/utils'
import { useMyTickets } from '../../../hooks'
import { AnimatedPressable } from '../../../components/ui/AnimatedPressable'
import type { Ticket } from '@comfytag/types'
import type { TicketsStackParamList, AttendeeTabParamList } from '../../../navigation/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type Nav = StackNavigationProp<TicketsStackParamList, 'TicketsList'>
type TabNav = BottomTabNavigationProp<AttendeeTabParamList>

type TabType = 'upcoming' | 'past'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<Ticket['status'], { bg: string; text: string }> = {
  active:      { bg: 'rgba(16,185,129,0.15)', text: colors.mobile.success },
  used:        { bg: colors.mobile.surfaceRaised, text: colors.mobile.textMuted },
  transferred: { bg: colors.mobile.surfaceRaised, text: colors.mobile.textMuted },
  refunded:    { bg: 'rgba(239,68,68,0.15)', text: colors.mobile.error },
  ended:       { bg: colors.mobile.surfaceRaised, text: colors.mobile.textMuted },
}

function isUpcoming(t: Ticket): boolean {
  return new Date(t.date) >= new Date()
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

function SkeletonCard() {
  const opacity = useRef(new Animated.Value(0.4)).current
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 600, useNativeDriver: true }),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [opacity])
  return <Animated.View style={[styles.skeletonCard, { opacity }]} />
}

interface TicketCardProps {
  ticket: Ticket
  onPress: () => void
}

function TicketCard({ ticket, onPress }: TicketCardProps) {
  const badge = STATUS_COLORS[ticket.status]
  return (
    <AnimatedPressable onPress={onPress} hapticStyle="light" style={styles.card}>
      <View style={styles.cardTopRow}>
        <Text style={styles.cardEventName} numberOfLines={2}>
          {ticket.eventname}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
          <Text style={[styles.statusBadgeText, { color: badge.text }]}>
            {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
          </Text>
        </View>
      </View>
      <Text style={styles.cardMeta}>
        {formatDate(ticket.date)} · {ticket.type}
      </Text>
      <View style={styles.cardBottomRow}>
        <Text style={styles.cardAmount}>{formatNaira(ticket.amount)}</Text>
        <Text style={styles.cardCta}>View ticket →</Text>
      </View>
    </AnimatedPressable>
  )
}

// ─── MyTicketsScreen ──────────────────────────────────────────────────────────

export default function MyTicketsScreen() {
  const navigation = useNavigation<Nav>()
  const tabNavigation = useNavigation<TabNav>()
  const [activeTab, setActiveTab] = useState<TabType>('upcoming')

  const { data, isLoading, isFetching, isError, refetch } = useMyTickets()
  const tickets: Ticket[] = data ?? []

  const upcomingTickets = tickets.filter(isUpcoming)
  const pastTickets = tickets.filter((t) => !isUpcoming(t))
  const displayed = activeTab === 'upcoming' ? upcomingTickets : pastTickets

  // ── Render helpers ────────────────────────────────────────────────────────

  const renderItem = ({ item }: { item: Ticket }) => (
    <TicketCard
      ticket={item}
      onPress={() => navigation.navigate('TicketDetail', { ticketId: item._id })}
    />
  )

  const ListHeader = () => (
    <View>
      {/* Title */}
      <Text style={styles.screenTitle}>My Tickets</Text>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <AnimatedPressable
          hapticStyle="light"
          onPress={() => setActiveTab('upcoming')}
          style={styles.tab}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'upcoming' ? styles.tabTextActive : styles.tabTextInactive,
            ]}
          >
            Upcoming
            {upcomingTickets.length > 0 && (
              <Text style={styles.tabCount}> {upcomingTickets.length}</Text>
            )}
          </Text>
          {activeTab === 'upcoming' && <View style={styles.tabUnderline} />}
        </AnimatedPressable>

        <AnimatedPressable
          hapticStyle="light"
          onPress={() => setActiveTab('past')}
          style={styles.tab}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'past' ? styles.tabTextActive : styles.tabTextInactive,
            ]}
          >
            Past
            {pastTickets.length > 0 && (
              <Text style={styles.tabCount}> {pastTickets.length}</Text>
            )}
          </Text>
          {activeTab === 'past' && <View style={styles.tabUnderline} />}
        </AnimatedPressable>
      </View>
    </View>
  )

  const ListEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <TicketIcon size={28} color={colors.mobile.textMuted} strokeWidth={1.5} />
      </View>
      <Text style={styles.emptyHeading}>
        {activeTab === 'upcoming' ? 'No upcoming tickets' : 'No past tickets'}
      </Text>
      <Text style={styles.emptySubtext}>
        {activeTab === 'upcoming'
          ? 'Events you buy tickets for will appear here.'
          : 'Tickets for events you have attended will appear here.'}
      </Text>
      {activeTab === 'upcoming' && (
        <AnimatedPressable
          hapticStyle="medium"
          style={styles.exploreButton}
          onPress={() => tabNavigation.navigate('Discover')}
        >
          <Text style={styles.exploreButtonText}>Explore Events</Text>
        </AnimatedPressable>
      )}
    </View>
  )

  // ── Loading skeleton ───────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Text style={styles.screenTitle}>My Tickets</Text>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </SafeAreaView>
    )
  }

  // ── Error ─────────────────────────────────────────────────────────────────

  if (isError) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Text style={styles.screenTitle}>My Tickets</Text>
        <View style={styles.centeredState}>
          <Text style={styles.errorText}>Couldn't load tickets</Text>
          <AnimatedPressable hapticStyle="light" onPress={() => void refetch()}>
            <Text style={styles.retryText}>Tap to retry</Text>
          </AnimatedPressable>
        </View>
      </SafeAreaView>
    )
  }

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList<Ticket>
        data={displayed}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        ListHeaderComponent={<ListHeader />}
        ListEmptyComponent={<ListEmpty />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={() => void refetch()}
            tintColor={colors.brand.DEFAULT}
            colors={[colors.brand.DEFAULT]}
          />
        }
      />
    </SafeAreaView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.mobile.bg,
  },
  listContent: {
    paddingHorizontal: sp[4],
    paddingBottom: sp[12],
    flexGrow: 1,
  },

  // ── Screen title ─────────────────────────────────────────────────────────
  screenTitle: {
    fontSize: fs.xl,
    fontWeight: '800',
    color: colors.mobile.textPrimary,
    paddingHorizontal: sp[4],
    paddingTop: sp[4],
    paddingBottom: sp[2],
  },

  // ── Tabs ─────────────────────────────────────────────────────────────────
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 0,
    gap: sp[6],
    marginBottom: sp[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.mobile.border,
  },
  tab: {
    paddingBottom: sp[3],
    position: 'relative',
  },
  tabText: {
    fontSize: fs.sm,
    fontWeight: '700',
  },
  tabTextActive: {
    color: colors.brand.DEFAULT,
  },
  tabTextInactive: {
    color: colors.mobile.textMuted,
  },
  tabCount: {
    fontSize: fs.xs,
    fontWeight: '400',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.brand.DEFAULT,
    borderRadius: 1,
  },

  // ── Ticket card ───────────────────────────────────────────────────────────
  card: {
    backgroundColor: colors.mobile.surface,
    borderRadius: rd.xl,
    padding: sp[4],
    marginBottom: sp[3],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.mobile.border,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: sp[2],
    marginBottom: sp[2],
  },
  cardEventName: {
    flex: 1,
    fontSize: fs.base,
    fontWeight: '700',
    color: colors.mobile.textPrimary,
    lineHeight: 22,
  },
  statusBadge: {
    borderRadius: rd.full,
    paddingVertical: 3,
    paddingHorizontal: sp[3],
    alignSelf: 'flex-start',
    flexShrink: 0,
  },
  statusBadgeText: {
    fontSize: fs.xs,
    fontWeight: '600',
  },
  cardMeta: {
    fontSize: fs.sm,
    color: colors.mobile.textMuted,
    marginBottom: sp[3],
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardAmount: {
    fontSize: fs.base,
    fontWeight: '700',
    color: colors.mobile.textPrimary,
  },
  cardCta: {
    fontSize: fs.xs,
    color: colors.brand.DEFAULT,
    fontWeight: '600',
  },

  // ── Skeleton ─────────────────────────────────────────────────────────────
  skeletonCard: {
    height: 100,
    backgroundColor: colors.mobile.surfaceRaised,
    borderRadius: rd.xl,
    marginHorizontal: sp[4],
    marginBottom: sp[3],
  },

  // ── States ───────────────────────────────────────────────────────────────
  centeredState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: sp[12],
  },
  errorText: {
    fontSize: fs.base,
    fontWeight: '700',
    color: colors.mobile.textPrimary,
    marginBottom: sp[3],
  },
  retryText: {
    fontSize: fs.sm,
    color: colors.brand.DEFAULT,
    fontWeight: '600',
  },

  // ── Empty ─────────────────────────────────────────────────────────────────
  emptyContainer: {
    alignItems: 'center',
    paddingTop: sp[12],
    paddingHorizontal: sp[6],
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.mobile.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: sp[5],
  },
  emptyHeading: {
    fontSize: fs.lg,
    fontWeight: '700',
    color: colors.mobile.textPrimary,
    textAlign: 'center',
    marginBottom: sp[2],
  },
  emptySubtext: {
    fontSize: fs.sm,
    color: colors.mobile.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: sp[8],
  },
  exploreButton: {
    height: 52,
    backgroundColor: colors.brand.DEFAULT,
    borderRadius: rd.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: sp[8],
  },
  exploreButtonText: {
    fontSize: fs.base,
    fontWeight: '700',
    color: colors.mobile.textPrimary,
  },
})
