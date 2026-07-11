import React, { useEffect, useMemo, useRef, useState } from 'react'
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
import type { StackScreenProps } from '@react-navigation/stack'
import { ChevronLeft } from 'lucide-react-native'
import { colors, sp, rd, fs } from '@comfytag/ui/tokens'
import { initials } from '@comfytag/utils'
import { AnimatedPressable } from '../../../components/ui/AnimatedPressable'
import { useEventAttendees } from '../../../hooks'
import type { OrganizerEventsStackParamList } from '../../../navigation/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = StackScreenProps<OrganizerEventsStackParamList, 'Audience'>

interface DisplayAttendee {
  _id: string
  userName: string
  ticketType: string
  checkedIn: boolean
}

// ─── Constants ────────────────────────────────────────────────────────────────

// ─── SkeletonRow ──────────────────────────────────────────────────────────────

function SkeletonRow() {
  const opacity = useRef(new Animated.Value(0.4)).current

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.9, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    )
    anim.start()
    return () => anim.stop()
  }, [opacity])

  return <Animated.View style={[styles.skeletonRow, { opacity }]} />
}

// ─── StatMini ─────────────────────────────────────────────────────────────────

interface StatMiniProps {
  label: string
  value: string | number
  valueColor?: string
}

function StatMini({ label, value, valueColor }: StatMiniProps) {
  return (
    <View style={styles.statMini}>
      <Text style={[styles.statMiniValue, valueColor ? { color: valueColor } : null]}>
        {value}
      </Text>
      <Text style={styles.statMiniLabel}>{label}</Text>
    </View>
  )
}

// ─── AttendeeRow ──────────────────────────────────────────────────────────────

interface AttendeeRowProps {
  attendee: DisplayAttendee
  isLast: boolean
}

function AttendeeRow({ attendee, isLast }: AttendeeRowProps) {
  const abbr = initials(attendee.userName)

  return (
    <View style={[styles.attendeeRow, !isLast && styles.attendeeRowBorder]}>
      {/* Avatar */}
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{abbr}</Text>
      </View>

      {/* Name + ticket type */}
      <View style={styles.attendeeInfo}>
        <Text style={styles.attendeeName} numberOfLines={1}>{attendee.userName}</Text>
        <Text style={styles.attendeeTicketType} numberOfLines={1}>{attendee.ticketType}</Text>
      </View>

      {/* Check-in badge */}
      <View
        style={[
          styles.checkInBadge,
          attendee.checkedIn ? styles.checkInBadgeIn : styles.checkInBadgeOut,
        ]}
      >
        <Text
          style={[
            styles.checkInBadgeText,
            attendee.checkedIn ? styles.checkInBadgeTextIn : styles.checkInBadgeTextOut,
          ]}
        >
          {attendee.checkedIn ? 'Checked In' : 'Not checked in'}
        </Text>
      </View>
    </View>
  )
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AudienceScreen({ navigation, route }: Props) {
  const { eventId, eventName } = route.params
  const [search, setSearch] = useState('')

  const {
    data: tickets = [],
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useEventAttendees(eventId)

  // Map Ticket[] to flat display shape the UI components expect
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
    if (!search.trim()) return attendees
    const term = search.trim().toLowerCase()
    return attendees.filter((a) => a.userName.toLowerCase().includes(term))
  }, [attendees, search])

  const totalCount = attendees.length
  const checkedInCount = attendees.filter((a) => a.checkedIn).length
  const notCheckedInCount = totalCount - checkedInCount

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
        <Text style={styles.headerTitle} numberOfLines={1}>{eventName} Attendees</Text>
        <View style={styles.headerSpacer} />
      </View>

      {isLoading ? (
        <View style={styles.skeletonContainer}>
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </View>
      ) : isError ? (
        <View style={styles.centered}>
          <Text style={styles.mutedText}>Failed to load attendees</Text>
          <AnimatedPressable hapticStyle="medium" onPress={() => void refetch()} style={styles.retryButton}>
            <Text style={styles.retryText}>Try Again</Text>
          </AnimatedPressable>
        </View>
      ) : (
        <>
          {/* Summary stats */}
          <View style={styles.statsRow}>
            <StatMini label="Total" value={totalCount} valueColor={colors.brand.DEFAULT} />
            <StatMini label="Checked In" value={checkedInCount} valueColor={colors.mobile.success} />
            <StatMini label="Not In" value={notCheckedInCount} valueColor={colors.mobile.textMuted} />
          </View>

          {/* Search bar */}
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Search attendees…"
              placeholderTextColor={colors.mobile.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
          </View>

          {/* Attendees list */}
          <FlatList
            data={filtered}
            keyExtractor={(item) => item._id}
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
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No attendees found</Text>
              </View>
            }
            renderItem={({ item, index }) => (
              <AttendeeRow
                attendee={item}
                isLast={index === filtered.length - 1}
              />
            )}
            ItemSeparatorComponent={null}
          />
        </>
      )}
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
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: sp[4],
    gap: sp[3],
    marginBottom: sp[3],
  },
  statMini: {
    flex: 1,
    backgroundColor: colors.mobile.surface,
    borderRadius: rd.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.mobile.border,
    paddingVertical: sp[3],
    paddingHorizontal: sp[2],
    alignItems: 'center',
    gap: sp[1],
  },
  statMiniValue: {
    fontSize: fs.xl,
    fontWeight: '700',
    color: colors.mobile.textPrimary,
  },
  statMiniLabel: {
    fontSize: fs.xs,
    color: colors.mobile.textMuted,
    textAlign: 'center',
  },
  searchRow: {
    paddingHorizontal: sp[4],
    marginBottom: sp[3],
  },
  searchInput: {
    height: 44,
    borderRadius: rd.lg,
    borderWidth: 1,
    borderColor: colors.mobile.border,
    paddingHorizontal: sp[4],
    color: colors.mobile.textPrimary,
    fontSize: fs.sm,
    backgroundColor: colors.mobile.surface,
  },
  listContent: {
    paddingHorizontal: sp[4],
    paddingBottom: sp[8],
  },
  attendeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: sp[3],
    gap: sp[3],
    minHeight: 60,
  },
  attendeeRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.mobile.border,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: rd.full,
    backgroundColor: colors.brand.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: fs.xs,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  attendeeInfo: {
    flex: 1,
    gap: 2,
  },
  attendeeName: {
    fontSize: fs.sm,
    fontWeight: '700',
    color: colors.mobile.textPrimary,
  },
  attendeeTicketType: {
    fontSize: fs.xs,
    color: colors.mobile.textMuted,
  },
  checkInBadge: {
    paddingHorizontal: sp[2],
    paddingVertical: sp[1],
    borderRadius: rd.full,
    flexShrink: 0,
  },
  checkInBadgeIn: {
    backgroundColor: '#052E16',
  },
  checkInBadgeOut: {
    backgroundColor: '#1C1917',
  },
  checkInBadgeText: {
    fontSize: fs.xs,
    fontWeight: '600',
  },
  checkInBadgeTextIn: {
    color: colors.mobile.success,
  },
  checkInBadgeTextOut: {
    color: colors.mobile.textMuted,
  },
  skeletonContainer: {
    paddingHorizontal: sp[4],
    paddingTop: sp[4],
    gap: sp[3],
  },
  skeletonRow: {
    height: 60,
    borderRadius: rd.lg,
    backgroundColor: colors.mobile.surface,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: sp[8],
  },
  emptyText: {
    fontSize: fs.base,
    color: colors.mobile.textMuted,
  },
  centered: {
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
