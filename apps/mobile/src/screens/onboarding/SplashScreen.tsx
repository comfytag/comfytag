import React, { useEffect, useRef } from 'react'
import {
  View,
  Animated,
  StyleSheet,
  Easing,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'
import { colors, spacing } from '@comfytag/ui/tokens'
import { useAuthStore } from '../../store'
import { useModeStore } from '../../store'
import { STORAGE_KEYS } from '@comfytag/utils'
import type { GuestStackParamList } from '../../navigation/types'

type SplashNavProp = StackNavigationProp<GuestStackParamList, 'Splash'>

const SplashScreen = () => {
  const navigation = useNavigation<SplashNavProp>()
  const fadeAnim = useRef(new Animated.Value(0)).current
  const setUser = useAuthStore((state) => state.setUser)
  const setMode = useModeStore((state) => state.setMode)

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start()

    setTimeout(() => {
      hydrate()
    }, 1400)
  }, [])

  const hydrate = async () => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
      const userJson = await AsyncStorage.getItem(STORAGE_KEYS.USER)
      const hasSeen = await AsyncStorage.getItem(
        'comfytag_has_seen_welcome'
      )

      if (token && userJson) {
        const user = JSON.parse(userJson)
        setUser(user, token)
        setMode(user.isPartner ? 'organizer' : 'attendee')
      } else if (!hasSeen) {
        navigation.navigate('Welcome')
      } else {
        navigation.navigate('GuestBrowse')
      }
    } catch {
      navigation.navigate('Welcome')
    }
  }

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity: fadeAnim }}>
        <View style={styles.logo}>
          <Animated.Text style={styles.wordmark}>ComfyTag</Animated.Text>
          <View style={styles.dot} />
        </View>
        <Animated.Text style={styles.tagline}>
          Your face is your ticket
        </Animated.Text>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.mobile.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: parseInt(spacing[4]),
  },
  wordmark: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.mobile.textPrimary,
    marginRight: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brand.DEFAULT,
  },
  tagline: {
    fontSize: 14,
    color: colors.mobile.textSecondary,
    opacity: 0.8,
  },
})

export default SplashScreen
