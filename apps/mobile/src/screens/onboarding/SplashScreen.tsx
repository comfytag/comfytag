import React, { useEffect, useRef } from 'react'
import {
  View,
  Animated,
  StyleSheet,
  Easing,
  Text,
  Image,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'
import { colors, spacing, rd } from '@comfytag/ui/tokens'
import { Button } from '../../components/ui/Button'
import { useAuthStore } from '../../store'
import { useModeStore } from '../../store'
import { STORAGE_KEYS } from '@comfytag/utils'
import type { GuestStackParamList } from '../../navigation/types'

type SplashNavProp = StackNavigationProp<GuestStackParamList, 'Splash'>

const SPLASH_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCVVmKzgrRNCreLU2iQLXmWRSGoKQTHB1QHCCX8y48PFnMsVob3BAjLdNTLvPXLbcXK2ButpRpbATRmbjJKCqQociAqIFD0q5iQehFlfhFqhCdcA6uRb_RF42yjPd0HSIEeuyDTg4m_mvjdfFT-m_BhviucWFabEO8dssUNxKyzOXbguv6ru5AtRCqALLKbhZR9j2L3ykOEzmMA2TEDLc1lMgvTa27DEJ5Tfor682FrGufAySV4CrCzPw'

const SplashScreen = () => {
  const navigation = useNavigation<SplashNavProp>()
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(24)).current
  const gradientShift = useRef(new Animated.Value(0)).current
  const hasNavigated = useRef(false)
  const setUser = useAuthStore((state) => state.setUser)
  const setMode = useModeStore((state) => state.setMode)

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start()

    const gradientLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(gradientShift, {
          toValue: 1,
          duration: 4500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(gradientShift, {
          toValue: 0,
          duration: 4500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    )
    gradientLoop.start()

    const timeout = setTimeout(() => {
      hydrate()
    }, 1400)

    return () => {
      clearTimeout(timeout)
      gradientLoop.stop()
    }
  }, [])

  const resetOnboardingForTesting = async () => {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.AUTH_TOKEN,
      STORAGE_KEYS.USER,
      'comfytag_has_seen_welcome',
    ])
    hasNavigated.current = false
    navigateSafely('Welcome')
  }

  const navigateSafely = (route: keyof GuestStackParamList) => {
    if (hasNavigated.current) {
      return
    }

    hasNavigated.current = true
    navigation.navigate(route)
  }

  const hydrate = async () => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
      const userJson = await AsyncStorage.getItem(STORAGE_KEYS.USER)
      const hasSeen = await AsyncStorage.getItem('comfytag_has_seen_welcome')

      if (token && userJson) {
        const user = JSON.parse(userJson)
        setUser(user, token)
        setMode(user.isPartner ? 'organizer' : 'attendee')
      } else if (!hasSeen) {
        navigateSafely('Welcome')
      } else {
        navigateSafely('GuestHome')
      }
    } catch {
      navigateSafely('Welcome')
    }
  }

  const gradientBOpacity = gradientShift.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  })

  return (
    <View style={styles.container}>
      <View style={StyleSheet.absoluteFillObject}>
        <LinearGradient
          colors={[colors.public.bg, colors.brand.light, colors.public.bg]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: gradientBOpacity }]}>
          <LinearGradient
            colors={[colors.brand.light, colors.public.bg, colors.brand.light]}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
        </Animated.View>
      </View>

      <View style={styles.topSpacer} />
      <Animated.View
        style={[
          styles.branding,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.logoContainer}>
          <Image
            source={require('../../../assets/comfytag-logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.wordmark}>ComfyTag</Text>
        <Text style={styles.tagline}>Your face is your ticket</Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.bottomSection,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.heroCard}>
          <Image source={{ uri: SPLASH_IMAGE }} style={styles.heroImage} />
          <View style={styles.heroOverlay} />
        </View>
        <Button
          onPress={hydrate}
          label="Get Started"
          variant="brand"
          size="lg"
          style={styles.ctaButton}
          textStyle={styles.ctaLabel}
        />
        <Text style={styles.metaText}>Safe • Secure • Seamless</Text>
        {__DEV__ && (
          <Text style={styles.devResetLink} onPress={resetOnboardingForTesting}>
            Reset onboarding (dev)
          </Text>
        )}
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.public.bg,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: parseInt(spacing[12]),
    paddingBottom: parseInt(spacing[10]),
    paddingHorizontal: parseInt(spacing[5]),
  },
  topSpacer: {
    height: 64,
    width: '100%',
  },
  branding: {
    width: '100%',
    alignItems: 'center',
    textAlign: 'center',
    gap: parseInt(spacing[4]),
  },
  logoContainer: {
    marginBottom: parseInt(spacing[5]),
    borderRadius: 999,
    padding: parseInt(spacing[4]),
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 88,
    height: 88,
    borderRadius: 999,
    overflow: 'hidden',
  },
  wordmark: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.brand.DEFAULT,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    color: colors.textPublic.secondary,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 24,
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
    gap: parseInt(spacing[6]),
  },
  heroCard: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: rd.xl,
    overflow: 'hidden',
    backgroundColor: colors.public.surface,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(249, 249, 248, 0.55)',
  },
  ctaButton: {
    width: '100%',
  },
  ctaLabel: {
    letterSpacing: 0.5,
  },
  metaText: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: colors.textPublic.secondary,
    textAlign: 'center',
  },
  devResetLink: {
    marginTop: parseInt(spacing[4]),
    fontSize: 12,
    fontWeight: '600',
    color: colors.brand.DEFAULT,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
})

export default SplashScreen
