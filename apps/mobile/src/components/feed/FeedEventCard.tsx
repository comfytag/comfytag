import React, { useState } from 'react'
import { View, Text, Image, ScrollView, StyleSheet, useWindowDimensions } from 'react-native'
import type { NativeSyntheticEvent, NativeScrollEvent } from 'react-native'
import { Heart, MessageCircle, Eye, Share2, MapPin } from 'lucide-react-native'
import { colors, sp, rd, fs } from '@comfytag/ui/tokens'
import { formatDate } from '@comfytag/utils'
import { AnimatedPressable } from '../ui/AnimatedPressable'
import { ScrimOverlay } from '../ui/ScrimOverlay'
import { getEventPriceLabel } from '../../lib/eventPricing'
import type { Event } from '@comfytag/types'

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface FeedEventCardProps {
  event: Event
  height: number
  organizerName: string
  organizerAvatar: string
  commentsCount: number
  viewsCount: number
  promoted?: boolean
  onPress?: () => void
  onGetTicketPress?: () => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPrice(event: Event): string {
  return getEventPriceLabel(event.ticketType)
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function FeedEventCard({
  event,
  height,
  organizerName,
  organizerAvatar,
  commentsCount,
  viewsCount,
  promoted = false,
  onPress,
  onGetTicketPress,
}: FeedEventCardProps) {
  const { width } = useWindowDimensions()
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  const images = event.images.length > 0 ? event.images : event.coverImage ? [event.coverImage] : []

  const handleMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width)
    setActiveImageIndex(index)
  }

  return (
    <View style={[styles.card, { height, width }]}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
      >
        {images.map((uri, i) => (
          <AnimatedPressable key={i} onPress={onPress} hapticStyle="light">
            <Image
              source={{ uri }}
              style={{ width, height }}
              resizeMode="cover"
              accessibilityLabel={`${event.name} poster image ${i + 1} of ${images.length}`}
            />
          </AnimatedPressable>
        ))}
      </ScrollView>

      <ScrimOverlay heightPercent="55%" />

      {/* Floating right rail: organizer avatar + engagement stats */}
      <View style={styles.rightRail} pointerEvents="box-none">
        <Image
          source={{ uri: organizerAvatar }}
          style={styles.railAvatar}
          accessibilityLabel={`${organizerName} organizer avatar`}
        />
        <View style={styles.railStat}>
          <Heart size={26} color="#FFFFFF" strokeWidth={2} />
          <Text style={styles.railStatText}>{event.likes ?? 0}</Text>
        </View>
        <View style={styles.railStat}>
          <MessageCircle size={26} color="#FFFFFF" strokeWidth={2} />
          <Text style={styles.railStatText}>{commentsCount}</Text>
        </View>
        <View style={styles.railStat}>
          <Eye size={24} color="#FFFFFF" strokeWidth={2} />
          <Text style={styles.railStatText}>{viewsCount}</Text>
        </View>
      </View>

      <AnimatedPressable style={styles.shareButton} hapticStyle="light">
        <Share2 size={20} color="#FFFFFF" strokeWidth={2} />
      </AnimatedPressable>

      {/* Bottom-left content overlay */}
      <View style={styles.bottomContent} pointerEvents="box-none">
        {promoted && (
          <View style={styles.promoBadge}>
            <Text style={styles.promoBadgeText}>PROMO</Text>
          </View>
        )}
        <Text style={styles.title} numberOfLines={2}>
          {event.name}
        </Text>
        <View style={styles.metaRow}>
          <MapPin size={13} color="rgba(255,255,255,0.75)" strokeWidth={2} />
          <Text style={styles.metaText} numberOfLines={1}>
            {formatDate(event.date)} · {event.venue}
          </Text>
        </View>
        <Text style={styles.seeMore}>See more</Text>

        <View style={styles.ctaRow}>
          <Text style={styles.price} numberOfLines={1}>
            {getPrice(event)}
          </Text>
          {images.length > 1 && (
            <View style={styles.dotsRow}>
              {images.map((_, i) => (
                <View key={i} style={[styles.dot, i === activeImageIndex && styles.dotActive]} />
              ))}
            </View>
          )}
          <AnimatedPressable
            onPress={onGetTicketPress}
            style={styles.getTicketButton}
            hapticStyle="medium"
          >
            <Text style={styles.getTicketText}>Get ticket</Text>
          </AnimatedPressable>
        </View>
      </View>
    </View>
  )
}

// ─── Styles ────────────────────────────────────────────────────────────────────
// Note: this card is deliberately edge-to-edge (no border radius, no side
// margins) per the reference design — a departure from the tokenized `rd.lg`
// card treatment used elsewhere in the app (shelves, dashboard), scoped to
// this one full-bleed feed layout only.

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.mobile.bg,
    overflow: 'hidden',
  },
  // Right rail — spans the full card height so it can bottom-align via flex
  // instead of guessing a fixed pixel offset to clear the text block below it.
  rightRail: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: sp[3],
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: sp[12] + sp[8], // 80 — clears the bottom-left content block
    gap: sp[5],
  },
  railAvatar: {
    width: 44,
    height: 44,
    borderRadius: rd.full,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  railStat: {
    alignItems: 'center',
    gap: 2,
  },
  railStatText: {
    fontSize: fs.xs,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  shareButton: {
    position: 'absolute',
    right: sp[4],
    bottom: sp[12],
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Bottom-left content
  bottomContent: {
    position: 'absolute',
    left: sp[4],
    right: sp[12] + sp[4], // 64 — leaves room for the floating right rail
    bottom: sp[6],
  },
  promoBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.brand.DEFAULT,
    borderRadius: rd.sm,
    paddingHorizontal: sp[2],
    paddingVertical: 3,
    marginBottom: sp[2],
  },
  promoBadgeText: {
    fontSize: fs.xs,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: fs.xl,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: sp[2],
    textTransform: 'capitalize',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp[1],
    marginBottom: sp[2],
  },
  metaText: {
    fontSize: fs.sm,
    color: 'rgba(255,255,255,0.75)',
    flexShrink: 1,
  },
  seeMore: {
    fontSize: fs.sm,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: sp[3],
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    fontSize: fs.lg,
    fontWeight: '800',
    color: '#FFFFFF',
    marginRight: sp[3],
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 4,
    marginRight: sp[3],
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: rd.full,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
    width: 14,
  },
  getTicketButton: {
    backgroundColor: colors.brand.DEFAULT,
    paddingHorizontal: sp[5],
    height: 44,
    borderRadius: rd.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  getTicketText: {
    fontSize: fs.sm,
    fontWeight: '700',
    color: '#FFFFFF',
  },
})
