import React, { useRef, useEffect } from 'react'
import {
  Animated,
  Pressable,
  PressableProps,
  StyleProp,
  View,
  ViewStyle,
  StyleSheet,
} from 'react-native'
import * as Haptics from 'expo-haptics'

interface AnimatedPressableProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>
  children: React.ReactNode
  hapticStyle?: 'light' | 'medium' | 'heavy' | 'none'
  scaleDown?: number
  disabled?: boolean
}

export const AnimatedPressable = React.forwardRef<
  View,
  AnimatedPressableProps
>(
  (
    {
      style,
      children,
      onPress,
      hapticStyle = 'light',
      scaleDown = 0.96,
      disabled = false,
      ...props
    },
    ref
  ) => {
    const scaleAnim = useRef(new Animated.Value(1)).current

    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: scaleDown,
        damping: 15,
        stiffness: 400,
        mass: 1,
        useNativeDriver: true,
      }).start()

      if (hapticStyle === 'light') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      } else if (hapticStyle === 'medium') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      } else if (hapticStyle === 'heavy') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
      }
    }

    const handlePressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        damping: 15,
        stiffness: 400,
        mass: 1,
        useNativeDriver: true,
      }).start()
    }

    return (
      <Animated.View
        style={[
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Pressable
          ref={ref as React.Ref<View>}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
          style={style}
          {...props}
        >
          {children}
        </Pressable>
      </Animated.View>
    )
  }
)

AnimatedPressable.displayName = 'AnimatedPressable'
