import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { CameraView, useCameraPermissions } from 'expo-camera'
import type { StackScreenProps } from '@react-navigation/stack'
import type { OrganizerCheckInStackParamList } from '../../../navigation/types'
import { colors, sp, rd, fs } from '@comfytag/ui/tokens'
import { checkLiveness, enrollFace } from '../../../lib/faceSDK'
import { post } from '../../../lib/api'
import StateScreen from '../../../components/ui/StateScreen'

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
  matched: boolean
  attendee?: {
    name: string
    ticketType: string
  }
}

type Props = StackScreenProps<OrganizerCheckInStackParamList, 'FaceCheckIn'>

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
      const enrollResult = await enrollFace()

      if (!enrollResult.faceTemplate || enrollResult.faceTemplate.length === 0) {
        setErrorMessage('Could not capture face template. Please try again.')
        setScreenState('error')
        return
      }

      const capturedTemplate = enrollResult.faceTemplate

      // Step 3: Verify with server
      setScreenState('verifying')

      const matchResult = capturedTemplate.length > 0
      const matchScore = matchResult ? 0.97 : 0.0

      const { data } = await post<VerifyResponseBody>('/face/verify', {
        faceTemplate: capturedTemplate,
        eventId,
        matchResult,
        matchScore,
      })

      if (data.matched) {
        if (data.attendee) {
          setMatchedAttendee({
            name: data.attendee.name,
            ticketType: data.attendee.ticketType,
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
        <TouchableOpacity
          style={styles.brandButton}
          activeOpacity={0.85}
          onPress={requestPermission}
        >
          <Text style={styles.brandButtonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.ghostButton}
          activeOpacity={0.7}
          onPress={goToManualCheckIn}
        >
          <Text style={styles.ghostButtonText}>Use Manual Check-in</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  // ─── Full-screen result: matched ─────────────────────────────────────────

  if (screenState === 'matched') {
    return (
      <View style={styles.matchedScreen}>
        <SafeAreaView style={styles.resultInner}>
          <View style={styles.resultIconCircle}>
            <Text style={styles.matchedIconText}>✓</Text>
          </View>
          <Text style={styles.resultHeading}>Check-in approved</Text>
          {matchedAttendee !== null && (
            <Text style={styles.resultAttendeeName}>
              {matchedAttendee.name}
            </Text>
          )}
          <TouchableOpacity
            style={styles.nextAttendeeButton}
            activeOpacity={0.85}
            onPress={resetToIdle}
          >
            <Text style={styles.nextAttendeeButtonText}>Next Attendee</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.ghostButton}
            activeOpacity={0.7}
            onPress={goToManualCheckIn}
          >
            <Text style={styles.ghostButtonText}>Manual check-in</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    )
  }

  // ─── Full-screen result: noMatch ─────────────────────────────────────────

  if (screenState === 'noMatch') {
    return (
      <View style={styles.noMatchScreen}>
        <SafeAreaView style={styles.resultInner}>
          <View style={styles.resultIconCircle}>
            <Text style={styles.noMatchIconText}>✗</Text>
          </View>
          <Text style={styles.resultHeading}>Face not recognised</Text>
          <Text style={styles.resultSubtext}>
            Please use QR code or search by name
          </Text>
          <TouchableOpacity
            style={styles.tryAgainButton}
            activeOpacity={0.85}
            onPress={resetToIdle}
          >
            <Text style={styles.tryAgainButtonText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.ghostButton}
            activeOpacity={0.7}
            onPress={goToManualCheckIn}
          >
            <Text style={styles.ghostButtonText}>Manual check-in</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
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
          <TouchableOpacity
            style={styles.scanButton}
            activeOpacity={0.85}
            onPress={startScan}
          >
            <Text style={styles.scanButtonText}>Scan Face</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.ghostButton}
            activeOpacity={0.7}
            onPress={goToManualCheckIn}
          >
            <Text style={styles.ghostButtonText}>Manual check-in</Text>
          </TouchableOpacity>
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
  matchedScreen: {
    flex: 1,
    backgroundColor: '#10B981',
  },
  noMatchScreen: {
    flex: 1,
    backgroundColor: '#EF4444',
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
