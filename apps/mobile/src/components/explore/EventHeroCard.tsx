import React, { useState } from 'react'
import { View, Text, Image, StyleSheet } from 'react-native'
import { Calendar } from 'lucide-react-native'
import { colors, sp, rd, fs } from '@comfytag/ui/tokens'
import { formatDate, initials } from '@comfytag/utils'
import { AnimatedPressable } from '../ui/AnimatedPressable'
import { ScrimOverlay } from '../ui/ScrimOverlay'
import { getEventPriceLabel } from '../../lib/eventPricing'
import type { Event } from '@comfytag/types'

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface EventHeroCardProps {
  event: Event
  organizerName: string
  organizerAvatar?: string
  width: number
  onPress: () => void
}

const CARD_HEIGHT = 380

// ─── Component ─────────────────────────────────────────────────────────────────
// "Almost full screen width" featured card — deliberately large and detail-rich
// (cover image, organizer avatar, title, date, price) rather than a small
// thumbnail, per the "make the app feel full" direction for this row.

export function EventHeroCard({ event, organizerName, organizerAvatar, width, onPress }: EventHeroCardProps) {
  const [imageError, setImageError] = useState(false)
  const imageUri = event.images[0] ?? event.coverImage
  const showImage = imageUri !== undefined && imageUri.length > 0 && !imageError

  return (
    <AnimatedPressable
      onPress={onPress}
      scaleDown={0.98}
      hapticStyle="light"
      style={[styles.card, { width, height: CARD_HEIGHT }]}
    >
      {showImage ? (
        <Image
          source={{ uri: imageUri }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
          onError={() => setImageError(true)}
          accessibilityLabel={`${event.name} cover image`}
        />
      ) : (
        <View style={[StyleSheet.absoluteFillObject, styles.imageFallback]} />
      )}

      <ScrimOverlay heightPercent="60%" />

      <View style={styles.organizerRow}>
        {organizerAvatar !== undefined && organizerAvatar.length > 0 ? (
          <Image
            source={{ uri: organizerAvatar }}
            style={styles.organizerAvatar}
            accessibilityLabel={`${organizerName} organizer avatar`}
          />
        ) : (
          <View style={[styles.organizerAvatar, styles.organizerAvatarFallback]}>
            <Text style={styles.organizerAvatarInitials}>{initials(organizerName)}</Text>
          </View>
        )}
        <Text style={styles.organizerName} numberOfLines={1}>
          {organizerName}
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {event.name}
        </Text>
        <View style={styles.metaRow}>
          <Calendar size={13} color="rgba(255,255,255,0.75)" strokeWidth={2} />
          <Text style={styles.metaText} numberOfLines={1}>
            {formatDate(event.date)} · {event.venue}
          </Text>
        </View>
        <Text style={styles.price}>{getEventPriceLabel(event.ticketType)}</Text>
      </View>
    </AnimatedPressable>
  )
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    borderRadius: rd.xl,
    overflow: 'hidden',
    marginRight: sp[3],
    backgroundColor: colors.public.surfaceAlt,
  },
  imageFallback: {
    backgroundColor: colors.brand.DEFAULT,
  },
  organizerRow: {
    position: 'absolute',
    top: sp[4],
    left: sp[4],
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp[2],
  },
  organizerAvatar: {
    width: 28,
    height: 28,
    borderRadius: rd.full,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  organizerAvatarFallback: {
    backgroundColor: colors.brand.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  organizerAvatarInitials: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  organizerName: {
    fontSize: fs.xs,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  content: {
    position: 'absolute',
    left: sp[4],
    right: sp[4],
    bottom: sp[4],
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
  price: {
    fontSize: fs.lg,
    fontWeight: '800',
    color: '#FFFFFF',
  },
})
