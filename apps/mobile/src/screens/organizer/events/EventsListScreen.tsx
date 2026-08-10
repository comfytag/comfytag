import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react'
import {
  Animated,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { StackScreenProps } from '@react-navigation/stack'
import { CalendarX, Plus } from 'lucide-react-native'
import type { Event } from '@comfytag/types'
import { colors, sp, rd, fs } from '@comfytag/ui/tokens'
import { formatDate } from '@comfytag/utils'
import { AnimatedPressable } from '../../../components/ui/AnimatedPressable'
import { useMyEvents } from '../../../hooks'
import type { OrganizerEventsStackParamList } from '../../../navigation/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = StackScreenProps<OrganizerEventsStackParamList, 'EventsList'>

type FilterOption = 'All' | 'Published' | 'Draft' | 'Completed' | 'Cancelled'

// ─── Constants ────────────────────────────────────────────────────────────────

const FILTER_OPTIONS: FilterOption[] = ['All', 'Published', 'Draft', 'Completed', 'Cancelled']

const STATUS_BADGE: Record<string, { bg: string; text: string }> = {
  draft:     { bg: '#F5F5F4', text: '#78716C' },
  published: { bg: '#D1FAE5', text: '#065F46' },
  cancelled: { bg: '#FEE2E2', text: '#991B1B' },
  completed: { bg: '#F5F5F4', text: '#78716C' },
}

const STATUS_STRIP: Record<string, string> = {
  draft: '#A8A29E',
  published: '#10B981',
  cancelled: '#EF4444',
  completed: '#78716C',
}

// ─── SkeletonCard ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  const opacity = useRef(new Animated.Value(0.4)).current

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    )
    pulse.start()
    return () => pulse.stop()
  }, [opacity])

  return (
    <Animated.View style={[styles.skeletonCard, { opacity }]} />
  )
}

// ─── EventCard ────────────────────────────────────────────────────────────────

interface EventCardProps {
  event: Event
  onPress: () => void
}

function EventCard({ event, onPress }: EventCardProps) {
  const badge = STATUS_BADGE[event.status] ?? STATUS_BADGE.draft
  const stripColor = STATUS_STRIP[event.status] ?? STATUS_STRIP.draft

  return (
    <AnimatedPressable hapticStyle="light" onPress={onPress}>
      <View style={styles.card}>
        <View style={[styles.statusStrip, { backgroundColor: stripColor }]} />
        <View style={styles.cardContent}>
          <Text style={styles.eventName} numberOfLines={2}>{event.name}</Text>
          <Text style={styles.eventMeta}>
            {formatDate(event.date)}  •  {event.venue}
          </Text>
          <View style={styles.cardFooter}>
            <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
              <Text style={[styles.statusBadgeText, { color: badge.text }]}>
                {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
              </Text>
            </View>
            <Text style={styles.ticketsSold}>
              {event.sold} tickets sold
            </Text>
          </View>
        </View>
      </View>
    </AnimatedPressable>
  )
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function EventsListScreen({ navigation }: Props) {
  const [activeFilter, setActiveFilter] = useState<FilterOption>('All')

  const {
    data: events = [],
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useMyEvents()

  const filteredEvents = useMemo(() => {
    if (activeFilter === 'All') return events
    return events.filter((e) => e.status === activeFilter.toLowerCase())
  }, [events, activeFilter])

  const handleAddPress = () => {
    navigation.navigate('CreateEvent')
  }

  const renderItem = useCallback(({ item }: { item: Event }) => (
    <EventCard
      event={item}
      onPress={() =>
        navigation.navigate('OrganizerEventDetail', {
          eventId: item._id,
          eventName: item.name,
        })
      }
    />
  ), [navigation])

  const renderSeparator = () => <View style={styles.separator} />

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Events</Text>
        <AnimatedPressable
          hapticStyle="medium"
          onPress={handleAddPress}
          style={styles.addButton}
        >
          <Plus size={22} color={colors.brand.DEFAULT} strokeWidth={2.5} />
        </AnimatedPressable>
      </View>

      {/* Filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {FILTER_OPTIONS.map((filter) => {
          const isActive = filter === activeFilter
          return (
            <AnimatedPressable
              key={filter}
              hapticStyle="light"
              onPress={() => setActiveFilter(filter)}
              style={[
                styles.filterPill,
                isActive ? styles.filterPillActive : styles.filterPillInactive,
              ]}
            >
              <Text
                style={[
                  styles.filterPillText,
                  isActive ? styles.filterPillTextActive : styles.filterPillTextInactive,
                ]}
              >
                {filter}
              </Text>
            </AnimatedPressable>
          )
        })}
      </ScrollView>

      {/* Content */}
      {isLoading ? (
        <View style={styles.skeletonContainer}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : isError ? (
        <View style={styles.emptyContainer}>
          <CalendarX size={48} color={colors.textPublic.muted} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>Failed to load events</Text>
          <Text style={styles.emptySubtitle}>Pull down to try again</Text>
        </View>
      ) : (
        <FlatList
          data={filteredEvents}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          ItemSeparatorComponent={renderSeparator}
          contentContainerStyle={
            filteredEvents.length === 0
              ? styles.listContentEmpty
              : styles.listContent
          }
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isLoading}
              onRefresh={() => void refetch()}
              tintColor={colors.brand.DEFAULT}
              colors={[colors.brand.DEFAULT]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <CalendarX size={48} color={colors.textPublic.muted} strokeWidth={1.5} />
              <Text style={styles.emptyTitle}>No events found</Text>
              <Text style={styles.emptySubtitle}>
                {activeFilter === 'All'
                  ? 'Create your first event to get started'
                  : `No ${activeFilter.toLowerCase()} events`}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.public.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sp[4],
    paddingTop: sp[4],
    paddingBottom: sp[3],
  },
  headerTitle: {
    fontSize: fs.xl,
    fontWeight: '700',
    color: colors.textPublic.primary,
  },
  addButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterRow: {
    paddingHorizontal: sp[4],
    paddingBottom: sp[3],
    gap: sp[2],
  },
  filterPill: {
    paddingHorizontal: sp[3],
    paddingVertical: sp[2],
    borderRadius: rd.full,
  },
  filterPillActive: {
    backgroundColor: colors.brand.DEFAULT,
  },
  filterPillInactive: {
    backgroundColor: colors.public.surface,
  },
  filterPillText: {
    fontSize: fs.sm,
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  filterPillTextInactive: {
    color: colors.textPublic.muted,
  },
  listContent: {
    paddingHorizontal: sp[4],
    paddingBottom: sp[6],
  },
  listContentEmpty: {
    flex: 1,
    paddingHorizontal: sp[4],
  },
  separator: {
    height: sp[3],
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.public.surface,
    borderRadius: rd.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.public.border,
    overflow: 'hidden',
  },
  statusStrip: {
    width: 4,
    borderTopLeftRadius: rd.lg,
    borderBottomLeftRadius: rd.lg,
  },
  cardContent: {
    flex: 1,
    padding: sp[4],
    gap: sp[2],
  },
  eventName: {
    fontSize: fs.base,
    fontWeight: '700',
    color: colors.textPublic.primary,
    textTransform: 'capitalize',
  },
  eventMeta: {
    fontSize: fs.xs,
    color: colors.textPublic.muted,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: sp[1],
  },
  statusBadge: {
    paddingHorizontal: sp[2],
    paddingVertical: 3,
    borderRadius: rd.full,
  },
  statusBadgeText: {
    fontSize: fs.xs,
    fontWeight: '600',
  },
  ticketsSold: {
    fontSize: fs.xs,
    color: colors.textPublic.secondary,
  },
  skeletonContainer: {
    padding: sp[4],
    gap: sp[3],
  },
  skeletonCard: {
    height: 80,
    width: '100%',
    backgroundColor: colors.public.surface,
    borderRadius: rd.xl,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: sp[3],
    paddingVertical: sp[8],
  },
  emptyTitle: {
    fontSize: fs.base,
    fontWeight: '600',
    color: colors.textPublic.secondary,
  },
  emptySubtitle: {
    fontSize: fs.sm,
    color: colors.textPublic.muted,
    textAlign: 'center',
    paddingHorizontal: sp[6],
  },
})
