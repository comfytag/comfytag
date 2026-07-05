import React, { useRef, useEffect, useState } from 'react'
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
} from 'react-native'
import { colors, sp, rd, fs } from '@comfytag/ui/tokens'
import { AnimatedPressable } from './AnimatedPressable'
import type { Event } from '@comfytag/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface BadgeConfig {
  label: string
  color: string
  bg: string
}

export interface EventCardProps {
  event: Event
  onPress: () => void
  variant: 'trending' | 'grid'
  likedIds?: Set<string>
  onLike?: (id: string) => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getBadge(event: Event): BadgeConfig | null {
  const totalCap = event.ticketType.reduce((s, t) => s + t.capacity, 0)
  const soldRatio = totalCap > 0 ? event.sold / totalCap : 0
  const minPrice =
    event.ticketType.length > 0
      ? Math.min(...event.ticketType.map((t) => t.price))
      : 0

  if (soldRatio >= 0.9)
    return {
      label: 'Almost Sold Out',
      color: colors.mobile.error,
      bg: 'rgba(239,68,68,0.15)',
    }
  if (soldRatio >= 0.7)
    return {
      label: 'Selling Fast',
      color: colors.mobile.energy,
      bg: 'rgba(245,158,11,0.15)',
    }
  if (minPrice === 0)
    return {
      label: 'Free',
      color: colors.mobile.success,
      bg: 'rgba(16,185,129,0.15)',
    }
  if (event.featured)
    return {
      label: 'Trending',
      color: colors.mobile.energy,
      bg: 'rgba(245,158,11,0.15)',
    }
  return null
}

function getPrice(event: Event): string {
  if (event.ticketType.length === 0) return 'Free'
  const min = Math.min(...event.ticketType.map((t) => t.price))
  return min === 0 ? 'Free' : `₦${min.toLocaleString()}`
}

function shortDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-NG', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

function getImageUri(event: Event): string | null {
  const uri = event.images[0] ?? event.coverImage
  return uri !== undefined && uri.length > 0 ? uri : null
}

// ─── Badge pill ───────────────────────────────────────────────────────────────

function BadgePill({ badge }: { badge: BadgeConfig }) {
  return (
    <View style={[styles.badge, { backgroundColor: badge.bg }]}>
      <Text style={[styles.badgeText, { color: badge.color }]}>
        {badge.label}
      </Text>
    </View>
  )
}

// ─── EventCard ────────────────────────────────────────────────────────────────

export const EventCard = React.memo(function EventCard({
  event,
  onPress,
  variant,
  likedIds,
  onLike,
}: EventCardProps) {
  const [imageError, setImageError] = useState(false)
  const imageUri = getImageUri(event)
  const badge = getBadge(event)
  const showImage = imageUri !== null && !imageError

  if (variant === 'trending') {
    return (
      <AnimatedPressable
        onPress={onPress}
        scaleDown={0.97}
        hapticStyle="light"
        style={styles.trendingCard}
      >
        {/* Background */}
        {showImage ? (
          <Image
            source={{ uri: imageUri }}
            style={styles.trendingImage}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={[styles.trendingImage, styles.imageFallback]} />
        )}

        {/* Bottom dark overlay */}
        <View style={styles.trendingOverlay} />

        {/* Top-right badge */}
        {badge !== null && (
          <View style={styles.badgeTopRight}>
            <BadgePill badge={badge} />
          </View>
        )}

        {/* Bottom content */}
        <View style={styles.trendingContent}>
          <Text style={styles.trendingName} numberOfLines={2}>
            {event.name}
          </Text>
          <Text style={styles.trendingDate} numberOfLines={1}>
            {shortDate(event.date)}
          </Text>
        </View>
      </AnimatedPressable>
    )
  }

  // Grid variant
  return (
    <AnimatedPressable
      onPress={onPress}
      scaleDown={0.97}
      hapticStyle="light"
      style={styles.gridCard}
    >
      {/* Background */}
      {showImage ? (
        <Image
          source={{ uri: imageUri }}
          style={styles.gridImage}
          resizeMode="cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <View style={[styles.gridImage, styles.imageFallback]} />
      )}

      {/* Bottom dark overlay */}
      <View style={styles.gridOverlay} />

      {/* Top-right badge */}
      {badge !== null && (
        <View style={styles.badgeTopRight}>
          <BadgePill badge={badge} />
        </View>
      )}

      {/* Bottom content */}
      <View style={styles.gridContent}>
        <Text style={styles.gridName} numberOfLines={2}>
          {event.name}
        </Text>
        <Text style={styles.gridVenue} numberOfLines={1}>
          {event.venue}
        </Text>
        <Text style={styles.gridPrice}>{getPrice(event)}</Text>
      </View>
    </AnimatedPressable>
  )
})

// ─── EventCardSkeleton ────────────────────────────────────────────────────────

interface SkeletonProps {
  variant: 'trending' | 'grid'
}

export const EventCardSkeleton = React.memo(function EventCardSkeleton({ variant }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.6,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    )
    pulse.start()
    return () => pulse.stop()
  }, [opacity])

  const cardStyle =
    variant === 'trending' ? styles.trendingCard : styles.gridCard

  return (
    <Animated.View
      style={[cardStyle, styles.skeletonBg, { opacity }]}
    />
  )
})

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Trending ─────────────────────────────────────────────────────────────
  trendingCard: {
    width: 160,
    height: 210,
    borderRadius: rd.lg,
    overflow: 'hidden',
    marginRight: sp[3],
    backgroundColor: colors.mobile.surfaceRaised,
  },
  trendingImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  trendingOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '75%',
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderBottomLeftRadius: rd.lg,
    borderBottomRightRadius: rd.lg,
  },
  trendingContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: sp[3],
  },
  trendingName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.mobile.textPrimary,
    lineHeight: 17,
    marginBottom: sp[1],
  },
  trendingDate: {
    fontSize: 11,
    color: colors.mobile.textSecondary,
  },

  // ── Grid ──────────────────────────────────────────────────────────────────
  gridCard: {
    height: 180,
    borderRadius: rd.lg,
    overflow: 'hidden',
    backgroundColor: colors.mobile.surfaceRaised,
  },
  gridImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gridOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '75%',
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderBottomLeftRadius: rd.lg,
    borderBottomRightRadius: rd.lg,
  },
  gridContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: sp[3],
  },
  gridName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.mobile.textPrimary,
    lineHeight: 17,
    marginBottom: 2,
  },
  gridVenue: {
    fontSize: 11,
    color: colors.mobile.textSecondary,
    marginBottom: 2,
  },
  gridPrice: {
    fontSize: 11,
    color: colors.mobile.textSecondary,
    fontWeight: '600',
  },

  // ── Badge ─────────────────────────────────────────────────────────────────
  badgeTopRight: {
    position: 'absolute',
    top: sp[2],
    right: sp[2],
  },
  badge: {
    paddingHorizontal: sp[2],
    paddingVertical: 3,
    borderRadius: rd.full,
  },
  badgeText: {
    fontSize: fs.xs,
    fontWeight: '700',
  },

  // ── Shared ────────────────────────────────────────────────────────────────
  imageFallback: {
    backgroundColor: colors.brand.DEFAULT,
  },
  skeletonBg: {
    backgroundColor: colors.mobile.surfaceRaised,
  },
})
