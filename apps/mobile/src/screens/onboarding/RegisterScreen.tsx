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
import { Mail } from 'lucide-react-native'
import { colors, spacing } from '@comfytag/ui/tokens'
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
  const [error, setError] = useState('')

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

  if (state === 'success') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContent}>
          <Mail size={64} color={colors.brand.DEFAULT} strokeWidth={2} />
          <Text style={styles.successTitle}>Check your email</Text>
          <Text style={styles.successText}>
            We sent a verification link to{'\n'}
            {email}
          </Text>
          <AnimatedPressable
            onPress={() => navigation.navigate('Login')}
            style={styles.button}
            hapticStyle="light"
          >
            <Text style={styles.buttonText}>Back to Login</Text>
          </AnimatedPressable>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.header}>Create account</Text>
          <Text style={styles.subtitle}>Join ComfyTag today</Text>

          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor={colors.mobile.textMuted}
            value={name}
            onChangeText={setName}
            editable={state === 'form'}
          />

          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor={colors.mobile.textMuted}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            editable={state === 'form'}
          />

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={colors.mobile.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={state === 'form'}
          />

          <TextInput
            style={styles.input}
            placeholder="Password (min 8 characters)"
            placeholderTextColor={colors.mobile.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={state === 'form'}
          />

          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor={colors.mobile.textMuted}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            editable={state === 'form'}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <AnimatedPressable
            onPress={handleRegister}
            style={[styles.button, state === 'loading' && styles.disabled]}
            disabled={state === 'loading'}
            hapticStyle="light"
          >
            {state === 'loading' ? (
              <ActivityIndicator color={colors.mobile.btnPrimaryText} />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </AnimatedPressable>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <AnimatedPressable
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.footerLink}>Sign In</Text>
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
    borderRadius: 12,
    paddingHorizontal: parseInt(spacing[4]),
    paddingVertical: parseInt(spacing[3]),
    color: colors.mobile.textPrimary,
    fontSize: 14,
    marginBottom: parseInt(spacing[4]),
  },
  error: {
    color: colors.mobile.error,
    fontSize: 12,
    marginBottom: parseInt(spacing[3]),
  },
  button: {
    backgroundColor: colors.mobile.btnPrimaryBg,
    paddingVertical: parseInt(spacing[3]),
    borderRadius: 12,
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
  successContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: parseInt(spacing[6]),
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.mobile.textPrimary,
    marginTop: parseInt(spacing[6]),
    marginBottom: parseInt(spacing[3]),
  },
  successText: {
    fontSize: 14,
    color: colors.mobile.textSecondary,
    textAlign: 'center',
    marginBottom: parseInt(spacing[8]),
    lineHeight: 22,
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

export default RegisterScreen
