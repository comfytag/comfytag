import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'
import * as Haptics from 'expo-haptics'
import { Eye, EyeOff, Mail, ArrowRight, ChevronLeft } from 'lucide-react-native'
import { colors, spacing, rd } from '@comfytag/ui/tokens'
import { post } from '../../lib/api'
import { AnimatedPressable } from '../../components/ui/AnimatedPressable'
import { isValidEmail } from '@comfytag/utils'
import type { GuestStackParamList } from '../../navigation/types'

type RegisterNavProp = StackNavigationProp<GuestStackParamList, 'Register'>

type RegisterState = 'form' | 'loading' | 'success'

const RegisterScreen = () => {
  const navigation = useNavigation<RegisterNavProp>()
  const [state, setState] = useState<RegisterState>('form')
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')

  const primaryBackground = colors.public.bg
  const surfaceBackground = colors.public.surface
  const surfaceBorder = colors.public.border
  const textPrimary = colors.textPublic.primary
  const textSecondary = colors.textPublic.secondary

  const validate = () => {
    if (!name.trim()) {
      setError('Full name is required')
      return false
    }
    if (!username.trim() || username.includes(' ')) {
      setError('Username is required and cannot contain spaces')
      return false
    }
    if (!isValidEmail(email)) {
      setError('Invalid email address')
      return false
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return false
    }
    if (!confirmPassword.trim()) {
      setError('Please confirm your password')
      return false
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return false
    }
    return true
  }

  const handleRegister = async () => {
    if (!validate()) return

    setState('loading')
    try {
      await post('/auth/register', {
        name: name.trim(),
        username: username.trim().toLowerCase(),
        email: email.toLowerCase(),
        password,
        confirm_password: confirmPassword,
      })

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setError('')
      setState('success')
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } }
      const message = apiErr.response?.data?.message || 'Registration failed'
      setError(message)
      setState('form')
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    }
  }

  const header = (
    <View style={styles.header}>
      <AnimatedPressable
        onPress={() => navigation.goBack()}
        style={styles.headerBack}
        hapticStyle="light"
      >
        <ChevronLeft size={24} color={colors.brand.DEFAULT} strokeWidth={2} />
      </AnimatedPressable>
      <Text style={styles.headerBrand}>ComfyTag</Text>
      <View style={styles.headerSpacer} />
    </View>
  )

  if (state === 'success') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: primaryBackground }]}>
        {header}
        <View style={styles.successContent}>
          <Mail size={64} color={colors.brand.DEFAULT} strokeWidth={2} />
          <Text style={[styles.successTitle, { color: textPrimary }]}>Check your email</Text>
          <Text style={[styles.successText, { color: textSecondary }]}>
            We've sent a verification link to{'\n'}{email}. Please follow the instructions to
            activate your account.
          </Text>
          <AnimatedPressable
            onPress={() => navigation.navigate('Login')}
            style={styles.primaryButton}
            hapticStyle="light"
          >
            <Text style={[styles.primaryButtonText, { color: colors.textPublic.onBrand }]}>Got it</Text>
          </AnimatedPressable>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: primaryBackground }]}>
      {header}
      <KeyboardAvoidingView behavior="padding" style={styles.avoidKeyboard}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={[styles.pageHeader, { color: textPrimary }]}>Create account</Text>
          <Text style={[styles.subtitle, { color: textSecondary }]}>
            Join our premium biometric ecosystem for secure, seamless interactions.
          </Text>

          <View style={[styles.card, { backgroundColor: surfaceBackground, borderColor: surfaceBorder }]}>
            <Text style={[styles.fieldLabel, { color: textSecondary }]}>Full name</Text>
            <TextInput
              style={[styles.plainInput, { color: textPrimary, borderColor: surfaceBorder }]}
              placeholder="Enter your full name"
              placeholderTextColor={colors.textPublic.secondary}
              value={name}
              onChangeText={setName}
              editable={state === 'form'}
              returnKeyType="next"
            />

            <Text style={[styles.fieldLabel, { color: textSecondary }]}>Username</Text>
            <TextInput
              style={[styles.plainInput, { color: textPrimary, borderColor: surfaceBorder }]}
              placeholder="Choose a username"
              placeholderTextColor={colors.textPublic.secondary}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              editable={state === 'form'}
              returnKeyType="next"
            />

            <Text style={[styles.fieldLabel, { color: textSecondary }]}>Email</Text>
            <TextInput
              style={[styles.plainInput, { color: textPrimary, borderColor: surfaceBorder }]}
              placeholder="example@domain.com"
              placeholderTextColor={colors.textPublic.secondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={state === 'form'}
              returnKeyType="next"
            />

            <Text style={[styles.fieldLabel, { color: textSecondary }]}>Password</Text>
            <View style={[styles.passwordFieldContainer, { borderColor: surfaceBorder }]}>
              <TextInput
                style={[styles.passwordFieldInput, { color: textPrimary }]}
                placeholder="Min. 8 characters"
                placeholderTextColor={colors.textPublic.secondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={state === 'form'}
                returnKeyType="next"
                textContentType="oneTimeCode"
                autoComplete="off"
                autoCorrect={false}
                spellCheck={false}
              />
              <AnimatedPressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                {showPassword ? (
                  <EyeOff size={18} color={colors.textPublic.secondary} strokeWidth={2} />
                ) : (
                  <Eye size={18} color={colors.textPublic.secondary} strokeWidth={2} />
                )}
              </AnimatedPressable>
            </View>

            <Text style={[styles.fieldLabel, { color: textSecondary }]}>Confirm Password</Text>
            <View style={[styles.passwordFieldContainer, { borderColor: surfaceBorder }]}>
              <TextInput
                style={[styles.passwordFieldInput, { color: textPrimary }]}
                placeholder="Repeat your password"
                placeholderTextColor={colors.textPublic.secondary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                editable={state === 'form'}
                returnKeyType="done"
                textContentType="oneTimeCode"
                autoComplete="off"
                autoCorrect={false}
                spellCheck={false}
              />
              <AnimatedPressable onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeButton}>
                {showConfirmPassword ? (
                  <EyeOff size={18} color={colors.textPublic.secondary} strokeWidth={2} />
                ) : (
                  <Eye size={18} color={colors.textPublic.secondary} strokeWidth={2} />
                )}
              </AnimatedPressable>
            </View>

            {error ? <Text style={[styles.error, { color: colors.error.DEFAULT }]}>{error}</Text> : null}

            <AnimatedPressable
              onPress={handleRegister}
              style={[styles.primaryButton, state === 'loading' && styles.disabled]}
              disabled={state === 'loading'}
              hapticStyle="light"
            >
              {state === 'loading' ? (
                <ActivityIndicator color={colors.textPublic.onBrand} />
              ) : (
                <View style={styles.primaryButtonContent}>
                  <Text style={[styles.primaryButtonText, { color: colors.textPublic.onBrand }]}>Create account</Text>
                  <ArrowRight size={18} color={colors.textPublic.onBrand} strokeWidth={2} />
                </View>
              )}
            </AnimatedPressable>
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: textSecondary }]}>Already have an account?</Text>
            <AnimatedPressable onPress={() => navigation.navigate('Login')}>
              <Text style={[styles.footerLink, { color: colors.brand.DEFAULT }]}>Sign in</Text>
            </AnimatedPressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: parseInt(spacing[4]),
    paddingVertical: parseInt(spacing[3]),
  },
  headerBack: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBrand: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '800',
    color: colors.brand.DEFAULT,
  },
  headerSpacer: {
    width: 44,
  },
  avoidKeyboard: {
    flex: 1,
  },
  content: {
    padding: parseInt(spacing[6]),
    gap: parseInt(spacing[4]),
  },
  pageHeader: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: parseInt(spacing[1]),
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: parseInt(spacing[6]),
  },
  card: {
    width: '100%',
    borderRadius: rd['2xl'],
    borderWidth: 1,
    padding: parseInt(spacing[5]),
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
    elevation: 4,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: parseInt(spacing[2]),
  },
  plainInput: {
    borderRadius: rd.lg,
    paddingHorizontal: parseInt(spacing[4]),
    height: 48,
    borderWidth: 1,
    fontSize: 16,
    marginBottom: parseInt(spacing[4]),
  },
  passwordFieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: rd.lg,
    borderWidth: 1,
    paddingHorizontal: parseInt(spacing[4]),
    height: 48,
    marginBottom: parseInt(spacing[4]),
  },
  passwordFieldInput: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  eyeButton: {
    padding: parseInt(spacing[2]),
  },
  error: {
    fontSize: 13,
    marginBottom: parseInt(spacing[4]),
  },
  primaryButton: {
    marginTop: parseInt(spacing[4]),
    backgroundColor: colors.brand.DEFAULT,
    borderRadius: rd.md,
    paddingVertical: parseInt(spacing[4]),
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: parseInt(spacing[2]),
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.6,
  },
  successContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: parseInt(spacing[6]),
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: parseInt(spacing[6]),
    marginBottom: parseInt(spacing[3]),
  },
  successText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: parseInt(spacing[8]),
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
})

export default RegisterScreen
