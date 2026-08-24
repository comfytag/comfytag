import React, { useState } from 'react'
import { View, Text, Image, StyleSheet } from 'react-native'
import { MapPin } from 'lucide-react-native'
import { colors, sp, rd, fs } from '@comfytag/ui/tokens'
import { formatDate } from '@comfytag/utils'
import { AnimatedPressable } from '../ui/AnimatedPressable'
import { getEventPriceLabel } from '../../lib/eventPricing'
import type { Event } from '@comfytag/types'

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface EventListCardProps {
  event: Event
  onPress: () => void
  onGetTicket: () => void
}

// ─── Component ─────────────────────────────────────────────────────────────────
// Full-width horizontal row card for "Up next" — replaces the old 2-column
// grid with a richer, single-column list (image left, details + CTA right).

export function EventListCard({ event, onPress, onGetTicket }: EventListCardProps) {
  const [imageError, setImageError] = useState(false)
  const imageUri = event.images[0] ?? event.coverImage
  const showImage = imageUri !== undefined && imageUri.length > 0 && !imageError

  return (
    <AnimatedPressable onPress={onPress} scaleDown={0.98} hapticStyle="light" style={styles.card}>
      {showImage ? (
        <Image
          source={{ uri: imageUri }}
          style={styles.image}
          resizeMode="cover"
          onError={() => setImageError(true)}
          accessibilityLabel={`${event.name} cover image`}
        />
      ) : (
        <View style={[styles.image, styles.imageFallback]} />
      )}

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {event.name}
        </Text>
        <View style={styles.metaRow}>
          <MapPin size={12} color={colors.textPublic.muted} strokeWidth={2} />
          <Text style={styles.metaText} numberOfLines={1}>
            {event.venue} · {formatDate(event.date)}
          </Text>
        </View>
        <View style={styles.bottomRow}>
          <Text style={styles.price}>{getEventPriceLabel(event.ticketType)}</Text>
          <AnimatedPressable onPress={onGetTicket} hapticStyle="medium" style={styles.ctaButton}>
            <Text style={styles.ctaButtonText}>Get Ticket</Text>
          </AnimatedPressable>
        </View>
      </View>
    </AnimatedPressable>
  )
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const IMAGE_SIZE = 112

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.public.surface,
    borderWidth: 1,
    borderColor: colors.public.border,
    borderRadius: rd.lg,
    overflow: 'hidden',
  },
  image: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
  },
  imageFallback: {
    backgroundColor: colors.brand.DEFAULT,
  },
  content: {
    flex: 1,
    padding: sp[3],
    justifyContent: 'space-between',
  },
  title: {
    fontSize: fs.sm,
    fontWeight: '700',
    color: colors.textPublic.primary,
    lineHeight: 18,
    textTransform: 'capitalize',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp[1],
    marginTop: sp[1],
  },
  metaText: {
    fontSize: fs.xs,
    color: colors.textPublic.muted,
    flexShrink: 1,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: sp[2],
  },
  price: {
    fontSize: fs.sm,
    fontWeight: '700',
    color: colors.textPublic.primary,
  },
  ctaButton: {
    backgroundColor: colors.brand.DEFAULT,
    paddingHorizontal: sp[3],
    height: 32,
    borderRadius: rd.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonText: {
    fontSize: fs.xs,
    fontWeight: '700',
    color: '#FFFFFF',
  },
})
