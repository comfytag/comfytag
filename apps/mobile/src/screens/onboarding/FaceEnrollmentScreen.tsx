import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { StackNavigationProp } from '@react-navigation/stack'
import { ChevronLeft, Lightbulb, CircleOff, Lock, ShieldCheck } from 'lucide-react-native'
import { enrollFace, checkLiveness } from '../../lib/faceSDK'
import { post } from '../../lib/api'
import { useAuthStore } from '../../store'
import { colors, rd } from '@comfytag/ui/tokens'
import { AnimatedPressable } from '../../components/ui/AnimatedPressable'
import type { ProfileStackParamList } from '../../navigation/types'

interface EnrollFaceResponse {
  message: string
  faceEnrolled: true
  faceEnrolledAt: string
}

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const CIRCLE_SIZE = SCREEN_WIDTH * 0.72

type EnrollmentState =
  | 'idle'
  | 'scanning'
  | 'processing'
  | 'success'
  | 'error'

interface Props {
  navigation?: StackNavigationProp<ProfileStackParamList, 'FaceEnrollment'>
  route?: {
    params?: {
      mode?: 'onboarding' | 'transfer'
      ticketId?: string
      onComplete?: () => void
    }
  }
  onEnrollmentComplete?: (faceTemplate: string) => void
  onSkip?: () => void
}

export default function FaceEnrollmentScreen({
  navigation,
  route,
  onEnrollmentComplete,
  onSkip,
}: Props) {
  const mode = route?.params?.mode ?? 'onboarding'
  const isTransferMode = mode === 'transfer'

  const [enrollmentState, setEnrollmentState] =
    useState<EnrollmentState>('idle')
  const [instruction, setInstruction] =
    useState('Position your face in the circle')
  const [errorMessage, setErrorMessage] = useState('')

  // Pulse + border-color animation — runs during scanning state
  const pulseAnim = useRef(new Animated.Value(1)).current
  const ringOpacityAnim = useRef(new Animated.Value(0.5)).current
  const frameColorAnim = useRef(new Animated.Value(0)).current
  const successScaleAnim = useRef(new Animated.Value(0.8)).current

  useEffect(() => {
    if (enrollmentState === 'scanning') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.03,
            duration: 750,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 750,
            useNativeDriver: true,
          }),
        ])
      )
      pulse.start()

      const ring = Animated.loop(
        Animated.sequence([
          Animated.timing(ringOpacityAnim, {
            toValue: 0,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(ringOpacityAnim, {
            toValue: 0.5,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      )
      ring.start()

      Animated.timing(frameColorAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: false,
      }).start()

      return () => {
        pulse.stop()
        ring.stop()
      }
    }
  }, [enrollmentState])

  useEffect(() => {
    if (enrollmentState === 'success') {
      Animated.spring(successScaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 100,
        useNativeDriver: true,
      }).start()
    }
  }, [enrollmentState])

  const frameBorderColor = frameColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.public.border, colors.brand.DEFAULT],
  })

  const startEnrollment = async () => {
    try {
      setEnrollmentState('scanning')
      setInstruction('Hold still and look at the camera')

      const livenessResult = await checkLiveness()

      if (!livenessResult.isLive) {
        setEnrollmentState('error')
        setErrorMessage(
          'Liveness check failed. Please ensure good lighting ' +
          'and remove sunglasses.'
        )
        return
      }

      setInstruction('Almost done...')
      setEnrollmentState('processing')

      const enrollResult = await enrollFace()

      if (!enrollResult.success || !enrollResult.faceTemplate) {
        setEnrollmentState('error')
        setErrorMessage(
          enrollResult.error ??
          'Enrollment failed. Please try again in better lighting.'
        )
        return
      }

      // Persist the template server-side — without this the capture above
      // never leaves the device and `user.faceEnrolled` never becomes true.
      const user = useAuthStore.getState().user
      if (user === null) {
        setEnrollmentState('error')
        setErrorMessage('You must be logged in to enroll your face.')
        return
      }
      try {
        const res = await post<EnrollFaceResponse>(
          `/face/enroll/${user._id}`,
          { faceTemplate: enrollResult.faceTemplate, deviceId: Platform.OS }
        )
        useAuthStore.getState().updateUser({
          faceEnrolled: true,
          faceEnrolledAt: res.data.faceEnrolledAt,
        })
      } catch {
        setEnrollmentState('error')
        setErrorMessage(
          'Your face was captured, but we could not save it. Please check your connection and try again.'
        )
        return
      }

      setEnrollmentState('success')
      setInstruction("You're all set!")

      setTimeout(() => {
        onEnrollmentComplete?.(enrollResult.faceTemplate!)
        if (navigation?.canGoBack()) {
          navigation.goBack()
        }
      }, 1800)

    } catch {
      setEnrollmentState('error')
      setErrorMessage('Something went wrong. Please try again.')
    }
  }

  const retry = () => {
    setEnrollmentState('idle')
    setInstruction('Position your face in the circle')
    setErrorMessage('')
    pulseAnim.setValue(1)
    ringOpacityAnim.setValue(0.5)
    frameColorAnim.setValue(0)
    successScaleAnim.setValue(0.8)
  }

  const handleSkip = () => {
    if (isTransferMode) {
      Alert.alert(
        'Face Required',
        'You must enroll your face to accept this ticket. ' +
        'Your face becomes your entry pass.',
        [{ text: 'OK' }]
      )
      return
    }
    onSkip?.()
  }

  const handleBack = () => {
    if (navigation?.canGoBack()) {
      navigation.goBack()
    }
  }

  // ─── Render helpers ───────────────────────────────

  const statusLabel = (): string => {
    switch (enrollmentState) {
      case 'scanning':
        return 'Scanning'
      case 'processing':
        return 'Processing'
      case 'success':
        return 'Enrolled'
      case 'error':
        return 'Try again'
      default:
        return 'Ready'
    }
  }

  const renderCircle = () => {
    const isScanning = enrollmentState === 'scanning'
    const isSuccess = enrollmentState === 'success'
    const isError = enrollmentState === 'error'

    const staticBorderColor = isSuccess
      ? colors.success.DEFAULT
      : isError
      ? colors.error.DEFAULT
      : colors.public.border

    return (
      <View style={styles.circleContainer}>
        {/* Decorative outer ring */}
        <View style={styles.outerRing} />

        {/* Pulse ring — scanning only */}
        {isScanning && (
          <Animated.View
            style={[styles.pulseRing, { opacity: ringOpacityAnim }]}
          />
        )}

        {/* Main circular preview */}
        <Animated.View
          style={[
            styles.circle,
            {
              transform: [{ scale: pulseAnim }],
              borderColor: isScanning ? frameBorderColor : staticBorderColor,
            },
          ]}
        >
          <View style={styles.cameraPlaceholder}>
            {enrollmentState === 'processing' && (
              <ActivityIndicator size="large" color={colors.brand.DEFAULT} />
            )}
            {enrollmentState === 'success' && (
              <Animated.View
                style={[
                  styles.successIcon,
                  { transform: [{ scale: successScaleAnim }] },
                ]}
              >
                <Text style={styles.successCheckmark}>✓</Text>
              </Animated.View>
            )}
          </View>
        </Animated.View>

        {/* Status pill */}
        <View style={styles.statusPill}>
          <View style={styles.statusDot} />
          <Text style={styles.statusPillText}>{statusLabel()}</Text>
        </View>
      </View>
    )
  }

  const renderTips = () => {
    if (enrollmentState !== 'idle') {
      return (
        <View style={styles.instructionContainer}>
          <Text style={styles.instructionText}>{instruction}</Text>
          {enrollmentState === 'scanning' && (
            <Text style={styles.subInstruction}>Blink slowly when prompted</Text>
          )}
          {enrollmentState === 'error' && (
            <Text style={styles.errorText}>{errorMessage}</Text>
          )}
        </View>
      )
    }

    return (
      <View style={styles.tipsContainer}>
        <View style={styles.tipRow}>
          <Lightbulb size={20} color={colors.brand.DEFAULT} strokeWidth={2} />
          <Text style={styles.tipText}>Face the camera clearly in a well-lit area</Text>
        </View>
        <View style={styles.tipRow}>
          <CircleOff size={20} color={colors.brand.DEFAULT} strokeWidth={2} />
          <Text style={styles.tipText}>Remove glasses or hats if necessary</Text>
        </View>
      </View>
    )
  }

  const renderAction = () => {
    switch (enrollmentState) {
      case 'idle':
        return (
          <AnimatedPressable
            style={styles.primaryButton}
            onPress={startEnrollment}
            hapticStyle="medium"
          >
            <Text style={styles.primaryButtonText}>Start enrollment</Text>
          </AnimatedPressable>
        )
      case 'scanning':
      case 'processing':
        return (
          <View style={styles.processingIndicator}>
            <ActivityIndicator size="small" color={colors.brand.DEFAULT} />
            <Text style={styles.processingText}>
              {enrollmentState === 'scanning' ? 'Scanning...' : 'Processing...'}
            </Text>
          </View>
        )
      case 'success':
        return (
          <View style={styles.successMessage}>
            <Text style={styles.successText}>Your face is your ticket 🎉</Text>
          </View>
        )
      case 'error':
        return (
          <AnimatedPressable
            style={styles.primaryButton}
            onPress={retry}
            hapticStyle="medium"
          >
            <Text style={styles.primaryButtonText}>Try Again</Text>
          </AnimatedPressable>
        )
    }
  }

  // ─── Main render ──────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <AnimatedPressable style={styles.backButton} onPress={handleBack} hapticStyle="light">
          <ChevronLeft size={22} color={colors.textPublic.primary} strokeWidth={2} />
        </AnimatedPressable>
      </View>

      <View style={styles.content}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>
            {isTransferMode ? 'Link Your Face to This Ticket' : 'Set up your face'}
          </Text>
          <Text style={styles.subtitle}>
            {isTransferMode
              ? 'Your face is required to accept and use this ticket'
              : 'Secure your tickets with facial biometric authentication.'}
          </Text>
        </View>

        {renderCircle()}
        {renderTips()}
      </View>

      <View style={styles.footer}>
        {renderAction()}

        {enrollmentState === 'idle' && !isTransferMode && (
          <AnimatedPressable style={styles.skipButton} onPress={handleSkip} hapticStyle="light">
            <Text style={styles.skipText}>Remind me later</Text>
          </AnimatedPressable>
        )}
      </View>

      {enrollmentState === 'idle' && (
        <View style={styles.trustBadges}>
          <View style={styles.trustBadge}>
            <Lock size={14} color={colors.textPublic.secondary} strokeWidth={2} />
            <Text style={styles.trustBadgeText}>ENCRYPTED</Text>
          </View>
          <View style={styles.trustBadgeDivider} />
          <View style={styles.trustBadge}>
            <ShieldCheck size={14} color={colors.textPublic.secondary} strokeWidth={2} />
            <Text style={styles.trustBadgeText}>GDPR COMPLIANT</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  )
}

// ─── Styles ───────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.public.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  titleBlock: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPublic.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textPublic.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  circleContainer: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 40,
  },
  outerRing: {
    position: 'absolute',
    width: CIRCLE_SIZE * 1.05,
    height: CIRCLE_SIZE * 1.05,
    borderRadius: (CIRCLE_SIZE * 1.05) / 2,
    borderWidth: 2,
    borderColor: 'rgba(124, 58, 237, 0.2)',
  },
  pulseRing: {
    position: 'absolute',
    width: CIRCLE_SIZE * 1.1,
    height: CIRCLE_SIZE * 1.1,
    borderRadius: (CIRCLE_SIZE * 1.1) / 2,
    borderWidth: 2,
    borderColor: colors.brand.DEFAULT,
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 3,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.public.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.success.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successCheckmark: {
    fontSize: 36,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  statusPill: {
    position: 'absolute',
    bottom: -16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.public.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: rd.full,
    borderWidth: 1,
    borderColor: colors.public.border,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brand.DEFAULT,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.textPublic.secondary,
  },
  tipsContainer: {
    width: '100%',
    gap: 12,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.public.surfaceAlt,
    borderRadius: rd.xl,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: colors.textPublic.primary,
  },
  instructionContainer: {
    alignItems: 'center',
    minHeight: 48,
  },
  instructionText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPublic.primary,
    textAlign: 'center',
  },
  subInstruction: {
    fontSize: 13,
    color: colors.textPublic.secondary,
    textAlign: 'center',
    marginTop: 6,
  },
  errorText: {
    fontSize: 13,
    color: colors.error.DEFAULT,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  footer: {
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 8,
    alignItems: 'center',
    gap: 12,
  },
  primaryButton: {
    width: '100%',
    height: 56,
    backgroundColor: colors.brand.DEFAULT,
    borderRadius: rd.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPublic.onBrand,
  },
  processingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 56,
  },
  processingText: {
    fontSize: 15,
    color: colors.textPublic.secondary,
  },
  successMessage: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.success.DEFAULT,
  },
  skipButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  skipText: {
    fontSize: 14,
    color: colors.textPublic.secondary,
  },
  trustBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingBottom: 20,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trustBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: colors.textPublic.secondary,
  },
  trustBadgeDivider: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.textPublic.secondary,
  },
})
