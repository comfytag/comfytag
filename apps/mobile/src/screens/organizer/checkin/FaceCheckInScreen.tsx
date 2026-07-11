import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  AccessibilityInfo,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { CameraView, useCameraPermissions } from 'expo-camera'
import type { StackScreenProps } from '@react-navigation/stack'
import type { OrganizerCheckInStackParamList } from '../../../navigation/types'
import { colors, sp, rd, fs } from '@comfytag/ui/tokens'
import { checkLiveness, enrollFace } from '../../../lib/faceSDK'
import { post } from '../../../lib/api'
import StateScreen from '../../../components/ui/StateScreen'
import { AnimatedPressable } from '../../../components/ui/AnimatedPressable'

// ─── Constants ────────────────────────────────────────────────────────────────

const OVAL_WIDTH = 260
const OVAL_HEIGHT = 340
const OVAL_BORDER_RADIUS = 130

const MATCH_AUTO_DISMISS_MS = 4000

// ─── Types ────────────────────────────────────────────────────────────────────

type ScreenState =
  | 'idle'
  | 'liveness'
  | 'capturing'
  | 'verifying'
  | 'matched'
  | 'noMatch'
  | 'error'

interface MatchedAttendee {
  name: string
  ticketType: string
}

interface VerifyResponseBody {
  success: boolean
  message: string
  attendeeName?: string
  ticketType?: string
}

type Props = StackScreenProps<OrganizerCheckInStackParamList, 'FaceCheckIn'>

// ─── Result flash overlay (matched / noMatch) ──────────────────────────────────
// Cross-fades + scale-pops the full-screen result colour over a neutral base
// instead of hard-swapping backgroundColor instantly. Mirrors AnimatedPressable's
// useNativeDriver pattern for consistency. See design.md "check-in flash" spec:
// scale 0.8 -> 1.05 -> 1.0 + opacity fade, ~200ms total, readable at arm's length
// in a dark venue.

interface ResultFlashProps {
  kind: 'matched' | 'noMatch'
  icon: string
  heading: string
  subtext?: string
  attendeeName?: string
  primaryLabel: string
  onPrimary: () => void
  onSecondary: () => void
}

function ResultFlash({
  kind,
  icon,
  heading,
  subtext,
  attendeeName,
  primaryLabel,
  onPrimary,
  onSecondary,
}: ResultFlashProps) {
  const opacity = useRef(new Animated.Value(0)).current
  const scale = useRef(new Animated.Value(0.8)).current

  useEffect(() => {
    let cancelled = false

    const runAnimation = async (): Promise<void> => {
      const reduceMotionEnabled = await AccessibilityInfo.isReduceMotionEnabled()
      if (cancelled) return

      if (reduceMotionEnabled) {
        // Respect OS-level Reduce Motion: show the result instantly, no motion.
        opacity.setValue(1)
        scale.setValue(1)
        return
      }

      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.05,
            duration: 130,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 70,
            useNativeDriver: true,
          }),
        ]),
      ]).start()
    }

    void runAnimation()

    return () => {
      cancelled = true
    }
    // Empty-ish deps are fine here: this component is freshly mounted every
    // time the parent screen enters the matched/noMatch state (early-return
    // conditional rendering), so this effect naturally re-plays each time.
  }, [opacity, scale])

  const overlayColorStyle =
    kind === 'matched' ? styles.matchedOverlay : styles.noMatchOverlay
  const iconTextStyle =
    kind === 'matched' ? styles.matchedIconText : styles.noMatchIconText
  const primaryButtonStyle =
    kind === 'matched' ? styles.nextAttendeeButton : styles.tryAgainButton
  const primaryTextStyle =
    kind === 'matched' ? styles.nextAttendeeButtonText : styles.tryAgainButtonText

  return (
    <View style={styles.resultScreen}>
      <Animated.View
        style={[
          styles.resultOverlay,
          overlayColorStyle,
          { opacity, transform: [{ scale }] },
        ]}
        pointerEvents="none"
      />
      <SafeAreaView style={styles.resultInner}>
        <View style={styles.resultIconCircle}>
          <Text style={iconTextStyle}>{icon}</Text>
        </View>
        <Text style={styles.resultHeading}>{heading}</Text>
        {attendeeName !== undefined && (
          <Text style={styles.resultAttendeeName}>{attendeeName}</Text>
        )}
        {subtext !== undefined && (
          <Text style={styles.resultSubtext}>{subtext}</Text>
        )}
        <AnimatedPressable
          style={primaryButtonStyle}
          hapticStyle="medium"
          onPress={onPrimary}
        >
          <Text style={primaryTextStyle}>{primaryLabel}</Text>
        </AnimatedPressable>
        <AnimatedPressable
          style={styles.ghostButton}
          hapticStyle="light"
          onPress={onSecondary}
        >
          <Text style={styles.ghostButtonText}>Manual check-in</Text>
        </AnimatedPressable>
      </SafeAreaView>
    </View>
  )
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function FaceCheckInScreen({ navigation, route }: Props) {
  const eventId: string = route.params.eventId

  const [permission, requestPermission] = useCameraPermissions()
  const [screenState, setScreenState] = useState<ScreenState>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [matchedAttendee, setMatchedAttendee] =
    useState<MatchedAttendee | null>(null)

  // Holds the auto-dismiss timer so "Next Attendee" can cancel it.
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ─── Auto-dismiss on matched ──────────────────────────────────────────────

  useEffect(() => {
    if (screenState === 'matched') {
      dismissTimerRef.current = setTimeout(() => {
        setScreenState('idle')
        setMatchedAttendee(null)
      }, MATCH_AUTO_DISMISS_MS)
    }

    return () => {
      if (dismissTimerRef.current !== null) {
        clearTimeout(dismissTimerRef.current)
        dismissTimerRef.current = null
      }
    }
  }, [screenState])

  // ─── Check-in flow ────────────────────────────────────────────────────────

  const startScan = async (): Promise<void> => {
    try {
      // Step 1: Liveness check
      setScreenState('liveness')
      const livenessResult = await checkLiveness()

      if (!livenessResult.isLive) {
        setScreenState('noMatch')
        setErrorMessage('Liveness check failed')
        return
      }

      // Step 2: Capture face template
      setScreenState('capturing')
      const captureResult = await enrollFace()

      if (!captureResult.faceTemplate || captureResult.faceTemplate.length === 0) {
        setErrorMessage('Could not capture face template. Please try again.')
        setScreenState('error')
        return
      }

      // Step 3: Identify against enrolled attendees — the server searches
      // every face-linked ticket for this event and does the comparison;
      // the client never decides the match itself.
      setScreenState('verifying')

      const { data } = await post<VerifyResponseBody>('/face/verify', {
        faceTemplate: captureResult.faceTemplate,
        eventId,
      })

      if (data.success) {
        if (data.attendeeName) {
          setMatchedAttendee({
            name: data.attendeeName,
            ticketType: data.ticketType ?? '',
          })
        }
        setScreenState('matched')
      } else {
        setScreenState('noMatch')
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong.'
      setErrorMessage(message)
      setScreenState('error')
    }
  }

  const resetToIdle = (): void => {
    if (dismissTimerRef.current !== null) {
      clearTimeout(dismissTimerRef.current)
      dismissTimerRef.current = null
    }
    setScreenState('idle')
    setMatchedAttendee(null)
    setErrorMessage('')
  }

  const goToManualCheckIn = (): void => {
    navigation.navigate('ManualCheckIn', {
      eventId: route.params.eventId,
      eventName: route.params.eventName,
    })
  }

  // ─── Camera permission gate ───────────────────────────────────────────────

  if (!permission) {
    // Permissions are still loading.
    return (
      <SafeAreaView style={styles.darkCentered}>
        <ActivityIndicator size="large" color={colors.brand.DEFAULT} />
      </SafeAreaView>
    )
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.darkCentered}>
        <Text style={styles.permissionTitle}>Camera access needed</Text>
        <Text style={styles.permissionSubtext}>
          The camera is required to scan attendee faces for check-in.
        </Text>
        <AnimatedPressable
          style={styles.brandButton}
          hapticStyle="medium"
          onPress={requestPermission}
        >
          <Text style={styles.brandButtonText}>Grant Permission</Text>
        </AnimatedPressable>
        <AnimatedPressable
          style={styles.ghostButton}
          hapticStyle="light"
          onPress={goToManualCheckIn}
        >
          <Text style={styles.ghostButtonText}>Use Manual Check-in</Text>
        </AnimatedPressable>
      </SafeAreaView>
    )
  }

  // ─── Full-screen result: matched ─────────────────────────────────────────
  // Cross-fades in via ResultFlash instead of an instant backgroundColor swap.

  if (screenState === 'matched') {
    return (
      <ResultFlash
        kind="matched"
        icon="✓"
        heading="Check-in approved"
        attendeeName={matchedAttendee !== null ? matchedAttendee.name : undefined}
        primaryLabel="Next Attendee"
        onPrimary={resetToIdle}
        onSecondary={goToManualCheckIn}
      />
    )
  }

  // ─── Full-screen result: noMatch ─────────────────────────────────────────
  // Cross-fades in via ResultFlash instead of an instant backgroundColor swap.

  if (screenState === 'noMatch') {
    return (
      <ResultFlash
        kind="noMatch"
        icon="✗"
        heading="Face not recognised"
        subtext="Please use QR code or search by name"
        primaryLabel="Try Again"
        onPrimary={resetToIdle}
        onSecondary={goToManualCheckIn}
      />
    )
  }

  // ─── Full-screen error state ──────────────────────────────────────────────

  if (screenState === 'error') {
    return (
      <StateScreen
        type="error"
        title="Something went wrong"
        subtitle={errorMessage}
        action={{ label: 'Try Again', onPress: resetToIdle }}
      />
    )
  }

  // ─── Verifying state (camera hidden) ─────────────────────────────────────

  if (screenState === 'verifying') {
    return (
      <StateScreen
        type="loading"
        title="Verifying..."
      />
    )
  }

  // ─── Camera states: idle / liveness / capturing ───────────────────────────
  // All three render the CameraView; liveness and capturing add an overlay.

  const isProcessing =
    screenState === 'liveness' || screenState === 'capturing'

  const processingLabel =
    screenState === 'liveness' ? 'Checking liveness...' : 'Capturing face...'

  return (
    <View style={styles.cameraContainer}>
      <CameraView style={styles.camera} facing="front" />

      {/* Dark edge vignette behind the oval cutout area */}
      <View style={styles.darkOverlay} pointerEvents="none" />

      {/* Oval guide */}
      <View style={styles.ovalWrapper} pointerEvents="none">
        <Text style={styles.ovalLabel}>Point at attendee's face</Text>
        <View style={styles.oval} />
      </View>

      {/* Processing overlay — liveness / capturing */}
      {isProcessing && (
        <View style={styles.processingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.processingLabel}>{processingLabel}</Text>
        </View>
      )}

      {/* Bottom action area */}
      {!isProcessing && (
        <SafeAreaView style={styles.bottomBar} edges={['bottom']}>
          <AnimatedPressable
            style={styles.scanButton}
            hapticStyle="medium"
            onPress={startScan}
          >
            <Text style={styles.scanButtonText}>Scan Face</Text>
          </AnimatedPressable>
          <AnimatedPressable
            style={styles.ghostButton}
            hapticStyle="light"
            onPress={goToManualCheckIn}
          >
            <Text style={styles.ghostButtonText}>Manual check-in</Text>
          </AnimatedPressable>
        </SafeAreaView>
      )}
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Dark centered layout (permissions, error, verifying) ───────────────────
  darkCentered: {
    flex: 1,
    backgroundColor: colors.mobile.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: sp[8],
  },

  // ── Camera layout ──────────────────────────────────────────────────────────
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },

  // ── Oval guide ─────────────────────────────────────────────────────────────
  ovalWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ovalLabel: {
    color: '#FFFFFF',
    fontSize: fs.sm,
    fontWeight: '500',
    marginBottom: sp[4],
    textAlign: 'center',
  },
  oval: {
    width: OVAL_WIDTH,
    height: OVAL_HEIGHT,
    borderRadius: OVAL_BORDER_RADIUS,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: 'transparent',
  },

  // ── Processing overlay (liveness / capturing) ──────────────────────────────
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingLabel: {
    color: '#FFFFFF',
    fontSize: fs.base,
    fontWeight: '500',
    marginTop: sp[4],
    textAlign: 'center',
  },

  // ── Bottom bar (idle state) ────────────────────────────────────────────────
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: sp[8],
    paddingBottom: sp[6],
    alignItems: 'center',
    gap: sp[3],
  },
  scanButton: {
    width: '100%',
    height: 52,
    backgroundColor: colors.brand.DEFAULT,
    borderRadius: rd.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanButtonText: {
    fontSize: fs.base,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // ── Ghost button (manual check-in, shared across states) ──────────────────
  ghostButton: {
    paddingVertical: sp[2],
    paddingHorizontal: sp[4],
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: sp[3],
  },
  ghostButtonText: {
    fontSize: fs.sm,
    color: 'rgba(255,255,255,0.60)',
    textAlign: 'center',
  },

  // ── Full-screen result screens ─────────────────────────────────────────────
  // Neutral base + an absolutely-positioned, animated colour overlay
  // (see ResultFlash) that fades/scales in rather than an instant swap.
  resultScreen: {
    flex: 1,
    backgroundColor: colors.mobile.bg,
  },
  resultOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  matchedOverlay: {
    backgroundColor: colors.mobile.success,
  },
  noMatchOverlay: {
    backgroundColor: colors.mobile.error,
  },
  resultInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: sp[8],
  },
  resultIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchedIconText: {
    fontSize: fs['2xl'],
    fontWeight: '700',
    color: colors.mobile.success,
  },
  noMatchIconText: {
    fontSize: fs['2xl'],
    fontWeight: '700',
    color: colors.mobile.error,
  },
  resultHeading: {
    fontSize: fs['2xl'],
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: sp[5],
  },
  resultAttendeeName: {
    fontSize: fs.lg,
    color: 'rgba(255,255,255,0.70)',
    textAlign: 'center',
    marginTop: sp[2],
  },
  resultSubtext: {
    fontSize: fs.sm,
    color: 'rgba(255,255,255,0.70)',
    textAlign: 'center',
    marginTop: sp[2],
    lineHeight: 20,
  },

  // ── Next Attendee button (matched state) ────────────────────────────────────
  nextAttendeeButton: {
    width: '100%',
    height: 52,
    backgroundColor: '#FFFFFF',
    borderRadius: rd.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: sp[8],
  },
  nextAttendeeButtonText: {
    fontSize: fs.base,
    fontWeight: '600',
    color: colors.mobile.success,
  },

  // ── Try Again button (noMatch state) ──────────────────────────────────────
  tryAgainButton: {
    width: '100%',
    height: 52,
    backgroundColor: '#FFFFFF',
    borderRadius: rd.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: sp[8],
  },
  tryAgainButtonText: {
    fontSize: fs.base,
    fontWeight: '600',
    color: colors.mobile.error,
  },

  brandButton: {
    width: '100%',
    height: 52,
    backgroundColor: colors.brand.DEFAULT,
    borderRadius: rd.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandButtonText: {
    fontSize: fs.base,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // ── Camera permission screen ───────────────────────────────────────────────
  permissionTitle: {
    fontSize: fs.xl,
    fontWeight: '700',
    color: colors.mobile.textPrimary,
    textAlign: 'center',
    marginBottom: sp[3],
  },
  permissionSubtext: {
    fontSize: fs.sm,
    color: colors.mobile.textSecondary,
    textAlign: 'center',
    marginBottom: sp[8],
    lineHeight: 20,
  },
})
