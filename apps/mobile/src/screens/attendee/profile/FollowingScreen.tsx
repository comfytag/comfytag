import React, { useEffect, useRef, useState } from 'react'
import {
  Animated,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { StackScreenProps } from '@react-navigation/stack'
import { useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, UserX } from 'lucide-react-native'
import { initials } from '@comfytag/utils'
import { colors, fs, rd, sp } from '@comfytag/ui/tokens'
import { AnimatedPressable } from '../../../components/ui/AnimatedPressable'
import { del } from '../../../lib/api'
import { useAuthStore } from '../../../store'
import { useFollowing, profileKeys } from '../../../hooks'
import type { User } from '@comfytag/types'
import type { ProfileStackParamList } from '../../../navigation/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = StackScreenProps<ProfileStackParamList, 'Following'>

// ─── Skeleton row ─────────────────────────────────────────────────────────────

function SkeletonRow(): React.ReactElement {
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

  return (
    <Animated.View style={[styles.skeletonRow, { opacity }]}>
      <View style={styles.skeletonAvatar} />
      <View style={styles.skeletonLines}>
        <View style={styles.skeletonLineTop} />
        <View style={styles.skeletonLineBottom} />
      </View>
    </Animated.View>
  )
}

// ─── Organizer row ────────────────────────────────────────────────────────────

interface OrganizerRowProps {
  organizer: User
  onUnfollow: (organizerId: string) => void
}

function OrganizerRow({ organizer, onUnfollow }: OrganizerRowProps): React.ReactElement {
  const userInitials = initials(organizer.name)

  return (
    <View style={styles.row}>
      {/* Avatar */}
      <View style={styles.avatarCircle}>
        <Text style={styles.avatarInitials}>{userInitials}</Text>
      </View>

      {/* Name + email */}
      <View style={styles.rowContent}>
        <Text style={styles.organizerName} numberOfLines={1}>
          {organizer.name}
        </Text>
        <Text style={styles.organizerEmail} numberOfLines={1}>
          {organizer.email}
        </Text>
      </View>

      {/* Unfollow button */}
      <AnimatedPressable
        style={styles.unfollowButton}
        onPress={() => onUnfollow(organizer._id)}
        hapticStyle="light"
      >
        <Text style={styles.unfollowText}>Unfollow</Text>
      </AnimatedPressable>
    </View>
  )
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function FollowingScreen({ navigation }: Props): React.ReactElement {
  const userId = useAuthStore((state) => state.user?._id)
  const qc = useQueryClient()
  const [unfollowError, setUnfollowError] = useState(false)

  const { data: followingList, isLoading, isError, refetch } = useFollowing()
  const organizers: User[] = followingList ?? []

  // ─── Unfollow (optimistic) ─────────────────────────────────────────────

  const handleUnfollow = (organizerId: string): void => {
    if (userId === undefined) return
    setUnfollowError(false)
    const previous = followingList ?? []
    qc.setQueryData(profileKeys.following, previous.filter((o) => o._id !== organizerId))

    del(`/users/${userId}/following/${organizerId}`).catch(() => {
      qc.setQueryData(profileKeys.following, previous)
      setUnfollowError(true)
    })
  }

  // ─── Header ────────────────────────────────────────────────────────────

  const renderHeader = (): React.ReactElement => (
    <View style={styles.header}>
      <AnimatedPressable
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        hapticStyle="light"
      >
        <ChevronLeft size={24} color={colors.mobile.textPrimary} strokeWidth={2} />
      </AnimatedPressable>
      <View style={styles.headerCenter}>
        <Text style={styles.headerTitle}>Following</Text>
        {!isLoading && (
          <Text style={styles.headerCount}>{organizers.length}</Text>
        )}
      </View>
      <View style={styles.headerSpacer} />
    </View>
  )

  // ─── Loading ───────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </SafeAreaView>
    )
  }

  // ─── Error ─────────────────────────────────────────────────────────────

  if (isError) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.centered}>
          <Text style={styles.errorText}>Couldn't load following list</Text>
          <AnimatedPressable onPress={() => void refetch()} style={styles.retryPressable}>
            <Text style={styles.retryText}>Tap to retry</Text>
          </AnimatedPressable>
        </View>
      </SafeAreaView>
    )
  }

  // ─── Empty ─────────────────────────────────────────────────────────────

  if (organizers.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.centered}>
          <UserX size={48} color={colors.mobile.textMuted} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>Not following anyone yet</Text>
          <AnimatedPressable
            style={styles.discoverButton}
            onPress={() => navigation.goBack()}
            hapticStyle="light"
          >
            <Text style={styles.discoverText}>Discover Events</Text>
          </AnimatedPressable>
        </View>
      </SafeAreaView>
    )
  }

  // ─── Loaded ────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}

      {unfollowError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>Failed to unfollow. Please try again.</Text>
        </View>
      )}

      <FlatList
        data={organizers}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <OrganizerRow organizer={item} onUnfollow={handleUnfollow} />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
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

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sp[4],
    paddingTop: sp[2],
    paddingBottom: sp[3],
    backgroundColor: colors.mobile.bg,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sp[2],
  },
  headerTitle: {
    fontSize: fs.base,
    fontWeight: '700',
    color: colors.mobile.textPrimary,
  },
  headerCount: {
    fontSize: fs.sm,
    color: colors.mobile.textMuted,
  },
  headerSpacer: {
    width: 44,
  },

  // ── Error banner ──────────────────────────────────────────────────────────
  errorBanner: {
    marginHorizontal: sp[4],
    marginBottom: sp[2],
    paddingHorizontal: sp[4],
    paddingVertical: sp[3],
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderRadius: rd.md,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
  },
  errorBannerText: {
    fontSize: fs.sm,
    color: colors.mobile.error,
    textAlign: 'center',
  },

  // ── List ──────────────────────────────────────────────────────────────────
  listContent: {
    paddingHorizontal: sp[4],
    paddingTop: sp[2],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.mobile.surface,
    borderRadius: rd.xl,
    paddingHorizontal: sp[4],
    paddingVertical: sp[3],
    marginBottom: sp[3],
    gap: sp[3],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.mobile.border,
  },

  // ── Avatar ────────────────────────────────────────────────────────────────
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: rd.full,
    backgroundColor: colors.brand.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarInitials: {
    fontSize: fs.base,
    fontWeight: '700',
    color: colors.mobile.textPrimary,
  },

  // ── Row content ───────────────────────────────────────────────────────────
  rowContent: {
    flex: 1,
  },
  organizerName: {
    fontSize: fs.base,
    fontWeight: '700',
    color: colors.mobile.textPrimary,
    marginBottom: 2,
  },
  organizerEmail: {
    fontSize: fs.xs,
    color: colors.mobile.textMuted,
  },

  // ── Unfollow button ───────────────────────────────────────────────────────
  unfollowButton: {
    height: 32,
    minWidth: 72,
    borderRadius: rd.full,
    borderWidth: 1,
    borderColor: colors.brand.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    paddingHorizontal: sp[3],
  },
  unfollowText: {
    fontSize: fs.xs,
    fontWeight: '600',
    color: colors.brand.DEFAULT,
  },

  // ── Skeleton ──────────────────────────────────────────────────────────────
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: sp[4],
    marginBottom: sp[3],
    borderRadius: rd.xl,
    backgroundColor: colors.mobile.surface,
    padding: sp[3],
    gap: sp[3],
  },
  skeletonAvatar: {
    width: 48,
    height: 48,
    borderRadius: rd.full,
    backgroundColor: colors.mobile.surfaceRaised,
    flexShrink: 0,
  },
  skeletonLines: {
    flex: 1,
    gap: sp[2],
  },
  skeletonLineTop: {
    height: 14,
    width: '60%',
    borderRadius: rd.sm,
    backgroundColor: colors.mobile.surfaceRaised,
  },
  skeletonLineBottom: {
    height: 10,
    width: '40%',
    borderRadius: rd.sm,
    backgroundColor: colors.mobile.surfaceRaised,
  },

  // ── Centered (error / empty) ──────────────────────────────────────────────
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: sp[3],
    paddingHorizontal: sp[6],
  },
  emptyTitle: {
    fontSize: fs.base,
    fontWeight: '600',
    color: colors.mobile.textSecondary,
    textAlign: 'center',
  },
  discoverButton: {
    marginTop: sp[2],
    paddingHorizontal: sp[6],
    paddingVertical: sp[3],
  },
  discoverText: {
    fontSize: fs.sm,
    fontWeight: '600',
    color: colors.brand.DEFAULT,
  },
  errorText: {
    fontSize: fs.base,
    color: colors.mobile.textSecondary,
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
})
