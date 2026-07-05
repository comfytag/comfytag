import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native'
import { colors, sp, fs } from '@comfytag/ui/tokens'

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
        <TouchableOpacity
          onPress={onSeeAll}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.seeAll}>{seeAllLabel}</Text>
        </TouchableOpacity>
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
    color: colors.mobile.textPrimary,
  },
  subtitle: {
    fontSize: fs.xs,
    color: colors.mobile.textSecondary,
    marginTop: 2,
  },
  seeAll: {
    fontSize: fs.sm,
    color: colors.brand.DEFAULT,
    fontWeight: '600',
  },
})
