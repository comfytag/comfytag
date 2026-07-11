import React, { useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'
import { colors, spacing, typography, rd } from '@comfytag/ui/tokens'
import { ScanFace, Zap, Shield } from 'lucide-react-native'
import { AnimatedPressable } from '../../components/ui/AnimatedPressable'
import type { GuestStackParamList } from '../../navigation/types'

type WelcomeNavProp = StackNavigationProp<GuestStackParamList, 'Welcome'>

const WelcomeScreen = () => {
  const navigation = useNavigation<WelcomeNavProp>()

  useEffect(() => {
    AsyncStorage.setItem('comfytag_has_seen_welcome', 'true')
  }, [])

  const handleBrowse = () => {
    navigation.navigate('GuestBrowse')
  }

  const handleSignIn = () => {
    navigation.navigate('Login')
  }

  const handleRegister = () => {
    navigation.navigate('Register')
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.wordmark}>ComfyTag</Text>
        <Text style={styles.tagline}>Your face is your ticket</Text>
      </View>

      <View style={styles.features}>
        <View style={styles.feature}>
          <ScanFace
            size={24}
            color={colors.mobile.textPrimary}
            strokeWidth={2}
          />
          <Text style={styles.featureText}>Face check-in, no QR</Text>
        </View>
        <View style={styles.feature}>
          <Zap
            size={24}
            color={colors.mobile.textPrimary}
            strokeWidth={2}
          />
          <Text style={styles.featureText}>Buy tickets in seconds</Text>
        </View>
        <View style={styles.feature}>
          <Shield
            size={24}
            color={colors.mobile.textPrimary}
            strokeWidth={2}
          />
          <Text style={styles.featureText}>Secure & biometric</Text>
        </View>
      </View>

      <View style={styles.cta}>
        <AnimatedPressable
          onPress={handleBrowse}
          style={styles.primaryButton}
          hapticStyle="light"
        >
          <Text style={styles.primaryButtonText}>Browse Events</Text>
        </AnimatedPressable>

        <AnimatedPressable
          onPress={handleSignIn}
          style={styles.secondaryButton}
          hapticStyle="light"
        >
          <Text style={styles.secondaryButtonText}>Sign In</Text>
        </AnimatedPressable>

        <AnimatedPressable onPress={handleRegister} style={styles.linkButton}>
          <Text style={styles.linkText}>Create account</Text>
        </AnimatedPressable>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.mobile.bg,
    paddingHorizontal: parseInt(spacing[6]),
    justifyContent: 'space-between',
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.brand.DEFAULT,
    borderRadius: rd.xl,
    borderWidth: 1,
    borderColor: colors.mobile.border,
    paddingVertical: parseInt(spacing[12]),
    marginTop: parseInt(spacing[6]),
    marginBottom: parseInt(spacing[8]),
  },
  wordmark: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.mobile.textPrimary,
    marginBottom: parseInt(spacing[3]),
  },
  tagline: {
    fontSize: 16,
    color: colors.mobile.textPrimary,
    opacity: 0.8,
  },
  features: {
    gap: parseInt(spacing[4]),
    marginVertical: parseInt(spacing[8]),
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: parseInt(spacing[3]),
  },
  featureText: {
    fontSize: 14,
    color: colors.mobile.textPrimary,
    fontWeight: '500',
  },
  cta: {
    gap: parseInt(spacing[3]),
    marginBottom: parseInt(spacing[6]),
  },
  primaryButton: {
    backgroundColor: colors.mobile.btnPrimaryBg,
    paddingVertical: parseInt(spacing[3]),
    paddingHorizontal: parseInt(spacing[6]),
    borderRadius: 999,
    alignItems: 'center',
    marginBottom: parseInt(spacing[2]),
  },
  primaryButtonText: {
    color: colors.mobile.btnPrimaryText,
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.mobile.textPrimary,
    paddingVertical: parseInt(spacing[3]),
    paddingHorizontal: parseInt(spacing[6]),
    borderRadius: 999,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.mobile.textPrimary,
    fontWeight: '600',
    fontSize: 16,
  },
  linkButton: {
    paddingVertical: parseInt(spacing[3]),
    paddingHorizontal: parseInt(spacing[4]),
    alignItems: 'center',
  },
  linkText: {
    color: colors.brand.DEFAULT,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
})

export default WelcomeScreen
