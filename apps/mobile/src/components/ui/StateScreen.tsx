import React from 'react'
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, sp, rd, fs } from '@comfytag/ui/tokens'
import { AnimatedPressable } from './AnimatedPressable'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StateScreenProps {
  type: 'loading' | 'success' | 'error' | 'empty' | 'declined'
  title?: string
  subtitle?: string
  action?: { label: string; onPress: () => void }
}

// ─── Default copy per type ────────────────────────────────────────────────────

const DEFAULTS: Record<
  StateScreenProps['type'],
  { title: string; subtitle: string; icon: string }
> = {
  loading: {
    title: 'Loading...',
    subtitle: '',
    icon: '',
  },
  success: {
    title: 'Done',
    subtitle: '',
    icon: '✓',
  },
  error: {
    title: 'Something went wrong',
    subtitle: 'Please try again.',
    icon: '!',
  },
  empty: {
    title: 'Nothing here yet',
    subtitle: '',
    icon: '○',
  },
  declined: {
    title: 'Declined',
    subtitle: '',
    icon: '✕',
  },
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function StateScreen({
  type,
  title,
  subtitle,
  action,
}: StateScreenProps): React.ReactElement {
  const defaults = DEFAULTS[type]
  const resolvedTitle = title ?? defaults.title
  const resolvedSubtitle = subtitle ?? defaults.subtitle

  // Loading renders a spinner with no icon circle.
  if (type === 'loading') {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={colors.brand.DEFAULT} />
        {resolvedTitle.length > 0 && resolvedTitle !== 'Loading...' && (
          <Text style={styles.loadingText}>{resolvedTitle}</Text>
        )}
        {resolvedTitle === 'Loading...' && (
          <Text style={styles.loadingText}>{resolvedTitle}</Text>
        )}
      </SafeAreaView>
    )
  }

  // Icon circle background colour per type.
  const iconBg: Record<Exclude<StateScreenProps['type'], 'loading'>, string> = {
    success: colors.success.DEFAULT,
    error: colors.error.bg,
    empty: colors.public.border,
    declined: colors.public.border,
  }

  const iconColor: Record<Exclude<StateScreenProps['type'], 'loading'>, string> = {
    success: colors.textPublic.onBrand,
    error: colors.error.DEFAULT,
    empty: colors.textPublic.secondary,
    declined: colors.textPublic.secondary,
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Icon circle */}
      <View
        style={[
          styles.iconCircle,
          { backgroundColor: iconBg[type as keyof typeof iconBg] },
        ]}
      >
        <Text
          style={[
            styles.iconText,
            { color: iconColor[type as keyof typeof iconColor] },
          ]}
        >
          {defaults.icon}
        </Text>
      </View>

      {/* Title */}
      <Text style={styles.title}>{resolvedTitle}</Text>

      {/* Subtitle */}
      {resolvedSubtitle.length > 0 && (
        <Text style={styles.subtitle}>{resolvedSubtitle}</Text>
      )}

      {/* Action button */}
      {action !== undefined && (
        <AnimatedPressable
          style={styles.actionButton}
          hapticStyle="medium"
          onPress={action.onPress}
        >
          <Text style={styles.actionButtonText}>{action.label}</Text>
        </AnimatedPressable>
      )}
    </SafeAreaView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.public.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: sp[8],
  },

  // ── Loading ───────────────────────────────────────────────────────────────
  loadingText: {
    marginTop: sp[4],
    fontSize: fs.base,
    color: colors.textPublic.secondary,
    textAlign: 'center',
  },

  // ── Icon circle ───────────────────────────────────────────────────────────
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: sp[5],
  },
  iconText: {
    fontSize: fs['2xl'],
    fontWeight: '700',
  },

  // ── Text ──────────────────────────────────────────────────────────────────
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
    marginBottom: sp[8],
    lineHeight: 20,
  },

  // ── Action button ─────────────────────────────────────────────────────────
  actionButton: {
    width: '100%',
    minHeight: 52,
    backgroundColor: colors.brand.DEFAULT,
    borderRadius: rd.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: sp[6],
  },
  actionButtonText: {
    fontSize: fs.base,
    fontWeight: '600',
    color: colors.textPublic.onBrand,
  },
})
