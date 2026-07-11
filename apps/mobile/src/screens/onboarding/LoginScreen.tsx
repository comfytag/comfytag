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
import { Eye, EyeOff } from 'lucide-react-native'
import * as Haptics from 'expo-haptics'
import { colors, spacing, rd } from '@comfytag/ui/tokens'
import { useAuthStore, useModeStore } from '../../store'
import { post } from '../../lib/api'
import { AnimatedPressable } from '../../components/ui/AnimatedPressable'
import { STORAGE_KEYS, isValidEmail } from '@comfytag/utils'
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
    if (!isValidEmail(email) || password.length < 6) {
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

  if (state === 'otp') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.header}>Enter 2FA Code</Text>
          <Text style={styles.subtitle}>
            We sent a code to {email}
          </Text>

          <TextInput
            style={styles.otpInput}
            placeholder="000000"
            placeholderTextColor={colors.mobile.textMuted}
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
            editable={!isOtpLoading}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <AnimatedPressable
            onPress={handleOtpSubmit}
            style={[styles.button, isOtpLoading && styles.disabled]}
            disabled={isOtpLoading}
          >
            {isOtpLoading ? (
              <ActivityIndicator color={colors.mobile.btnPrimaryText} />
            ) : (
              <Text style={styles.buttonText}>Verify</Text>
            )}
          </AnimatedPressable>

          <AnimatedPressable onPress={() => setState('credentials')}>
            <Text style={styles.link}>Back</Text>
          </AnimatedPressable>
        </ScrollView>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.header}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.mobile.textMuted}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={state !== 'loading'}
        />

        <View style={styles.passwordWrapper}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Password"
            placeholderTextColor={colors.mobile.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            editable={state !== 'loading'}
          />
          <AnimatedPressable
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeButton}
          >
            {showPassword ? (
              <EyeOff
                size={20}
                color={colors.mobile.textMuted}
                strokeWidth={2}
              />
            ) : (
              <Eye
                size={20}
                color={colors.mobile.textMuted}
                strokeWidth={2}
              />
            )}
          </AnimatedPressable>
        </View>

        <AnimatedPressable onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={styles.forgotLink}>Forgot password?</Text>
        </AnimatedPressable>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <AnimatedPressable
          onPress={handleLogin}
          style={[styles.button, state === 'loading' && styles.disabled]}
          disabled={state === 'loading'}
          hapticStyle="light"
        >
          {state === 'loading' ? (
            <ActivityIndicator color={colors.mobile.btnPrimaryText} />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </AnimatedPressable>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <AnimatedPressable onPress={() => navigation.navigate('Register')}>
            <Text style={styles.footerLink}>Register</Text>
          </AnimatedPressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.mobile.bg,
  },
  content: {
    padding: parseInt(spacing[6]),
  },
  header: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.mobile.textPrimary,
    marginBottom: parseInt(spacing[2]),
  },
  subtitle: {
    fontSize: 14,
    color: colors.mobile.textSecondary,
    marginBottom: parseInt(spacing[6]),
  },
  input: {
    backgroundColor: colors.mobile.surface,
    borderWidth: 1,
    borderColor: colors.mobile.border,
    borderRadius: rd.md,
    paddingHorizontal: parseInt(spacing[4]),
    paddingVertical: parseInt(spacing[3]),
    color: colors.mobile.textPrimary,
    fontSize: 14,
    marginBottom: parseInt(spacing[4]),
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.mobile.surface,
    borderWidth: 1,
    borderColor: colors.mobile.border,
    borderRadius: rd.md,
    marginBottom: parseInt(spacing[2]),
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: parseInt(spacing[4]),
    paddingVertical: parseInt(spacing[3]),
    color: colors.mobile.textPrimary,
    fontSize: 14,
  },
  eyeButton: {
    paddingHorizontal: parseInt(spacing[3]),
    paddingVertical: parseInt(spacing[3]),
  },
  forgotLink: {
    color: colors.brand.DEFAULT,
    fontSize: 12,
    marginBottom: parseInt(spacing[4]),
  },
  button: {
    backgroundColor: colors.mobile.btnPrimaryBg,
    paddingVertical: parseInt(spacing[3]),
    borderRadius: rd.md,
    alignItems: 'center',
    marginTop: parseInt(spacing[6]),
  },
  disabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.mobile.btnPrimaryText,
    fontWeight: '600',
    fontSize: 16,
  },
  otpInput: {
    backgroundColor: colors.mobile.surface,
    borderWidth: 2,
    borderColor: colors.brand.DEFAULT,
    borderRadius: rd.md,
    paddingHorizontal: parseInt(spacing[4]),
    paddingVertical: parseInt(spacing[3]),
    color: colors.mobile.textPrimary,
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: 4,
    marginVertical: parseInt(spacing[6]),
  },
  error: {
    color: colors.mobile.error,
    fontSize: 12,
    marginVertical: parseInt(spacing[2]),
  },
  link: {
    color: colors.brand.DEFAULT,
    textAlign: 'center',
    marginTop: parseInt(spacing[4]),
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: parseInt(spacing[8]),
  },
  footerText: {
    color: colors.mobile.textSecondary,
    fontSize: 14,
  },
  footerLink: {
    color: colors.brand.DEFAULT,
    fontWeight: '600',
  },
})

export default LoginScreen
