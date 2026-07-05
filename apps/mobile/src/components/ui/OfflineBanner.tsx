import React, { useEffect, useRef, useState } from 'react'
import { Animated, StyleSheet, Text } from 'react-native'
import NetInfo from '@react-native-community/netinfo'
import { colors, sp, fs } from '@comfytag/ui/tokens'

// ─── OfflineBanner ────────────────────────────────────────────────────────────
// Slides in from the top when the device loses connectivity.
// Requires: pnpm add @react-native-community/netinfo  (in apps/mobile/)

export function OfflineBanner(): React.ReactElement | null {
  const [isOffline, setIsOffline] = useState(false)
  const translateY = useRef(new Animated.Value(-44)).current

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const offline =
        state.isConnected === false || state.isInternetReachable === false

      setIsOffline(offline)

      Animated.spring(translateY, {
        toValue: offline ? 0 : -44,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }).start()
    })

    return unsubscribe
  }, [translateY])

  if (!isOffline) return null

  return (
    <Animated.View
      style={[styles.banner, { transform: [{ translateY }] }]}
      pointerEvents="none"
    >
      <Text style={styles.text}>No internet connection</Text>
    </Animated.View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 44,
    backgroundColor: colors.mobile.error,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    paddingHorizontal: sp[4],
  },
  text: {
    fontSize: fs.sm,
    fontWeight: '600',
    color: '#FFFFFF',
  },
})
