import React from 'react'
import { View, StyleSheet, type ViewStyle } from 'react-native'

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface ScrimOverlayProps {
  /** Height of the scrim band, as a percentage of its container (e.g. '55%'). */
  heightPercent?: `${number}%`
  style?: ViewStyle
}

// ─── Component ─────────────────────────────────────────────────────────────────
// Stacked flat opacity layers approximating a bottom-to-top fade over a photo,
// for text legibility. No gradient library installed yet — see FeedEventCard.tsx
// for the same note. Swap for expo-linear-gradient later if a smoother fade
// is wanted; this reads correctly today with zero new dependencies.

export function ScrimOverlay({ heightPercent = '55%', style }: ScrimOverlayProps) {
  return (
    <View pointerEvents="none" style={[styles.wrap, { height: heightPercent }, style]}>
      <View style={styles.layer1} />
      <View style={styles.layer2} />
      <View style={styles.layer3} />
    </View>
  )
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  layer1: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  layer2: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: '40%',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  layer3: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: '70%',
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
})
