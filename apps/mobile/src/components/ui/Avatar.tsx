import React, { useState } from 'react'
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native'
import { colors, fs } from '@comfytag/ui/tokens'
import { initials } from '../../lib/utils'

// ─── Types ─────────────────────────────────────────────────────────────────────

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export interface AvatarProps {
  uri?: string | null
  name?: string
  size?: AvatarSize
  style?: ViewStyle
}

// ─── Size map ──────────────────────────────────────────────────────────────────

const sizeMap: Record<AvatarSize, { dim: number; fontSize: number }> = {
  xs: { dim: 24, fontSize: fs.xs },
  sm: { dim: 32, fontSize: fs.sm },
  md: { dim: 44, fontSize: fs.base },
  lg: { dim: 56, fontSize: fs.lg },
  xl: { dim: 80, fontSize: fs['2xl'] },
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function Avatar({ uri, name, size = 'md', style }: AvatarProps) {
  const [imageError, setImageError] = useState(false)
  const { dim, fontSize } = sizeMap[size]
  const showImage = !!uri && !imageError
  const label = name ? initials(name) : '?'

  return (
    <View
      style={[
        styles.base,
        { width: dim, height: dim, borderRadius: dim / 2 },
        style,
      ]}
    >
      {showImage ? (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <Text style={[styles.initials, { fontSize }]}>{label}</Text>
      )}
    </View>
  )
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.brand.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
})
