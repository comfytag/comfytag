import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import type { StackScreenProps } from '@react-navigation/stack'
import { ChevronLeft, Check } from 'lucide-react-native'
import { colors, sp, rd, fs } from '@comfytag/ui/tokens'
import { get } from '../../../lib/api'
import { EventCard, EventCardSkeleton } from '../../../components/ui/EventCard'
import { AnimatedPressable } from '../../../components/ui/AnimatedPressable'
import { useFollowOrganizer } from '../../../hooks'
import type { Event, ApiResponse } from '@comfytag/types'
import type { DiscoverStackParamList } from '../../../navigation/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = StackScreenProps<DiscoverStackParamList, 'OrganizerProfile'>

type TabType = 'upcoming' | 'past'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function isUpcoming(event: Event): boolean {
  return new Date(event.date) >= new Date()
}

// ─── OrganizerProfileScreen ───────────────────────────────────────────────────

const SCREEN_WIDTH = Dimensions.get('window').width

export default function OrganizerProfileScreen({ route, navigation }: Props) {
  const { organizerId, organizerName } = route.params
  const [activeTab, setActiveTab] = useState<TabType>('upcoming')
  const [isFollowing, setIsFollowing] = useState(false)

  const {
    data: events = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['organizer-events', organizerId],
    queryFn: () =>
      get<ApiResponse<Event[]>>(`/events/user/${organizerId}`).then(
        (r) => r.data.data ?? []
      ),
    staleTime: 120_000,
    enabled: !!organizerId,
  })

  const { mutate: followOrganizer, isPending: isFollowPending } =
    useFollowOrganizer()

  // GET /organizers/:id/follow/status — real initial state instead of always
  // starting the button on "Follow" regardless of whether the user actually
  // already follows this organizer.
  const { data: followStatus } = useQuery({
    queryKey: ['organizer-follow-status', organizerId],
    queryFn: () =>
      get<{ following: boolean; followerCount: number }>(
        `/organizers/${organizerId}/follow/status`
      ).then((r) => r.data),
    staleTime: 60_000,
    enabled: !!organizerId,
  })

  useEffect(() => {
    if (followStatus !== undefined) setIsFollowing(followStatus.following)
  }, [followStatus])

  // ── Derived ──────────────────────────────────────────────────────────────────

  const upcomingEvents = events.filter(isUpcoming)
  const pastEvents = events.filter((e) => !isUpcoming(e))
  const filteredEvents = activeTab === 'upcoming' ? upcomingEvents : pastEvents
  const totalTicketsSold = events.reduce((sum, e) => sum + (e.sold ?? 0), 0)
  const cardWidth = (SCREEN_WIDTH - sp[4] * 2 - sp[3]) / 2

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleFollowToggle = () => {
    const previous = isFollowing
    setIsFollowing(!previous)
    followOrganizer(
      { organizerId, slug: organizerId },
      { onError: () => setIsFollowing(previous) }
    )
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Floating back button */}
      <View style={styles.floatingBack}>
        <AnimatedPressable
          onPress={() => navigation.goBack()}
          hapticStyle="light"
          style={styles.backBtn}
        >
          <ChevronLeft size={20} color="#FFFFFF" />
        </AnimatedPressable>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.headerOverlay} />
          <View style={styles.headerContent}>
            <View style={styles.headerAvatar}>
              <Text style={styles.headerAvatarText}>{initials(organizerName)}</Text>
            </View>
            <Text style={styles.headerName}>{organizerName}</Text>
            <Text style={styles.headerRole}>Event Organiser</Text>
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{events.length}</Text>
            <Text style={styles.statLabel}>Events</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalTicketsSold}</Text>
            <Text style={styles.statLabel}>Tickets Sold</Text>
          </View>
        </View>

        {/* Follow button */}
        <View style={styles.followRow}>
          <AnimatedPressable
            hapticStyle="medium"
            style={[styles.followBtn, isFollowing && styles.followBtnActive]}
            onPress={handleFollowToggle}
            disabled={isFollowPending}
          >
            {isFollowPending ? (
              <ActivityIndicator size="small" color={isFollowing ? '#FFFFFF' : colors.textPublic.primary} />
            ) : isFollowing ? (
              <View style={styles.followingInner}>
                <Check size={14} color="#FFFFFF" />
                <Text style={[styles.followBtnText, { color: '#FFFFFF' }]}>Following</Text>
              </View>
            ) : (
              <Text style={[styles.followBtnText, { color: colors.textPublic.primary }]}>Follow</Text>
            )}
          </AnimatedPressable>
        </View>

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
            </Text>
            {activeTab === 'past' && <View style={styles.tabUnderline} />}
          </AnimatedPressable>
        </View>

        {/* Loading */}
        {isLoading && (
          <View style={styles.grid}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={{ width: cardWidth }}>
                <EventCardSkeleton variant="grid" />
              </View>
            ))}
          </View>
        )}

        {/* Error */}
        {isError && (
          <View style={styles.centeredState}>
            <Text style={styles.stateTitle}>Couldn't load events</Text>
            <AnimatedPressable onPress={() => void refetch()} hapticStyle="light">
              <Text style={styles.retryText}>Tap to retry</Text>
            </AnimatedPressable>
          </View>
        )}

        {/* Empty */}
        {!isLoading && !isError && filteredEvents.length === 0 && (
          <View style={styles.centeredState}>
            <Text style={styles.stateTitle}>No {activeTab} events</Text>
          </View>
        )}

        {/* Event grid */}
        {!isLoading && !isError && filteredEvents.length > 0 && (
          <View style={styles.grid}>
            {filteredEvents.map((event) => (
              <View key={event._id} style={{ width: cardWidth }}>
                <EventCard
                  event={event}
                  variant="grid"
                  onPress={() =>
                    navigation.navigate('EventDetail', { slug: event.slug })
                  }
                />
              </View>
            ))}
          </View>
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
    backgroundColor: colors.public.bg,
  },

  // ── Floating Back ─────────────────────────────────────────────────────────
  floatingBack: {
    position: 'absolute',
    top: sp[2],
    left: sp[4],
    zIndex: 10,
  },
  backBtn: {
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(13,13,13,0.6)',
    borderRadius: rd.full,
  },

  // ── Scroll ────────────────────────────────────────────────────────────────
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: sp[8],
  },

  // ── Profile Header ────────────────────────────────────────────────────────
  profileHeader: {
    height: 200,
    overflow: 'hidden',
    backgroundColor: colors.brand.DEFAULT,
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  headerContent: {
    position: 'absolute',
    bottom: sp[4],
    left: sp[4],
    right: sp[4],
  },
  headerAvatar: {
    width: 64,
    height: 64,
    borderRadius: rd.full,
    backgroundColor: colors.public.surface,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: {
    fontSize: fs.xl,
    fontWeight: '700',
    color: colors.brand.DEFAULT,
  },
  headerName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: sp[3],
  },
  headerRole: {
    fontSize: fs.sm,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },

  // ── Stats Row ─────────────────────────────────────────────────────────────
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: sp[4],
    paddingVertical: sp[4],
    gap: sp[6],
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: fs.xl,
    fontWeight: '700',
    color: colors.textPublic.primary,
  },
  statLabel: {
    fontSize: fs.xs,
    color: colors.textPublic.secondary,
    marginTop: 2,
  },

  // ── Follow Button ─────────────────────────────────────────────────────────
  followRow: {
    paddingHorizontal: sp[4],
    marginBottom: sp[4],
  },
  followBtn: {
    width: '100%',
    height: 44,
    borderRadius: rd.full,
    borderWidth: 1,
    borderColor: colors.public.border,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  followBtnActive: {
    backgroundColor: colors.brand.DEFAULT,
    borderColor: colors.brand.DEFAULT,
  },
  followingInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp[2],
  },
  followBtnText: {
    fontSize: fs.sm,
    fontWeight: '700',
  },

  // ── Tabs ──────────────────────────────────────────────────────────────────
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: sp[4],
    marginBottom: sp[4],
    gap: sp[6],
  },
  tab: {
    paddingBottom: sp[2],
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
    color: colors.textPublic.muted,
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

  // ── Grid ──────────────────────────────────────────────────────────────────
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: sp[4],
    gap: sp[3],
  },

  // ── States ────────────────────────────────────────────────────────────────
  centeredState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: sp[8],
    paddingTop: sp[12],
  },
  stateTitle: {
    fontSize: fs.base,
    fontWeight: '700',
    color: colors.textPublic.primary,
    textAlign: 'center',
    marginBottom: sp[3],
  },
  retryText: {
    fontSize: fs.sm,
    color: colors.brand.DEFAULT,
    fontWeight: '600',
  },

  // ── Bottom Spacer ─────────────────────────────────────────────────────────
  bottomSpacer: {
    height: sp[8],
  },
})
