import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react-native'
import * as Haptics from 'expo-haptics'
import { colors, spacing, rd } from '@comfytag/ui/tokens'
import { useAuthStore, useModeStore } from '../../store'
import { post } from '../../lib/api'
import { AnimatedPressable } from '../../components/ui/AnimatedPressable'
import { STORAGE_KEYS } from '@comfytag/utils'
import type { GuestStackParamList } from '../../navigation/types'
import type { User, AuthResponse } from '@comfytag/types'

type LoginNavProp = StackNavigationProp<GuestStackParamList, 'Login'>

type LoginState = 'credentials' | 'otp' | 'loading' | 'error'

const LoginScreen = () => {
  const navigation = useNavigation<LoginNavProp>()
  const [state, setState] = useState<LoginState>('credentials')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isOtpLoading, setIsOtpLoading] = useState(false)
  const [error, setError] = useState('')
  const setUser = useAuthStore((s) => s.setUser)
  const setMode = useModeStore((s) => s.setMode)

  const handleLogin = async () => {
    // Accepts a username as well as an email — the backend now looks up
    // whichever was entered, so don't gate submission on email format.
    if (email.trim().length === 0 || password.length < 6) {
      setError('Invalid email or password')
      return
    }

    setState('loading')
    try {
      const res = await post<AuthResponse>('/auth/login', {
        email,
        password,
      })

      await handleLoginSuccess(res.data.user, res.data.token)
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: string; message?: string } } }
      if (apiErr.response?.data?.error === 'TWO_FACTOR_REQUIRED') {
        setState('otp')
        setError('')
      } else {
        setError(apiErr.response?.data?.message || 'Login failed')
        setState('credentials')
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      }
    }
  }

  const handleOtpSubmit = async () => {
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit code')
      return
    }

    setIsOtpLoading(true)
    try {
      const res = await post<AuthResponse>('/auth/login', {
        email,
        password,
        otp,
      })

      await handleLoginSuccess(res.data.user, res.data.token)
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } }
      setError(apiErr.response?.data?.message || 'Invalid OTP')
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    } finally {
      setIsOtpLoading(false)
    }
  }

  const handleLoginSuccess = async (user: User, token: string) => {
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token)
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user))
    setUser(user, token)
    setMode(user.isPartner ? 'organizer' : 'attendee')
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    setState('credentials')
  }

  const navigateRegister = () => navigation.navigate('Register')

  const navigateForgotPassword = () => navigation.navigate('ForgotPassword')

  const primaryBackground = colors.public.bg
  const surfaceBackground = colors.public.surface
  const surfaceBorder = colors.public.border
  const textPrimary = colors.textPublic.primary
  const textSecondary = colors.textPublic.secondary

  if (state === 'otp') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: primaryBackground }]}> 
        <ScrollView contentContainerStyle={styles.content}>
          <View style={[styles.card, styles.formCard]}>
            <Text style={[styles.header, { color: textPrimary }]}>Enter 2FA Code</Text>
            <Text style={[styles.subtitle, { color: textSecondary }]}>We sent a code to {email}</Text>

            <TextInput
              style={[styles.input, styles.otpInput]}
              placeholder="000000"
              placeholderTextColor={colors.textPublic.muted}
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
              editable={!isOtpLoading}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <AnimatedPressable
              onPress={handleOtpSubmit}
              style={[styles.button, { backgroundColor: colors.brand.DEFAULT }, isOtpLoading && styles.disabled]}
              disabled={isOtpLoading}
            >
              {isOtpLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={[styles.buttonText, { color: colors.textPublic.onBrand }]}>Verify</Text>
              )}
            </AnimatedPressable>

            <AnimatedPressable onPress={() => setState('credentials')} style={styles.textButton}>
              <Text style={[styles.textButtonText, { color: colors.brand.DEFAULT }]}>Back</Text>
            </AnimatedPressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: primaryBackground }]}> 
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.pageHeader, { color: colors.brand.DEFAULT }]}>ComfyTag</Text>
        <View style={[styles.card, styles.formCard, { borderColor: surfaceBorder, backgroundColor: surfaceBackground }]}> 
          <Text style={[styles.header, { color: textPrimary }]}>Welcome back</Text>
          <Text style={[styles.subtitle, { color: textSecondary }]}>Enter your details to access your tickets.</Text>

          <Text style={[styles.fieldLabel, { color: textSecondary }]}>Email or Username</Text>
          <View style={[styles.fieldContainer, { backgroundColor: colors.public.surfaceAlt, borderColor: 'transparent' }]}>
            <Mail size={18} color={colors.textPublic.secondary} strokeWidth={2} />
            <TextInput
              style={styles.inputField}
              placeholder="name@example.com or username"
              placeholderTextColor={colors.textPublic.secondary}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              editable={state !== 'loading'}
              returnKeyType="next"
            />
          </View>

          <View style={styles.fieldLabelRow}>
            <Text style={[styles.fieldLabel, { color: textSecondary }]}>Password</Text>
            <AnimatedPressable onPress={navigateForgotPassword}>
              <Text style={[styles.forgotLink, { color: colors.brand.DEFAULT }]}>Forgot?</Text>
            </AnimatedPressable>
          </View>
          <View style={[styles.fieldContainer, { backgroundColor: colors.public.surfaceAlt, borderColor: 'transparent' }]}>
            <Lock size={18} color={colors.textPublic.secondary} strokeWidth={2} />
            <TextInput
              style={styles.inputField}
              placeholder="••••••••"
              placeholderTextColor={colors.textPublic.secondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={state !== 'loading'}
              returnKeyType="done"
            />
            <AnimatedPressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
              {showPassword ? (
                <EyeOff size={18} color={colors.textPublic.secondary} strokeWidth={2} />
              ) : (
                <Eye size={18} color={colors.textPublic.secondary} strokeWidth={2} />
              )}
            </AnimatedPressable>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <AnimatedPressable
            onPress={handleLogin}
            style={[styles.button, { backgroundColor: colors.brand.DEFAULT }, state === 'loading' && styles.disabled]}
            disabled={state === 'loading'}
            hapticStyle="light"
          >
            {state === 'loading' ? (
              <ActivityIndicator color={colors.textPublic.onBrand} />
            ) : (
              <View style={styles.buttonContent}>
                <Text style={[styles.buttonText, { color: colors.textPublic.onBrand }]}>Continue</Text>
                <ArrowRight size={18} color={colors.textPublic.onBrand} strokeWidth={2} />
              </View>
            )}
          </AnimatedPressable>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: textSecondary }]}>New to ComfyTag?</Text>
            <AnimatedPressable onPress={navigateRegister}>
              <Text style={[styles.footerLink, { color: colors.brand.DEFAULT }]}>Create account</Text>
            </AnimatedPressable>
          </View>
        </View>

        <View style={styles.trustMarkers}>
          <View style={styles.trustItem}>
            <Text style={[styles.trustIcon, { color: colors.textPublic.secondary }]}>✓</Text>
            <Text style={[styles.trustText, { color: textSecondary }]}>Secure Encryption</Text>
          </View>
          <View style={styles.trustItem}>
            <Text style={[styles.trustIcon, { color: colors.textPublic.secondary }]}>✓</Text>
            <Text style={[styles.trustText, { color: textSecondary }]}>PCI-DSS Compliant</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: parseInt(spacing[6]),
    alignItems: 'center',
    gap: parseInt(spacing[6]),
  },
  pageHeader: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: parseInt(spacing[2]),
  },
  card: {
    width: '100%',
    borderRadius: rd.xl,
    borderWidth: 1,
    padding: parseInt(spacing[6]),
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
    elevation: 4,
  },
  formCard: {
    backgroundColor: colors.public.surface,
  },
  header: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: parseInt(spacing[2]),
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: parseInt(spacing[6]),
  },
  fieldLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: parseInt(spacing[2]),
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: parseInt(spacing[2]),
  },
  fieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: rd.md,
    paddingHorizontal: parseInt(spacing[4]),
    paddingVertical: parseInt(spacing[3]),
    borderWidth: 1,
    borderColor: colors.public.border,
    gap: parseInt(spacing[3]),
    marginBottom: parseInt(spacing[4]),
  },
  input: {
    flex: 1,
    color: colors.textPublic.primary,
    fontSize: 16,
  },
  otpInput: {
    textAlign: 'center',
    letterSpacing: 6,
    fontSize: 18,
    fontWeight: '700',
  },
  inputField: {
    flex: 1,
    color: colors.textPublic.primary,
    fontSize: 16,
  },
  eyeButton: {
    padding: parseInt(spacing[2]),
  },
  forgotLink: {
    fontSize: 12,
    fontWeight: '600',
  },
  button: {
    borderRadius: rd.md,
    paddingVertical: parseInt(spacing[4]),
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: parseInt(spacing[2]),
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.6,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: parseInt(spacing[2]),
    marginTop: parseInt(spacing[4]),
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '700',
  },
  error: {
    color: colors.error.DEFAULT,
    fontSize: 13,
    marginTop: parseInt(spacing[2]),
    marginBottom: parseInt(spacing[2]),
  },
  textButton: {
    marginTop: parseInt(spacing[4]),
  },
  textButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  trustMarkers: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: parseInt(spacing[2]),
    marginTop: parseInt(spacing[4]),
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: parseInt(spacing[2]),
  },
  trustIcon: {
    fontSize: 16,
  },
  trustText: {
    fontSize: 12,
  },
})

export default LoginScreen
