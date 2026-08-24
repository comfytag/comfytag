import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Animated,
  useWindowDimensions,
  Image,
  TouchableOpacity,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'
import { colors, spacing, rd } from '@comfytag/ui/tokens'
import { AnimatedPressable } from '../../components/ui/AnimatedPressable'
import type { GuestStackParamList } from '../../navigation/types'

type WelcomeNavProp = StackNavigationProp<GuestStackParamList, 'Welcome'>

const slides = [
  {
    key: 'discover',
    title: 'Discover events',
    subtitle:
      'Uncover the most exclusive concerts, festivals, and business summits happening across the city.',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBo4ubxZeubg_3VWd_DjdOzITHXywEnIUqd3asZBDffRx4tUN5_1oYML7EM6yvqDib2ZG1O4YiVi9t8dK2lp3dfbKUzUsmvD8rdeEggNho0rBfiNnYjVV8ujb_uwGf2iO_PrurHXWXUCj9DJ7teYsdOlJYC4S3duV2VxdycM8V-w5QMRX9oYSLns2qkcd4tFwT0jDtextP77S1xQEgimQOCzTJnDFws_D-MtclZI52m4cXO6x7tTa7zBQ',
  },
  {
    key: 'buy',
    title: 'Buy tickets quickly',
    subtitle:
      'Seamless checkout with a single tap. Secure, fast, and delivered straight to your digital wallet.',
    illustration: true,
  },
  {
    key: 'checkin',
    title: 'Check in with your face',
    subtitle:
      'Skip the long queues. Our advanced facial recognition ensures a smooth and hands-free entry.',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBdZYLN0rv4-E48BvFNMxjBVDstMILvDJh4CD1wJDG4dHr0DHpn2f5eJcoOKYKR5AuMTvzP7-K-okqjzmntj06V4c6I-2xtOZXb8B7bEXHblcAvEBQSpPHUmCAu6ToyQyUM0gseHNTwqAMwiw2UCE0Sy7t95maBJsKeAD6Hc8CiNX_6tN70XkKHRiqhN6ZwUTg9ulH6ZlFsF88XpL5nDEtCv3rWISiBZNq_rJuN1qMR1sBWDEawxIriYQ',
  },
]

const WelcomeScreen = () => {
  const navigation = useNavigation<WelcomeNavProp>()
  const { width } = useWindowDimensions()
  const [activeStep, setActiveStep] = useState(0)
  const slideAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    AsyncStorage.setItem('comfytag_has_seen_welcome', 'true')
  }, [])

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: -activeStep * width,
      useNativeDriver: true,
      damping: 20,
      stiffness: 200,
    }).start()
  }, [activeStep, width, slideAnim])

  const handleSkip = () => navigation.navigate('GuestHome')

  const handleNext = () => {
    if (activeStep < slides.length - 1) {
      setActiveStep((step) => step + 1)
    } else {
      navigation.navigate('GuestHome')
    }
  }

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep((step) => step - 1)
    }
  }

  const step = slides[activeStep]

  const progressDots = useMemo(
    () =>
      slides.map((slide, index) => (
        <View
          key={slide.key}
          style={[
            styles.dot,
            activeStep === index && styles.dotActive,
          ]}
        />
      )),
    [activeStep]
  )

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.brand}>ComfyTag</Text>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.carouselContainer}>
        <Animated.View
          style={[
            styles.slider,
            {
              width: width * slides.length,
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          {slides.map((slideItem) => (
            <View key={slideItem.key} style={[styles.slide, { width }]}> 
              <View style={styles.card}>
                <View style={styles.mediaWrapper}>
                  {slideItem.illustration ? (
                    <View style={styles.ticketIllustration}>
                      <View style={styles.ticketCard}>
                        <Text style={styles.ticketIcon}>🎟</Text>
                        <View style={styles.ticketSeparator} />
                        <View style={styles.ticketLine} />
                        <View style={styles.ticketLineShort} />
                      </View>
                      <View style={styles.decorativeCircle} />
                    </View>
                  ) : (
                    <Image
                      source={{ uri: slideItem.image ?? '' }}
                      style={styles.heroImage}
                    />
                  )}
                </View>
                <Text style={styles.slideTitle}>{slideItem.title}</Text>
                <Text style={styles.slideSubtitle}>{slideItem.subtitle}</Text>
              </View>
            </View>
          ))}
        </Animated.View>
      </View>

      <View style={styles.controls}> 
        <View style={styles.dotsRow}>{progressDots}</View>
        <AnimatedPressable onPress={handleNext} style={styles.primaryButton} hapticStyle="medium">
          <Text style={styles.primaryButtonText}>
            {activeStep === slides.length - 1 ? 'Get Started' : 'Continue'}
          </Text>
        </AnimatedPressable>
        <TouchableOpacity
          onPress={handleBack}
          disabled={activeStep === 0}
          style={[styles.backButton, activeStep === 0 && styles.backButtonDisabled]}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.public.bg,
  },
  header: {
    width: '100%',
    paddingHorizontal: parseInt(spacing[5]),
    paddingTop: parseInt(spacing[4]),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brand: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.brand.DEFAULT,
  },
  skipButton: {
    paddingHorizontal: parseInt(spacing[2]),
    paddingVertical: parseInt(spacing[1]),
  },
  skipText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: colors.textPublic.secondary,
  },
  carouselContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slider: {
    flexDirection: 'row',
  },
  slide: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '90%',
    backgroundColor: colors.public.surface,
    borderRadius: rd.xl,
    borderWidth: 1,
    borderColor: colors.public.border,
    padding: parseInt(spacing[5]),
    gap: parseInt(spacing[4]),
  },
  mediaWrapper: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: rd.lg,
    overflow: 'hidden',
    backgroundColor: colors.public.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  ticketIllustration: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  ticketCard: {
    width: '80%',
    borderRadius: rd.lg,
    backgroundColor: colors.public.surface,
    padding: parseInt(spacing[4]),
    alignItems: 'center',
    gap: parseInt(spacing[3]),
    borderWidth: 1,
    borderColor: colors.public.border,
  },
  ticketIcon: {
    fontSize: 36,
  },
  ticketSeparator: {
    width: '100%',
    height: 6,
    backgroundColor: colors.public.surfaceAlt,
    borderRadius: 4,
  },
  ticketLine: {
    width: '100%',
    height: 8,
    backgroundColor: colors.public.surfaceAlt,
    borderRadius: 4,
  },
  ticketLineShort: {
    width: '60%',
    height: 8,
    backgroundColor: colors.public.surfaceAlt,
    borderRadius: 4,
  },
  decorativeCircle: {
    position: 'absolute',
    right: -30,
    bottom: -30,
    width: 96,
    height: 96,
    borderRadius: 999,
    backgroundColor: 'rgba(110, 58, 202, 0.1)',
  },
  slideTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.textPublic.primary,
    textAlign: 'center',
  },
  slideSubtitle: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.textPublic.secondary,
    textAlign: 'center',
  },
  controls: {
    width: '100%',
    paddingHorizontal: parseInt(spacing[5]),
    paddingBottom: parseInt(spacing[6]),
    gap: parseInt(spacing[4]),
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: parseInt(spacing[2]),
    marginBottom: parseInt(spacing[3]),
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: rd.full,
    backgroundColor: colors.public.border,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.brand.DEFAULT,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: colors.brand.DEFAULT,
    borderRadius: rd.md,
    paddingVertical: parseInt(spacing[4]),
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: colors.textPublic.onBrand,
    fontSize: 16,
    fontWeight: '700',
  },
  backButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: parseInt(spacing[3]),
  },
  backButtonDisabled: {
    opacity: 0.4,
  },
  backButtonText: {
    color: colors.textPublic.secondary,
    fontSize: 14,
    fontWeight: '600',
  },
})

export default WelcomeScreen
