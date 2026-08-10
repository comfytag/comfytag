import React from 'react'
import { View, Text, StyleSheet, ViewStyle } from 'react-native'
import { colors, sp, fs } from '@comfytag/ui/tokens'
import { AnimatedPressable } from './AnimatedPressable'

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface SectionHeaderProps {
  title: string
  seeAllLabel?: string
  onSeeAll?: () => void
  subtitle?: string
  style?: ViewStyle
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function SectionHeader({
  title,
  seeAllLabel = 'See all',
  onSeeAll,
  subtitle,
  style,
}: SectionHeaderProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.left}>
        <Text style={styles.title}>{title}</Text>
        {subtitle !== undefined && (
          <Text style={styles.subtitle}>{subtitle}</Text>
        )}
      </View>

      {onSeeAll !== undefined && (
        <AnimatedPressable
          onPress={onSeeAll}
          hapticStyle="light"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.seeAll}>{seeAllLabel}</Text>
        </AnimatedPressable>
      )}
    </View>
  )
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: sp[2],
  },
  left: {
    flex: 1,
  },
  title: {
    fontSize: fs.lg,
    fontWeight: '700',
    color: colors.textPublic.primary,
  },
  subtitle: {
    fontSize: fs.xs,
    color: colors.textPublic.secondary,
    marginTop: 2,
  },
  seeAll: {
    fontSize: fs.sm,
    color: colors.brand.DEFAULT,
    fontWeight: '600',
  },
})
