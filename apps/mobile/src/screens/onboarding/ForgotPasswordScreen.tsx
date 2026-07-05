import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { StackNavigationProp } from '@react-navigation/stack'
import { isValidNigerianPhone, isValidEmail, maskIdentifier } from '@comfytag/utils'
import { colors, sp, rd, fs } from '@comfytag/ui/tokens'
import { post } from '../../lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 'entry' | 'otp' | 'reset'

interface Props {
  navigation: StackNavigationProp<Record<string, object | undefined>>
}

// ─── Constants ────────────────────────────────────────────────────────────────

const OTP_LENGTH = 6
const RESEND_COOLDOWN_SECONDS = 60

// ─── Validation helper ────────────────────────────────────────────────────────

function isValidIdentifier(value: string): boolean {
  const v = value.trim()
  return isValidNigerianPhone(v) || isValidEmail(v)
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ForgotPasswordScreen({ navigation }: Props) {
  // ── Core state ──────────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>('entry')
  const [identifier, setIdentifier] = useState<string>('')
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [resetToken, setResetToken] = useState<string>('')
  const [newPassword, setNewPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [resendCooldown, setResendCooldown] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [identifierTouched, setIdentifierTouched] = useState<boolean>(false)
  const [passwordTouched, setPasswordTouched] = useState<boolean>(false)
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false)
  const [focusedOtpIndex, setFocusedOtpIndex] = useState<number>(-1)
  const [identifierFocused, setIdentifierFocused] = useState<boolean>(false)
  const [newPasswordFocused, setNewPasswordFocused] = useState<boolean>(false)
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState<boolean>(false)

  // ── OTP input refs ──────────────────────────────────────────────────────────
  const otpRefs = useRef<Array<TextInput | null>>(Array(OTP_LENGTH).fill(null))

  // ── Cooldown interval ───────────────────────────────────────────────────────
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startCooldown = useCallback((): void => {
    setResendCooldown(RESEND_COOLDOWN_SECONDS)
    if (cooldownRef.current !== null) {
      clearInterval(cooldownRef.current)
    }
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownRef.current !== null) {
            clearInterval(cooldownRef.current)
            cooldownRef.current = null
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  useEffect(() => {
    return () => {
      if (cooldownRef.current !== null) {
        clearInterval(cooldownRef.current)
      }
    }
  }, [])

  // ─── Derived ────────────────────────────────────────────────────────────────

  const identifierValid = isValidIdentifier(identifier)
  const identifierError =
    identifierTouched && identifier.length > 0 && !identifierValid
      ? 'Enter a valid Nigerian phone number (e.g. 08012345678) or email.'
      : ''

  const otpFilled = otp.every((d) => d.length === 1)
  const otpString = otp.join('')

  const passwordLengthOk = newPassword.length >= 8
  const passwordsMatch = newPassword === confirmPassword
  const passwordError = (() => {
    if (!passwordTouched) return ''
    if (newPassword.length > 0 && !passwordLengthOk) return 'Password must be at least 8 characters.'
    if (confirmPassword.length > 0 && !passwordsMatch) return 'Passwords do not match.'
    return ''
  })()

  const resetButtonDisabled =
    isLoading || newPassword.length < 8 || !passwordsMatch || confirmPassword.length === 0

  // ─── Step 1: Send OTP ────────────────────────────────────────────────────────

  const handleSendCode = async (): Promise<void> => {
    setIdentifierTouched(true)
    if (!identifierValid) return
    setErrorMessage('')
    setIsLoading(true)

    try {
      await post<{ message: string }>('/auth/forgot-password', {
        identifier: identifier.trim(),
      })
      startCooldown()
      setStep('otp')
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setIsLoading(false)
    }
  }

  // ─── Step 2: Verify OTP ──────────────────────────────────────────────────────

  const handleVerifyOtp = async (): Promise<void> => {
    if (!otpFilled) return
    setErrorMessage('')
    setIsLoading(true)

    try {
      const { data } = await post<{ resetToken: string }>('/auth/verify-otp', {
        identifier: identifier.trim(),
        otp: otpString,
      })
      setResetToken(data.resetToken)
      setStep('reset')
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setIsLoading(false)
    }
  }

  // ─── Step 2: Resend OTP ──────────────────────────────────────────────────────

  const handleResend = async (): Promise<void> => {
    if (resendCooldown > 0 || isLoading) return
    setErrorMessage('')
    setIsLoading(true)

    try {
      await post<{ message: string }>('/auth/forgot-password', {
        identifier: identifier.trim(),
      })
      setOtp(Array(OTP_LENGTH).fill(''))
      startCooldown()
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setIsLoading(false)
    }
  }

  // ─── Step 3: Reset Password ───────────────────────────────────────────────────

  const handleResetPassword = async (): Promise<void> => {
    setPasswordTouched(true)
    if (resetButtonDisabled) return
    setErrorMessage('')
    setIsLoading(true)

    try {
      await post<{ message: string }>('/auth/reset-password', {
        resetToken,
        password: newPassword,
      })

      Alert.alert('Success', 'Password reset! Please log in.', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Login'),
        },
      ])
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setIsLoading(false)
    }
  }

  // ─── OTP input handlers ───────────────────────────────────────────────────────

  const handleOtpChange = (text: string, index: number): void => {
    // Handle paste: if text length > 1, split across boxes
    if (text.length > 1) {
      const digits = text.replace(/\D/g, '').slice(0, OTP_LENGTH)
      const next = Array(OTP_LENGTH).fill('')
      for (let i = 0; i < digits.length; i++) {
        next[i] = digits[i]
      }
      setOtp(next)
      const focusTarget = Math.min(digits.length, OTP_LENGTH - 1)
      otpRefs.current[focusTarget]?.focus()
      return
    }

    // Single character input
    const digit = text.replace(/\D/g, '').slice(-1)
    const next = [...otp]
    next[index] = digit
    setOtp(next)

    if (digit.length === 1 && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number
  ): void => {
    if (e.nativeEvent.key === 'Backspace' && otp[index] === '' && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  // ─── Render: Loading overlay ──────────────────────────────────────────────────

  const renderLoadingOverlay = (): React.ReactElement | null => {
    if (!isLoading) return null
    return (
      <View style={styles.loadingOverlay} pointerEvents="box-none">
        <ActivityIndicator size="large" color={colors.brand.DEFAULT} />
      </View>
    )
  }

  // ─── Render: Step 1 — Entry ───────────────────────────────────────────────────

  const renderEntry = (): React.ReactElement => (
    <View style={styles.stepContainer}>
      <Text style={styles.screenTitle}>Reset Password</Text>
      <Text style={styles.stepSubtitle}>
        Enter your phone number or email to receive a reset code.
      </Text>

      <Text style={styles.inputLabel}>Phone or email</Text>
      <TextInput
        style={[
          styles.input,
          identifierFocused && styles.inputFocused,
          identifierError.length > 0 && styles.inputError,
        ]}
        value={identifier}
        onChangeText={(text) => {
          setIdentifier(text)
          setErrorMessage('')
        }}
        onBlur={() => setIdentifierTouched(true)}
        onFocus={() => setIdentifierFocused(true)}
        placeholder="08012345678 or you@example.com"
        placeholderTextColor={colors.mobile.textMuted}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        editable={!isLoading}
        returnKeyType="done"
        onSubmitEditing={handleSendCode}
      />
      {identifierError.length > 0 && (
        <Text style={styles.inlineError}>{identifierError}</Text>
      )}
      {errorMessage.length > 0 && (
        <Text style={styles.inlineError}>{errorMessage}</Text>
      )}

      <TouchableOpacity
        style={[
          styles.primaryButton,
          (identifier.length === 0 || !identifierValid || isLoading) &&
            styles.primaryButtonDisabled,
        ]}
        activeOpacity={0.85}
        onPress={handleSendCode}
        disabled={identifier.length === 0 || !identifierValid || isLoading}
      >
        <Text style={styles.primaryButtonText}>Send Code</Text>
      </TouchableOpacity>
    </View>
  )

  // ─── Render: Step 2 — OTP ─────────────────────────────────────────────────────

  const renderOtp = (): React.ReactElement => {
    const masked = maskIdentifier(identifier)

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.screenTitle}>Reset Password</Text>
        <Text style={styles.stepSubtitle}>
          {'Enter the 6-digit code sent to '}
          <Text style={styles.maskedIdentifier}>{masked}</Text>
        </Text>

        {/* OTP digit boxes */}
        <View style={styles.otpRow}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                otpRefs.current[index] = ref
              }}
              style={[
                styles.otpBox,
                focusedOtpIndex === index && styles.otpBoxFocused,
                digit.length > 0 && styles.otpBoxFilled,
              ]}
              value={digit}
              onChangeText={(text) => handleOtpChange(text, index)}
              onKeyPress={(e) => handleOtpKeyPress(e, index)}
              onFocus={() => setFocusedOtpIndex(index)}
              onBlur={() => setFocusedOtpIndex(-1)}
              keyboardType="number-pad"
              maxLength={OTP_LENGTH} // Allow paste of full code in first box
              textAlign="center"
              selectionColor={colors.brand.DEFAULT}
              editable={!isLoading}
            />
          ))}
        </View>

        {errorMessage.length > 0 && (
          <Text style={[styles.inlineError, styles.otpError]}>{errorMessage}</Text>
        )}

        <TouchableOpacity
          style={[
            styles.primaryButton,
            (!otpFilled || isLoading) && styles.primaryButtonDisabled,
          ]}
          activeOpacity={0.85}
          onPress={handleVerifyOtp}
          disabled={!otpFilled || isLoading}
        >
          <Text style={styles.primaryButtonText}>Verify Code</Text>
        </TouchableOpacity>

        {/* Resend row */}
        <View style={styles.resendRow}>
          <Text style={styles.resendPrompt}>Didn&apos;t receive it? </Text>
          {resendCooldown > 0 ? (
            <Text style={styles.resendCountdown}>Resend in {resendCooldown}s</Text>
          ) : (
            <TouchableOpacity
              onPress={handleResend}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              <Text style={styles.resendLink}>Resend</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    )
  }

  // ─── Render: Step 3 — Reset ───────────────────────────────────────────────────

  const renderReset = (): React.ReactElement => (
    <View style={styles.stepContainer}>
      <Text style={styles.screenTitle}>Reset Password</Text>
      <Text style={styles.stepSubtitle}>Choose a new password.</Text>

      <Text style={styles.inputLabel}>New password</Text>
      <View style={styles.passwordRow}>
        <TextInput
          style={[
            styles.input,
            styles.passwordInput,
            newPasswordFocused && styles.inputFocused,
            passwordTouched && newPassword.length > 0 && !passwordLengthOk && styles.inputError,
          ]}
          value={newPassword}
          onChangeText={(text) => {
            setNewPassword(text)
            setErrorMessage('')
          }}
          onBlur={() => setPasswordTouched(true)}
          onFocus={() => setNewPasswordFocused(true)}
          placeholder="At least 8 characters"
          placeholderTextColor={colors.mobile.textMuted}
          secureTextEntry={!showNewPassword}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isLoading}
          returnKeyType="next"
        />
        <TouchableOpacity
          style={styles.eyeButton}
          onPress={() => setShowNewPassword((v) => !v)}
          activeOpacity={0.7}
        >
          <Text style={styles.eyeIcon}>{showNewPassword ? '🙈' : '👁'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.inputLabel, styles.inputLabelSpaced]}>Confirm password</Text>
      <View style={styles.passwordRow}>
        <TextInput
          style={[
            styles.input,
            styles.passwordInput,
            confirmPasswordFocused && styles.inputFocused,
            passwordTouched && confirmPassword.length > 0 && !passwordsMatch && styles.inputError,
          ]}
          value={confirmPassword}
          onChangeText={(text) => {
            setConfirmPassword(text)
            setErrorMessage('')
          }}
          onBlur={() => setPasswordTouched(true)}
          onFocus={() => setConfirmPasswordFocused(true)}
          placeholder="Re-enter your password"
          placeholderTextColor={colors.mobile.textMuted}
          secureTextEntry={!showConfirmPassword}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isLoading}
          returnKeyType="done"
          onSubmitEditing={handleResetPassword}
        />
        <TouchableOpacity
          style={styles.eyeButton}
          onPress={() => setShowConfirmPassword((v) => !v)}
          activeOpacity={0.7}
        >
          <Text style={styles.eyeIcon}>{showConfirmPassword ? '🙈' : '👁'}</Text>
        </TouchableOpacity>
      </View>

      {passwordError.length > 0 && (
        <Text style={styles.inlineError}>{passwordError}</Text>
      )}
      {errorMessage.length > 0 && (
        <Text style={styles.inlineError}>{errorMessage}</Text>
      )}

      <TouchableOpacity
        style={[
          styles.primaryButton,
          resetButtonDisabled && styles.primaryButtonDisabled,
        ]}
        activeOpacity={0.85}
        onPress={handleResetPassword}
        disabled={resetButtonDisabled}
      >
        <Text style={styles.primaryButtonText}>Reset Password</Text>
      </TouchableOpacity>
    </View>
  )

  // ─── Main render ──────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back button — only on entry step */}
          {step === 'entry' && (
            <TouchableOpacity
              style={styles.backButton}
              activeOpacity={0.7}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonText}>‹ Back</Text>
            </TouchableOpacity>
          )}

          {step === 'entry' && renderEntry()}
          {step === 'otp' && renderOtp()}
          {step === 'reset' && renderReset()}
        </ScrollView>
      </KeyboardAvoidingView>

      {renderLoadingOverlay()}
    </SafeAreaView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.mobile.bg,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: sp[4],
    paddingBottom: sp[10],
  },

  // ── Back button ─────────────────────────────────────────────────────────────
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: sp[3],
    paddingRight: sp[3],
    marginTop: sp[2],
    marginBottom: sp[1],
  },
  backButtonText: {
    fontSize: fs.base,
    color: colors.brand.DEFAULT,
    fontWeight: '500',
  },

  // ── Step container ───────────────────────────────────────────────────────────
  stepContainer: {
    flex: 1,
    paddingTop: sp[5],
  },

  // ── Headings ─────────────────────────────────────────────────────────────────
  screenTitle: {
    fontSize: fs.xl,
    fontWeight: '700',
    color: colors.mobile.textPrimary,
    marginBottom: sp[2],
  },
  stepSubtitle: {
    fontSize: fs.sm,
    color: colors.mobile.textSecondary,
    marginBottom: sp[6],
    lineHeight: 20,
  },
  maskedIdentifier: {
    fontWeight: '600',
    color: colors.mobile.textPrimary,
  },

  // ── Input labels ─────────────────────────────────────────────────────────────
  inputLabel: {
    fontSize: fs.sm,
    fontWeight: '500',
    color: colors.mobile.textSecondary,
    marginBottom: sp[2],
  },
  inputLabelSpaced: {
    marginTop: sp[4],
  },

  // ── Text inputs ───────────────────────────────────────────────────────────────
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: colors.mobile.border,
    borderRadius: rd.md,
    paddingHorizontal: sp[4],
    fontSize: fs.base,
    color: colors.mobile.textPrimary,
    backgroundColor: colors.mobile.surface,
  },
  inputFocused: {
    borderColor: colors.mobile.borderFocus,
  },
  inputError: {
    borderColor: colors.mobile.error,
  },

  // ── Password row (input + eye toggle) ────────────────────────────────────────
  passwordRow: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: sp[12],
  },
  eyeButton: {
    position: 'absolute',
    right: sp[4],
    height: 52,
    justifyContent: 'center',
  },
  eyeIcon: {
    fontSize: fs.base,
  },

  // ── Inline error ──────────────────────────────────────────────────────────────
  inlineError: {
    fontSize: fs.sm,
    color: colors.mobile.error,
    marginTop: sp[2],
    lineHeight: 18,
  },
  otpError: {
    textAlign: 'center',
    marginBottom: sp[3],
  },

  // ── Primary button ────────────────────────────────────────────────────────────
  primaryButton: {
    width: '100%',
    height: 52,
    backgroundColor: colors.brand.DEFAULT,
    borderRadius: rd.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: sp[5],
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    fontSize: fs.base,
    fontWeight: '600',
    color: colors.mobile.textOnBrand,
  },

  // ── OTP row ───────────────────────────────────────────────────────────────────
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: sp[5],
  },
  otpBox: {
    width: 48,
    height: 56,
    borderWidth: 1,
    borderColor: colors.mobile.border,
    borderRadius: rd.md,
    fontSize: fs.xl,
    fontWeight: '700',
    color: colors.mobile.textPrimary,
    backgroundColor: colors.mobile.surface,
    textAlign: 'center',
  },
  otpBoxFocused: {
    borderColor: colors.brand.DEFAULT,
    borderWidth: 2,
  },
  otpBoxFilled: {
    borderColor: colors.brand.DEFAULT,
  },

  // ── Resend row ─────────────────────────────────────────────────────────────────
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: sp[4],
  },
  resendPrompt: {
    fontSize: fs.sm,
    color: colors.mobile.textSecondary,
  },
  resendLink: {
    fontSize: fs.sm,
    color: colors.brand.DEFAULT,
    fontWeight: '600',
  },
  resendCountdown: {
    fontSize: fs.sm,
    color: colors.mobile.textMuted,
  },

  // ── Loading overlay ────────────────────────────────────────────────────────────
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
