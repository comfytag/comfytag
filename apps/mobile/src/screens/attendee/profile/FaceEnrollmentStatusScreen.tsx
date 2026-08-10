import React, { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { StackScreenProps } from '@react-navigation/stack'
import { ChevronLeft, Scan } from 'lucide-react-native'
import { colors, fs, rd, sp } from '@comfytag/ui/tokens'
import { AnimatedPressable } from '../../../components/ui/AnimatedPressable'
import { getSDKStatus } from '../../../lib/faceSDK'
import type { FaceSDKStatus } from '../../../lib/faceSDK'
import { useAuthStore } from '../../../store'
import type { ProfileStackParamList } from '../../../navigation/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = StackScreenProps<ProfileStackParamList, 'FaceEnrollmentStatus'>

type ScreenState = 'loading' | 'loaded' | 'error'

// ─── Header component ─────────────────────────────────────────────────────────

interface ScreenHeaderProps {
  onBack: () => void
}

function ScreenHeader({ onBack }: ScreenHeaderProps): React.ReactElement {
  return (
    <View style={styles.header}>
      <AnimatedPressable style={styles.backButton} onPress={onBack} hapticStyle="light">
        <ChevronLeft size={24} color={colors.textPublic.primary} strokeWidth={2} />
      </AnimatedPressable>
      <Text style={styles.headerTitle}>Face Entry</Text>
      <View style={styles.headerSpacer} />
    </View>
  )
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function FaceEnrollmentStatusScreen({ navigation }: Props): React.ReactElement {
  const user = useAuthStore((state) => state.user)
  const faceEnrolled = user?.faceEnrolled ?? false

  const [screenState, setScreenState] = useState<ScreenState>('loading')
  const [sdkStatus, setSdkStatus] = useState<FaceSDKStatus | null>(null)

  const pulseScale = useRef(new Animated.Value(0.85)).current
  const pulseOpacity = useRef(new Animated.Value(0.5)).current

  useEffect(() => {
    if (!faceEnrolled) return
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseScale, { toValue: 1.15, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseScale, { toValue: 0.85, duration: 1000, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(pulseOpacity, { toValue: 0.2, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 0.5, duration: 1000, useNativeDriver: true }),
        ]),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [faceEnrolled, pulseScale, pulseOpacity])

  // ─── Load SDK status on mount ──────────────────────────────────────────

  useEffect(() => {
    try {
      const status = getSDKStatus()
      setSdkStatus(status)
      setScreenState('loaded')
    } catch {
      setScreenState('error')
    }
  }, [])

  const handleRetry = (): void => {
    setScreenState('loading')
    try {
      const status = getSDKStatus()
      setSdkStatus(status)
      setScreenState('loaded')
    } catch {
      setScreenState('error')
    }
  }

  // Derived display values from actual FaceSDKStatus shape
  const isReady = sdkStatus?.initialized ?? false
  const sdkMode: string = sdkStatus?.licensed ? 'live' : 'mock'

  // ─── Loading state ─────────────────────────────────────────────────────

  if (screenState === 'loading') {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader onBack={() => navigation.goBack()} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.brand.DEFAULT} />
        </View>
      </SafeAreaView>
    )
  }

  // ─── Error state ───────────────────────────────────────────────────────

  if (screenState === 'error') {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader onBack={() => navigation.goBack()} />
        <View style={styles.centered}>
          <Text style={styles.errorText}>Couldn't load face entry status</Text>
          <AnimatedPressable style={styles.retryPressable} onPress={handleRetry}>
            <Text style={styles.retryText}>Tap to retry</Text>
          </AnimatedPressable>
        </View>
      </SafeAreaView>
    )
  }

  // ─── Loaded state ──────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader onBack={() => navigation.goBack()} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status card */}
        <View style={[styles.card, styles.statusCard]}>
          {/* Icon circle */}
          <View style={styles.iconWrapper}>
            {faceEnrolled && (
              <Animated.View
                style={[
                  styles.pulseRing,
                  { transform: [{ scale: pulseScale }], opacity: pulseOpacity },
                ]}
              />
            )}
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: faceEnrolled ? colors.brand.DEFAULT : colors.public.surfaceAlt },
              ]}
            >
              <Scan
                size={36}
                color={faceEnrolled ? '#FFFFFF' : colors.textPublic.muted}
                strokeWidth={1.5}
              />
            </View>
            {faceEnrolled && (
              <View style={styles.enrolledBadge}>
                <Text style={styles.enrolledBadgeText}>✓</Text>
              </View>
            )}
          </View>

          {/* Status row */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status</Text>
            <View style={[styles.badge, faceEnrolled ? styles.badgeGreen : styles.badgeAmber]}>
              <Text style={[styles.badgeText, faceEnrolled ? styles.badgeTextGreen : styles.badgeTextAmber]}>
                {faceEnrolled ? 'Enrolled' : 'Not Enrolled'}
              </Text>
            </View>
          </View>

          <View style={styles.rowDivider} />

          {/* SDK Mode row */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>SDK Mode</Text>
            <View style={styles.badgeGrey}>
              <Text style={styles.badgeTextGrey}>{sdkMode}</Text>
            </View>
          </View>

          <View style={styles.rowDivider} />

          {/* Recognition row */}
          <View style={[styles.infoRow, styles.infoRowLast]}>
            <Text style={styles.infoLabel}>Recognition</Text>
            <Text style={[styles.infoValue, isReady ? styles.infoValueActive : styles.infoValueUnavailable]}>
              {isReady ? 'Active' : 'Unavailable'}
            </Text>
          </View>
        </View>

        {/* CTA section */}
        <View style={styles.ctaSection}>
          {faceEnrolled ? (
            <>
              <Text style={styles.ctaHeading}>Your face is your ticket</Text>
              <Text style={styles.ctaSubtext}>
                You can walk into any ComfyTag event using face recognition. No QR needed.
              </Text>
              <AnimatedPressable
                style={styles.outlinedButton}
                onPress={() => navigation.navigate('FaceEnrollment')}
                hapticStyle="medium"
              >
                <Text style={styles.outlinedButtonText}>Re-enroll Face</Text>
              </AnimatedPressable>
            </>
          ) : (
            <>
              <Text style={styles.ctaHeading}>Set up face entry</Text>
              <Text style={styles.ctaSubtext}>
                Enroll once, get in everywhere. Skip queues at every ComfyTag event.
              </Text>
              <AnimatedPressable
                style={styles.filledButton}
                onPress={() => navigation.navigate('FaceEnrollment')}
                hapticStyle="medium"
              >
                <Text style={styles.filledButtonText}>Enroll My Face</Text>
              </AnimatedPressable>
            </>
          )}
        </View>

        {/* Trust footer */}
        <Text style={styles.trustFooter}>
          🔒 Face data is encrypted and stored locally. Never shared.
        </Text>
      </ScrollView>
    </SafeAreaView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.public.bg,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sp[4],
    paddingTop: sp[2],
    paddingBottom: sp[3],
    backgroundColor: colors.public.bg,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: fs.base,
    fontWeight: '700',
    color: colors.textPublic.primary,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 44,
  },

  // ── Scroll ────────────────────────────────────────────────────────────────
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: sp[4],
    paddingTop: sp[4],
    paddingBottom: sp[8],
    alignItems: 'center',
  },

  // ── Status card ───────────────────────────────────────────────────────────
  card: {
    width: '100%',
    backgroundColor: colors.public.surface,
    borderRadius: rd.xl,
    padding: sp[5],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.public.border,
  },
  statusCard: {
    marginBottom: sp[6],
    alignItems: 'stretch',
  },

  // ── Icon wrapper ──────────────────────────────────────────────────────────
  iconWrapper: {
    alignSelf: 'center',
    marginBottom: sp[6],
    position: 'relative',
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: rd.full,
    backgroundColor: colors.brand.DEFAULT,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: rd.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enrolledBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: rd.full,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.public.surface,
  },
  enrolledBadgeText: {
    fontSize: fs.xs,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ── Info rows ─────────────────────────────────────────────────────────────
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: sp[3],
  },
  infoRowLast: {
    paddingBottom: 0,
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.public.border,
  },
  infoLabel: {
    fontSize: fs.sm,
    color: colors.textPublic.muted,
  },
  infoValue: {
    fontSize: fs.sm,
    fontWeight: '500',
  },
  infoValueActive: {
    color: colors.success.DEFAULT,
  },
  infoValueUnavailable: {
    color: colors.textPublic.muted,
  },

  // ── Badges ────────────────────────────────────────────────────────────────
  badge: {
    paddingHorizontal: sp[3],
    paddingVertical: 4,
    borderRadius: rd.full,
  },
  badgeText: {
    fontSize: fs.xs,
    fontWeight: '600',
  },
  badgeGreen: {
    backgroundColor: 'rgba(16,185,129,0.15)',
  },
  badgeTextGreen: {
    color: colors.success.DEFAULT,
  },
  badgeAmber: {
    backgroundColor: 'rgba(245,158,11,0.15)',
  },
  badgeTextAmber: {
    color: '#D97706',
  },
  badgeGrey: {
    paddingHorizontal: sp[3],
    paddingVertical: 4,
    borderRadius: rd.full,
    backgroundColor: colors.public.surfaceAlt,
  },
  badgeTextGrey: {
    fontSize: fs.xs,
    fontWeight: '600',
    color: colors.textPublic.secondary,
  },

  // ── CTA section ───────────────────────────────────────────────────────────
  ctaSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: sp[6],
    gap: sp[3],
  },
  ctaHeading: {
    fontSize: fs.lg,
    fontWeight: '700',
    color: colors.textPublic.primary,
    textAlign: 'center',
  },
  ctaSubtext: {
    fontSize: fs.sm,
    color: colors.textPublic.muted,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: sp[2],
  },
  filledButton: {
    height: 48,
    paddingHorizontal: sp[8],
    borderRadius: rd.xl,
    backgroundColor: colors.brand.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: sp[2],
    minWidth: 200,
  },
  filledButtonText: {
    fontSize: fs.base,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  outlinedButton: {
    height: 48,
    paddingHorizontal: sp[8],
    borderRadius: rd.xl,
    borderWidth: 1.5,
    borderColor: colors.brand.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: sp[2],
    minWidth: 200,
  },
  outlinedButtonText: {
    fontSize: fs.base,
    fontWeight: '600',
    color: colors.brand.DEFAULT,
  },

  // ── Trust footer ──────────────────────────────────────────────────────────
  trustFooter: {
    fontSize: fs.xs,
    color: colors.textPublic.muted,
    textAlign: 'center',
    paddingHorizontal: sp[4],
    marginTop: sp[2],
  },

  // ── Centered (loading / error) ────────────────────────────────────────────
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: sp[4],
  },
  errorText: {
    fontSize: fs.base,
    color: colors.textPublic.secondary,
    textAlign: 'center',
  },
  retryPressable: {
    paddingHorizontal: sp[6],
    paddingVertical: sp[3],
  },
  retryText: {
    fontSize: fs.sm,
    fontWeight: '600',
    color: colors.brand.DEFAULT,
  },
})
