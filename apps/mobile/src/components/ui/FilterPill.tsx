import React from 'react'
import { Text, StyleSheet } from 'react-native'
import { colors, sp, rd, fs } from '@comfytag/ui/tokens'
import { AnimatedPressable } from './AnimatedPressable'

interface FilterPillProps {
  label: string
  active: boolean
  onPress: () => void
}

export function FilterPill({ label, active, onPress }: FilterPillProps) {
  return (
    <AnimatedPressable
      onPress={onPress}
      hapticStyle="light"
      scaleDown={0.95}
      style={[styles.filterPill, active && styles.filterPillActive]}
    >
      <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>
        {label}
      </Text>
    </AnimatedPressable>
  )
}

const styles = StyleSheet.create({
  filterPill: {
    paddingHorizontal: sp[3],
    paddingVertical: sp[2],
    backgroundColor: colors.public.surface,
    borderRadius: rd.full,
    borderWidth: 1,
    borderColor: colors.public.border,
    marginRight: sp[2],
    minHeight: 44,
    justifyContent: 'center',
  },
  filterPillActive: {
    backgroundColor: colors.brand.DEFAULT,
    borderColor: colors.brand.DEFAULT,
  },
  filterPillText: {
    fontSize: fs.sm,
    color: colors.textPublic.secondary,
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
})
