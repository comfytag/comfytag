import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AlertCircle } from 'lucide-react-native'
import { colors, sp, fs, rd } from '@comfytag/ui/tokens'
import { AnimatedPressable } from './AnimatedPressable'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  children: React.ReactNode
  fallbackTitle?: string
}

interface State {
  hasError: boolean
  message: string
}

// ─── ErrorBoundary ────────────────────────────────────────────────────────────

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  private reset = (): void => {
    this.setState({ hasError: false, message: '' })
  }

  render(): React.ReactNode {
    if (!this.state.hasError) return this.props.children

    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <View style={styles.center}>
          <View style={styles.iconWrap}>
            <AlertCircle size={40} color={colors.mobile.error} strokeWidth={1.5} />
          </View>
          <Text style={styles.title}>
            {this.props.fallbackTitle ?? 'Something went wrong'}
          </Text>
          <Text style={styles.message} numberOfLines={3}>
            {this.state.message || 'An unexpected error occurred. Please try again.'}
          </Text>
          <AnimatedPressable
            style={styles.retryBtn}
            onPress={this.reset}
            hapticStyle="medium"
          >
            <Text style={styles.retryText}>Try Again</Text>
          </AnimatedPressable>
        </View>
      </SafeAreaView>
    )
  }
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.mobile.bg,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: sp[6],
    gap: sp[3],
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(239,68,68,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: sp[2],
  },
  title: {
    fontSize: fs.lg,
    fontWeight: '700',
    color: colors.mobile.textPrimary,
    textAlign: 'center',
  },
  message: {
    fontSize: fs.sm,
    color: colors.mobile.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryBtn: {
    marginTop: sp[2],
    paddingHorizontal: sp[6],
    paddingVertical: sp[3],
    backgroundColor: colors.brand.DEFAULT,
    borderRadius: rd.lg,
  },
  retryText: {
    fontSize: fs.sm,
    fontWeight: '700',
    color: '#FFFFFF',
  },
})
