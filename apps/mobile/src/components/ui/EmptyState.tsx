import React from 'react'
import { View, Text, StyleSheet, ViewStyle } from 'react-native'
import { colors, sp, rd, fs } from '@comfytag/ui/tokens'
import { Button } from './Button'

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface EmptyStateProps {
  icon?: string
  title: string
  subtitle?: string
  action?: {
    label: string
    onPress: () => void
  }
  secondaryAction?: {
    label: string
    onPress: () => void
  }
  style?: ViewStyle
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function EmptyState({
  icon = '○',
  title,
  subtitle,
  action,
  secondaryAction,
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconCircle}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle !== undefined && (
        <Text style={styles.subtitle}>{subtitle}</Text>
      )}
      {action !== undefined && (
        <Button
          label={action.label}
          onPress={action.onPress}
          variant="brand"
          style={styles.action}
          fullWidth={false}
        />
      )}
      {secondaryAction !== undefined && (
        <Button
          label={secondaryAction.label}
          onPress={secondaryAction.onPress}
          variant="ghost"
          style={styles.secondaryAction}
          fullWidth={false}
        />
      )}
    </View>
  )
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: sp[8],
    paddingVertical: sp[10],
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.public.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: sp[5],
  },
  icon: {
    fontSize: 36,
    color: colors.textPublic.secondary,
  },
  title: {
    fontSize: fs.xl,
    fontWeight: '700',
    color: colors.textPublic.primary,
    textAlign: 'center',
    marginBottom: sp[2],
  },
  subtitle: {
    fontSize: fs.sm,
    color: colors.textPublic.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: sp[6],
  },
  action: {
    paddingHorizontal: sp[8],
    minWidth: 180,
  },
  secondaryAction: {
    marginTop: sp[3],
    minWidth: 180,
  },
})
