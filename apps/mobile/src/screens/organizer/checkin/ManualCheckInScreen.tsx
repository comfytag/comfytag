import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Animated,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQueryClient } from '@tanstack/react-query'
import type { StackScreenProps } from '@react-navigation/stack'
import { ChevronLeft } from 'lucide-react-native'
import type { Ticket } from '@comfytag/types'
import { colors, sp, rd, fs } from '@comfytag/ui/tokens'
import { initials } from '@comfytag/utils'
import { AnimatedPressable } from '../../../components/ui/AnimatedPressable'
import { useEventAttendees, useManualCheckin, attendeeKeys } from '../../../hooks'
import type { OrganizerCheckInStackParamList } from '../../../navigation/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = StackScreenProps<OrganizerCheckInStackParamList, 'ManualCheckIn'>

interface DisplayAttendee {
  _id: string
  userName: string
  ticketType: string
  checkedIn: boolean
}

// ─── SkeletonRow ──────────────────────────────────────────────────────────────

function SkeletonRow() {
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
    <Animated.View style={[styles.skeletonRow, { opacity }]} />
  )
}

// ─── AttendeeRow ──────────────────────────────────────────────────────────────

interface AttendeeRowProps {
  attendee: DisplayAttendee
  onToggle: (id: string, current: boolean) => void
}

function AttendeeRow({ attendee, onToggle }: AttendeeRowProps) {
  const abbr = initials(attendee.userName)

  return (
    <View style={styles.row}>
      {/* Avatar */}
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{abbr}</Text>
      </View>

      {/* Info */}
      <View style={styles.rowInfo}>
        <Text style={styles.rowName} numberOfLines={1}>
          {attendee.userName}
        </Text>
        <Text style={styles.rowTicketType} numberOfLines={1}>
          {attendee.ticketType}
        </Text>
      </View>

      {/* Toggle */}
      <AnimatedPressable
        style={
          attendee.checkedIn
            ? styles.checkedInPill
            : styles.checkInPill
        }
        onPress={() => onToggle(attendee._id, attendee.checkedIn)}
        hapticStyle="medium"
      >
        <Text
          style={
            attendee.checkedIn
              ? styles.checkedInPillText
              : styles.checkInPillText
          }
        >
          {attendee.checkedIn ? 'Checked In ✓' : 'Check In'}
        </Text>
      </AnimatedPressable>
    </View>
  )
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ManualCheckInScreen({ navigation, route }: Props) {
  const { eventId, eventName } = route.params
  const qc = useQueryClient()
  const [query, setQuery] = useState('')

  const {
    data: tickets = [],
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useEventAttendees(eventId)

  const { mutate: checkin } = useManualCheckin()

  // Map Ticket[] to flat display shape the UI needs
  const attendees: DisplayAttendee[] = useMemo(
    () =>
      tickets.map((t) => ({
        _id: t._id,
        userName: t.name,
        ticketType: t.type,
        checkedIn: t.status === 'used',
      })),
    [tickets]
  )

  const filtered = useMemo(() => {
    if (!query.trim()) return attendees
    const lower = query.toLowerCase()
    return attendees.filter((a) => a.userName.toLowerCase().includes(lower))
  }, [attendees, query])

  const checkedInCount = useMemo(
    () => attendees.filter((a) => a.checkedIn).length,
    [attendees]
  )

  // Optimistic toggle — updates cache immediately; reverts on error via invalidation
  const handleToggle = useCallback(
    (attendeeId: string, currentCheckedIn: boolean): void => {
      qc.setQueryData<Ticket[]>(attendeeKeys.list(eventId), (prev = []) =>
        prev.map((t) =>
          t._id === attendeeId
            ? { ...t, status: (currentCheckedIn ? 'active' : 'used') as Ticket['status'] }
            : t
        )
      )

      checkin(
        { ticketId: attendeeId, eventId },
        {
          onError: () => {
            void qc.invalidateQueries({ queryKey: attendeeKeys.list(eventId) })
          },
        }
      )
    },
    [checkin, qc, eventId]
  )

  const renderItem = useCallback(
    ({ item }: { item: DisplayAttendee }) => (
      <AttendeeRow attendee={item} onToggle={handleToggle} />
    ),
    [handleToggle]
  )

  const renderSeparator = useCallback(
    () => <View style={styles.separator} />,
    []
  )

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <AnimatedPressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hapticStyle="light"
        >
          <ChevronLeft size={24} color={colors.textPublic.primary} strokeWidth={2} />
        </AnimatedPressable>

        <Text style={styles.headerTitle} numberOfLines={1}>
          {eventName}
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search attendees…"
          placeholderTextColor={colors.textPublic.muted}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      {/* Stats bar */}
      {!isLoading && !isError && (
        <View style={styles.statsBar}>
          <Text style={styles.statsText}>
            {checkedInCount} checked in of {attendees.length} total
          </Text>
        </View>
      )}

      {/* Content */}
      {isLoading ? (
        <View style={styles.skeletonList}>
          <SkeletonRow />
          <View style={styles.separator} />
          <SkeletonRow />
          <View style={styles.separator} />
          <SkeletonRow />
        </View>
      ) : isError ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Failed to load attendees.</Text>
          <Text style={styles.emptySubText}>Check your connection and go back.</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          ItemSeparatorComponent={renderSeparator}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No attendees found</Text>
            </View>
          }
          contentContainerStyle={
            filtered.length === 0
              ? styles.flatListEmpty
              : styles.flatListContent
          }
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
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

const CHECKED_IN_BG = 'rgba(16,185,129,0.20)'

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.public.bg,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sp[4],
    paddingTop: sp[2],
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
    fontSize: fs.base,
    fontWeight: '600',
    color: colors.textPublic.primary,
    textAlign: 'center',
    marginHorizontal: sp[2],
    textTransform: 'capitalize',
  },
  headerSpacer: {
    width: 44,
    height: 44,
  },

  // Search
  searchContainer: {
    paddingHorizontal: sp[5],
    paddingBottom: sp[3],
  },
  searchInput: {
    backgroundColor: colors.public.surface,
    borderWidth: 1,
    borderColor: colors.public.border,
    borderRadius: rd.lg,
    minHeight: 48,
    paddingHorizontal: sp[4],
    fontSize: fs.sm,
    color: colors.textPublic.primary,
  },

  // Stats
  statsBar: {
    paddingHorizontal: sp[5],
    paddingBottom: sp[2],
    alignItems: 'flex-end',
  },
  statsText: {
    fontSize: fs.xs,
    color: colors.textPublic.muted,
  },

  // List
  flatListContent: {
    paddingHorizontal: sp[5],
    paddingBottom: sp[8],
  },
  flatListEmpty: {
    flex: 1,
    paddingHorizontal: sp[5],
  },
  separator: {
    height: sp[2],
  },

  // Skeleton
  skeletonList: {
    paddingHorizontal: sp[5],
    paddingTop: sp[2],
  },
  skeletonRow: {
    height: 60,
    backgroundColor: colors.public.surface,
    borderRadius: rd.lg,
  },

  // Attendee row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.public.surface,
    borderRadius: rd.lg,
    borderWidth: 1,
    borderColor: colors.public.border,
    paddingHorizontal: sp[4],
    paddingVertical: sp[3],
    minHeight: 60,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.brand.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: fs.sm,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  rowInfo: {
    flex: 1,
    marginLeft: sp[3],
    marginRight: sp[3],
  },
  rowName: {
    fontSize: fs.sm,
    fontWeight: '600',
    color: colors.textPublic.primary,
  },
  rowTicketType: {
    fontSize: fs.xs,
    color: colors.textPublic.muted,
    marginTop: 2,
  },

  // Check-in pills
  checkInPill: {
    borderWidth: 1,
    borderColor: colors.brand.DEFAULT,
    borderRadius: rd.full,
    paddingHorizontal: sp[3],
    paddingVertical: sp[1],
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkInPillText: {
    fontSize: fs.xs,
    fontWeight: '600',
    color: colors.brand.DEFAULT,
  },
  checkedInPill: {
    backgroundColor: CHECKED_IN_BG,
    borderWidth: 1,
    borderColor: colors.success.DEFAULT,
    borderRadius: rd.full,
    paddingHorizontal: sp[3],
    paddingVertical: sp[1],
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedInPillText: {
    fontSize: fs.xs,
    fontWeight: '600',
    color: colors.success.DEFAULT,
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: sp[12],
  },
  emptyText: {
    fontSize: fs.base,
    fontWeight: '600',
    color: colors.textPublic.secondary,
  },
  emptySubText: {
    fontSize: fs.sm,
    color: colors.textPublic.muted,
    marginTop: sp[2],
    textAlign: 'center',
  },
})
