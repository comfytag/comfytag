import React, { useEffect, useRef } from 'react'
import {
  Animated,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import type { LucideIcon } from 'lucide-react-native'
import {
  ArrowLeftRight,
  Bell,
  Calendar,
  ShieldCheck,
  Star,
  Ticket,
  Wallet,
} from 'lucide-react-native'
import type { Notification, NotificationType } from '@comfytag/types'
import { colors, fs, rd, sp } from '@comfytag/ui/tokens'
import { AnimatedPressable } from '../../../components/ui/AnimatedPressable'
import { useQueryClient } from '@tanstack/react-query'
import { useNotifications, useMarkAsRead, useMarkAllAsRead, notificationKeys } from '../../../hooks'
import { getSocket, SOCKET_EVENTS } from '../../../lib/socket'
import type { AttendeeTabParamList } from '../../../navigation/types'

// ─── Navigation ──────────────────────────────────────────────────────────────

type TabNav = BottomTabNavigationProp<AttendeeTabParamList>

// ─── Type config ─────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<NotificationType, { icon: LucideIcon; bg: string }> = {
  ticket_confirmed:         { icon: Ticket,         bg: '#10B981' },
  ticket_sold:              { icon: Ticket,         bg: '#10B981' },
  transfer_received:        { icon: ArrowLeftRight, bg: '#7C3AED' },
  transfer_accepted:        { icon: ArrowLeftRight, bg: '#10B981' },
  transfer_declined:        { icon: ArrowLeftRight, bg: '#EF4444' },
  event_reminder:           { icon: Calendar,       bg: '#F59E0B' },
  new_event_from_following: { icon: Star,           bg: '#7C3AED' },
  payout_approved:          { icon: Wallet,         bg: '#10B981' },
  payout_rejected:          { icon: Wallet,         bg: '#EF4444' },
  payout_requested:         { icon: Wallet,         bg: '#F59E0B' },
  kyc_approved:             { icon: ShieldCheck,    bg: '#10B981' },
  kyc_rejected:             { icon: ShieldCheck,    bg: '#EF4444' },
  kyc_submitted:            { icon: ShieldCheck,    bg: '#F59E0B' },
  face_enrolled:            { icon: ShieldCheck,    bg: '#7C3AED' },
  organizer_registered:     { icon: Star,           bg: '#7C3AED' },
}

// ─── Relative time helper ─────────────────────────────────────────────────────

function relativeTime(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateString).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
  })
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────

function SkeletonRow(): React.ReactElement {
  const opacity = useRef(new Animated.Value(0.4)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [opacity])

  return <Animated.View style={[styles.skeletonRow, { opacity }]} />
}

// ─── Notification row ─────────────────────────────────────────────────────────

interface NotificationRowProps {
  notification: Notification
  onPress: (notification: Notification) => void
}

const NotificationRow = React.memo(function NotificationRow({
  notification,
  onPress,
}: NotificationRowProps): React.ReactElement {
  const config = TYPE_CONFIG[notification.type]
  const IconComponent = config.icon

  return (
    <AnimatedPressable
      hapticStyle="light"
      onPress={() => onPress(notification)}
      style={[
        styles.row,
        { backgroundColor: notification.read ? 'transparent' : colors.mobile.surface },
      ]}
    >
      {/* Left icon circle */}
      <View style={[styles.iconCircle, { backgroundColor: config.bg }]}>
        <IconComponent size={18} color="#FFFFFF" />
      </View>

      {/* Center content */}
      <View style={styles.rowContent}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {notification.title}
        </Text>
        <Text style={styles.rowMessage} numberOfLines={2}>
          {notification.message}
        </Text>
        <Text style={styles.rowTime}>{relativeTime(notification.createdAt)}</Text>
      </View>

      {/* Right unread dot */}
      {!notification.read && <View style={styles.unreadDot} />}
    </AnimatedPressable>
  )
})

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function InboxScreen(): React.ReactElement {
  const tabNavigation = useNavigation<TabNav>()
  const qc = useQueryClient()

  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useNotifications()

  const { mutate: markAsRead } = useMarkAsRead()
  const { mutate: markAllRead } = useMarkAllAsRead()

  const notifications = data?.notifications ?? []
  const unreadCount = data?.unreadCount ?? 0

  // ── Real-time: invalidate notification cache on new push ──────────────────

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return
    const onNew = (): void => {
      void qc.invalidateQueries({ queryKey: notificationKeys.list })
    }
    socket.on(SOCKET_EVENTS.NOTIFICATION_NEW, onNew)
    return () => {
      socket.off(SOCKET_EVENTS.NOTIFICATION_NEW, onNew)
    }
  }, [qc])

  // ── Handle notification tap ───────────────────────────────────────────────

  const handleNotificationPress = (notification: Notification): void => {
    if (!notification.read) {
      markAsRead({ notificationId: notification._id })
    }

    switch (notification.type) {
      case 'ticket_confirmed':
      case 'transfer_received':
      case 'transfer_accepted':
      case 'transfer_declined':
        tabNavigation.navigate('Tickets')
        break
      case 'event_reminder':
      case 'new_event_from_following':
        tabNavigation.navigate('Discover')
        break
      default:
        // Organizer-only notifications — gracefully ignore
        break
    }
  }

  // ── Header ───────────────────────────────────────────────────────────────

  const renderHeader = (): React.ReactElement => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Inbox</Text>
      {unreadCount > 0 && (
        <AnimatedPressable onPress={() => markAllRead()}>
          <Text style={styles.markAllText}>Mark all read</Text>
        </AnimatedPressable>
      )}
    </View>
  )

  // ── Loading skeleton ──────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {renderHeader()}
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </SafeAreaView>
    )
  }

  // ── Error ─────────────────────────────────────────────────────────────────

  if (isError && notifications.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {renderHeader()}
        <AnimatedPressable
          onPress={() => void refetch()}
          style={styles.centered}
        >
          <Text style={styles.errorText}>Couldn't load notifications</Text>
          <Text style={styles.retryText}>Tap to retry</Text>
        </AnimatedPressable>
      </SafeAreaView>
    )
  }

  // ── Empty state ───────────────────────────────────────────────────────────

  const renderEmptyState = (): React.ReactElement => (
    <View style={styles.centered}>
      <Bell size={40} color={colors.mobile.textMuted} />
      <Text style={styles.emptyTitle}>All clear</Text>
      <Text style={styles.emptySubtitle}>Your notifications will appear here.</Text>
    </View>
  )

  // ── List ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {renderHeader()}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <NotificationRow notification={item} onPress={handleNotificationPress} />
        )}
        ListEmptyComponent={renderEmptyState}
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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sp[4],
    paddingVertical: sp[3],
  },
  headerTitle: {
    fontSize: fs.xl,
    fontWeight: 'bold',
    color: colors.mobile.textPrimary,
  },
  markAllText: {
    fontSize: fs.sm,
    color: colors.brand.DEFAULT,
  },

  // Skeleton
  skeletonRow: {
    height: 72,
    marginHorizontal: sp[4],
    marginVertical: sp[3],
    borderRadius: rd.lg,
    backgroundColor: colors.mobile.surface,
  },

  // Notification row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sp[4],
    paddingVertical: sp[4],
    gap: sp[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.mobile.border,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: rd.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowContent: {
    flex: 1,
  },
  rowTitle: {
    fontSize: fs.sm,
    fontWeight: 'bold',
    color: colors.mobile.textPrimary,
  },
  rowMessage: {
    fontSize: fs.sm,
    color: colors.mobile.textSecondary,
    marginTop: 2,
  },
  rowTime: {
    fontSize: fs.xs,
    color: colors.mobile.textMuted,
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: rd.full,
    backgroundColor: colors.brand.DEFAULT,
  },

  // Centered layouts (error, empty)
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: sp[2],
    paddingHorizontal: sp[6],
  },
  errorText: {
    fontSize: fs.base,
    color: colors.mobile.textSecondary,
    textAlign: 'center',
  },
  retryText: {
    fontSize: fs.sm,
    color: colors.brand.DEFAULT,
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: fs.base,
    fontWeight: 'bold',
    color: colors.mobile.textPrimary,
    textAlign: 'center',
    marginTop: sp[3],
  },
  emptySubtitle: {
    fontSize: fs.sm,
    color: colors.mobile.textSecondary,
    textAlign: 'center',
  },
})
