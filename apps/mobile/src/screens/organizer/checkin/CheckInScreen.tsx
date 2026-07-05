import React, { useCallback, useEffect, useRef } from 'react'
import {
  Animated,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { StackScreenProps } from '@react-navigation/stack'
import { CalendarX } from 'lucide-react-native'
import type { Event } from '@comfytag/types'
import { colors, sp, rd, fs } from '@comfytag/ui/tokens'
import { formatDate } from '@comfytag/utils'
import { AnimatedPressable } from '../../../components/ui/AnimatedPressable'
import { useMyEvents } from '../../../hooks'
import type { OrganizerCheckInStackParamList } from '../../../navigation/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = StackScreenProps<OrganizerCheckInStackParamList, 'CheckInHome'>

// ─── SkeletonCard ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  const opacity = useRef(new Animated.Value(0.4)).current

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    )
    pulse.start()
    return () => pulse.stop()
  }, [opacity])

  return (
    <Animated.View
      style={[styles.skeletonCard, { opacity }]}
    />
  )
}

// ─── EventCard ────────────────────────────────────────────────────────────────

interface EventCardProps {
  event: Event
  onPress: () => void
}

function EventCard({ event, onPress }: EventCardProps) {
  const dateStr = formatDate(event.date)
  const venue = event.venue ?? ''

  return (
    <AnimatedPressable style={styles.eventCard} onPress={onPress} hapticStyle="light">
      <View style={styles.eventCardStrip} />
      <View style={styles.eventCardBody}>
        <Text style={styles.eventName} numberOfLines={2}>
          {event.name}
        </Text>
        <Text style={styles.eventMeta} numberOfLines={1}>
          {dateStr}
          {venue ? `  ·  ${venue}` : ''}
        </Text>
      </View>
      <Text style={styles.eventCta}>Start Check-in →</Text>
    </AnimatedPressable>
  )
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <CalendarX size={48} color={colors.mobile.textMuted} strokeWidth={1.5} />
      <Text style={styles.emptyTitle}>No live events</Text>
      <Text style={styles.emptySubtitle}>
        Published events will appear here for check-in.
      </Text>
    </View>
  )
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function CheckInScreen({ navigation }: Props) {
  const {
    data: allEvents = [],
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useMyEvents()

  const events = allEvents.filter((e) => e.status === 'published')

  const handleEventPress = useCallback(
    (event: Event) => {
      navigation.navigate('FaceCheckIn', {
        eventId: event._id,
        eventName: event.name,
      })
    },
    [navigation]
  )

  const renderItem = useCallback(
    ({ item }: { item: Event }) => (
      <EventCard
        event={item}
        onPress={() => handleEventPress(item)}
      />
    ),
    [handleEventPress]
  )

  const renderSeparator = useCallback(
    () => <View style={styles.separator} />,
    []
  )

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Check-in</Text>
        <Text style={styles.headerSubtitle}>
          Select an event to begin scanning
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.skeletonList}>
          <SkeletonCard />
          <View style={styles.separator} />
          <SkeletonCard />
          <View style={styles.separator} />
          <SkeletonCard />
        </View>
      ) : isError ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Something went wrong</Text>
          <Text style={styles.emptySubtitle}>Pull down to try again.</Text>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          ItemSeparatorComponent={renderSeparator}
          ListEmptyComponent={<EmptyState />}
          contentContainerStyle={
            events.length === 0
              ? styles.flatListEmpty
              : styles.flatListContent
          }
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
      )}
    </SafeAreaView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.mobile.bg,
  },
  header: {
    paddingHorizontal: sp[5],
    paddingTop: sp[4],
    paddingBottom: sp[3],
  },
  headerTitle: {
    fontSize: fs.xl,
    fontWeight: '700',
    color: colors.mobile.textPrimary,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: fs.sm,
    color: colors.mobile.textMuted,
    marginTop: sp[1],
  },
  flatListContent: {
    paddingHorizontal: sp[5],
    paddingBottom: sp[6],
  },
  flatListEmpty: {
    flex: 1,
    paddingHorizontal: sp[5],
  },
  skeletonList: {
    paddingHorizontal: sp[5],
    paddingTop: sp[2],
  },
  skeletonCard: {
    height: 72,
    backgroundColor: colors.mobile.surface,
    borderRadius: rd.lg,
  },
  separator: {
    height: sp[3],
  },
  // EventCard
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.mobile.surface,
    borderRadius: rd.lg,
    borderWidth: 1,
    borderColor: colors.mobile.border,
    overflow: 'hidden',
    minHeight: 72,
  },
  eventCardStrip: {
    width: 4,
    alignSelf: 'stretch',
    backgroundColor: colors.mobile.success,
  },
  eventCardBody: {
    flex: 1,
    paddingVertical: sp[3],
    paddingHorizontal: sp[4],
  },
  eventName: {
    fontSize: fs.sm,
    fontWeight: '600',
    color: colors.mobile.textPrimary,
    lineHeight: 20,
  },
  eventMeta: {
    fontSize: fs.xs,
    color: colors.mobile.textMuted,
    marginTop: sp[1],
  },
  eventCta: {
    fontSize: fs.xs,
    fontWeight: '600',
    color: colors.brand.DEFAULT,
    paddingRight: sp[4],
  },
  // EmptyState
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: sp[8],
    paddingBottom: sp[12],
  },
  emptyTitle: {
    fontSize: fs.base,
    fontWeight: '600',
    color: colors.mobile.textSecondary,
    marginTop: sp[4],
  },
  emptySubtitle: {
    fontSize: fs.sm,
    color: colors.mobile.textMuted,
    textAlign: 'center',
    marginTop: sp[2],
    lineHeight: 20,
  },
})
