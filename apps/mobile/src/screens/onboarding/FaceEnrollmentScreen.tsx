import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { enrollFace, checkLiveness } from '../../lib/faceSDK'
import { colors } from '@comfytag/ui/tokens'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } =
  Dimensions.get('window')
const OVAL_WIDTH = SCREEN_WIDTH * 0.72
const OVAL_HEIGHT = OVAL_WIDTH * 1.35

type EnrollmentState =
  | 'idle'
  | 'scanning'
  | 'processing'
  | 'success'
  | 'error'

interface Props {
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
  route,
  onEnrollmentComplete,
  onSkip,
}: Props) {
  const mode = route?.params?.mode ?? 'onboarding'
  const isTransferMode = mode === 'transfer'

  const [enrollmentState, setEnrollmentState] =
    useState<EnrollmentState>('idle')
  const [instruction, setInstruction] =
    useState('Position your face in the oval')
  const [errorMessage, setErrorMessage] = useState('')

  // Oval pulse animation
  const pulseAnim = useRef(new Animated.Value(1)).current
  const ovalColorAnim = useRef(new Animated.Value(0)).current
  const successScaleAnim = useRef(new Animated.Value(0.8)).current
  const fadeAnim = useRef(new Animated.Value(1)).current

  // Pulse animation — runs during scanning state
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

      // Animate oval border from grey to brand purple
      Animated.timing(ovalColorAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: false,
      }).start()

      return () => pulse.stop()
    }
  }, [enrollmentState])

  // Success animation
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

  const ovalBorderColor = ovalColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#3D3D3D', colors.brand.DEFAULT],
  })

  const startEnrollment = async () => {
    try {
      setEnrollmentState('scanning')
      setInstruction('Hold still and look at the camera')

      // Run liveness check first
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

      // Enroll face
      const enrollResult = await enrollFace()

      if (!enrollResult.success || !enrollResult.faceTemplate) {
        setEnrollmentState('error')
        setErrorMessage(
          enrollResult.error ??
          'Enrollment failed. Please try again in better lighting.'
        )
        return
      }

      setEnrollmentState('success')
      setInstruction("You're all set!")

      // Notify parent after short success display
      setTimeout(() => {
        onEnrollmentComplete?.(enrollResult.faceTemplate!)
      }, 1800)

    } catch (err) {
      setEnrollmentState('error')
      setErrorMessage('Something went wrong. Please try again.')
    }
  }

  const retry = () => {
    setEnrollmentState('idle')
    setInstruction('Position your face in the oval')
    setErrorMessage('')
    pulseAnim.setValue(1)
    ovalColorAnim.setValue(0)
    successScaleAnim.setValue(0.8)
  }

  const handleSkip = () => {
    if (isTransferMode) {
      // Cannot skip face enrollment on ticket transfer
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

  // ─── Render helpers ───────────────────────────────

  const renderOval = () => {
    const isScanning = enrollmentState === 'scanning'
    const isSuccess = enrollmentState === 'success'
    const isError = enrollmentState === 'error'

    const borderColor = isSuccess
      ? colors.mobile.success
      : isError
      ? colors.mobile.error
      : isScanning
      ? undefined // controlled by animation
      : '#3D3D3D'

    return (
      <View style={styles.ovalContainer}>
        <Animated.View
          style={[
            styles.oval,
            {
              transform: [{ scale: pulseAnim }],
              borderColor: isScanning
                ? ovalBorderColor
                : borderColor,
            },
          ]}
        >
          {/* Camera preview placeholder */}
          {/* In production: replace View with
              CameraView from expo-camera */}
          <View style={styles.cameraPlaceholder}>
            {enrollmentState === 'processing' && (
              <ActivityIndicator
                size="large"
                color="#7C3AED"
              />
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

        {/* Corner guide dots */}
        {(['topLeft', 'topRight', 'bottomLeft', 'bottomRight'] as const)
          .map(pos => (
            <View
              key={pos}
              style={[styles.cornerDot, styles[pos]]}
            />
          ))
        }
      </View>
    )
  }

  const renderInstruction = () => (
    <View style={styles.instructionContainer}>
      <Text style={styles.instructionText}>{instruction}</Text>
      {enrollmentState === 'scanning' && (
        <Text style={styles.subInstruction}>
          Blink slowly when prompted
        </Text>
      )}
      {enrollmentState === 'error' && (
        <Text style={styles.errorText}>{errorMessage}</Text>
      )}
    </View>
  )

  const renderAction = () => {
    switch (enrollmentState) {
      case 'idle':
        return (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={startEnrollment}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>
              Start Face Enrollment
            </Text>
          </TouchableOpacity>
        )
      case 'scanning':
      case 'processing':
        return (
          <View style={styles.processingIndicator}>
            <ActivityIndicator size="small" color="#7C3AED" />
            <Text style={styles.processingText}>
              {enrollmentState === 'scanning'
                ? 'Scanning...'
                : 'Processing...'}
            </Text>
          </View>
        )
      case 'success':
        return (
          <View style={styles.successMessage}>
            <Text style={styles.successText}>
              Your face is your ticket 🎉
            </Text>
          </View>
        )
      case 'error':
        return (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={retry}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>
              Try Again
            </Text>
          </TouchableOpacity>
        )
    }
  }

  // ─── Main render ──────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          {isTransferMode
            ? 'Link Your Face to This Ticket'
            : 'Set Up Face Entry'}
        </Text>
        <Text style={styles.subtitle}>
          {isTransferMode
            ? 'Your face is required to accept and use this ticket'
            : 'Skip queues at every event. Your face is your pass.'}
        </Text>
      </View>

      {/* Oval camera view */}
      {renderOval()}

      {/* Instruction text */}
      {renderInstruction()}

      {/* Action button */}
      <View style={styles.actionContainer}>
        {renderAction()}

        {/* Skip — only in onboarding mode */}
        {enrollmentState === 'idle' && !isTransferMode && (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            activeOpacity={0.7}
          >
            <Text style={styles.skipText}>
              Skip for now
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Trust signal footer */}
      {enrollmentState === 'idle' && (
        <View style={styles.trustFooter}>
          <Text style={styles.trustText}>
            🔒 Your face data is encrypted and stored
            securely on your device. Never shared.
          </Text>
        </View>
      )}

    </SafeAreaView>
  )
}

// ─── Styles ───────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 32,
    paddingTop: 24,
    paddingBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F5F5F4',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: '#A8A29E',
    textAlign: 'center',
    lineHeight: 22,
  },
  ovalContainer: {
    width: OVAL_WIDTH + 24,
    height: OVAL_HEIGHT + 24,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  oval: {
    width: OVAL_WIDTH,
    height: OVAL_HEIGHT,
    borderRadius: OVAL_WIDTH / 2,
    borderWidth: 2.5,
    borderColor: '#3D3D3D',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cornerDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brand.DEFAULT,
  },
  topLeft: { top: 12, left: 12 },
  topRight: { top: 12, right: 12 },
  bottomLeft: { bottom: 12, left: 12 },
  bottomRight: { bottom: 12, right: 12 },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.mobile.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successCheckmark: {
    fontSize: 36,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  instructionContainer: {
    paddingHorizontal: 32,
    paddingTop: 24,
    alignItems: 'center',
    minHeight: 64,
  },
  instructionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#F5F5F4',
    textAlign: 'center',
  },
  subInstruction: {
    fontSize: 13,
    color: '#78716C',
    textAlign: 'center',
    marginTop: 6,
  },
  errorText: {
    fontSize: 13,
    color: colors.mobile.error,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  actionContainer: {
    width: '100%',
    paddingHorizontal: 32,
    paddingTop: 32,
    alignItems: 'center',
    gap: 16,
  },
  primaryButton: {
    width: '100%',
    height: 52,
    backgroundColor: colors.brand.DEFAULT,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  processingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 52,
  },
  processingText: {
    fontSize: 15,
    color: '#A8A29E',
  },
  successMessage: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.mobile.success,
  },
  skipButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  skipText: {
    fontSize: 14,
    color: '#78716C',
    textDecorationLine: 'underline',
  },
  trustFooter: {
    position: 'absolute',
    bottom: 32,
    paddingHorizontal: 40,
  },
  trustText: {
    fontSize: 12,
    color: '#78716C',
    textAlign: 'center',
    lineHeight: 18,
  },
})
