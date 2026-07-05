import React from 'react'
import { View, Text, StyleSheet, ViewStyle } from 'react-native'
import { colors, sp, rd, fs } from '@comfytag/ui/tokens'

// ─── Types ─────────────────────────────────────────────────────────────────────

export type BadgeVariant =
  | 'upcoming'
  | 'live'
  | 'ended'
  | 'draft'
  | 'soldOut'
  | 'trending'
  | 'sellingFast'
  | 'free'
  | 'verified'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'sent'
  | 'custom'

export interface BadgeProps {
  variant?: BadgeVariant
  label: string
  customBg?: string
  customText?: string
  size?: 'sm' | 'md'
  style?: ViewStyle
}

// ─── Variant map ───────────────────────────────────────────────────────────────

const variantMap: Record<
  Exclude<BadgeVariant, 'custom'>,
  { bg: string; text: string }
> = {
  upcoming:    colors.badges.upcoming,
  live:        colors.badges.live,
  ended:       colors.badges.ended,
  draft:       colors.badges.draft,
  soldOut:     colors.badges.soldOut,
  trending:    colors.badges.trending,
  sellingFast: colors.badges.sellingFast,
  free:        { bg: '#D1FAE5', text: '#065F46' },
  verified:    colors.badges.verified,
  pending:     colors.badges.pending,
  approved:    colors.badges.approved,
  rejected:    colors.badges.rejected,
  sent:        { bg: '#DBEAFE', text: '#1D4ED8' },
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function Badge({
  variant = 'upcoming',
  label,
  customBg,
  customText,
  size = 'sm',
  style,
}: BadgeProps) {
  const colors_ =
    variant === 'custom'
      ? { bg: customBg ?? '#E5E5E5', text: customText ?? '#333' }
      : variantMap[variant]

  return (
    <View
      style={[
        styles.base,
        size === 'md' ? styles.md : styles.sm,
        { backgroundColor: colors_.bg },
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          size === 'md' ? styles.labelMd : styles.labelSm,
          { color: colors_.text },
        ]}
      >
        {label}
      </Text>
    </View>
  )
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  base: {
    borderRadius: rd.full,
    alignSelf: 'flex-start',
  },
  sm: {
    paddingHorizontal: sp[2],
    paddingVertical: 3,
  },
  md: {
    paddingHorizontal: sp[3],
    paddingVertical: sp[1],
  },
  label: {
    fontWeight: '700',
  },
  labelSm: {
    fontSize: fs.xs,
  },
  labelMd: {
    fontSize: fs.sm,
  },
})
