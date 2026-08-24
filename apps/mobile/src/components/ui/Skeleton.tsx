import React, { useRef, useEffect } from 'react'
import { Animated, View, StyleSheet, ViewStyle } from 'react-native'
import { colors, rd } from '@comfytag/ui/tokens'

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface SkeletonProps {
  width?: number | `${number}%`
  height?: number
  borderRadius?: number
  style?: ViewStyle
}

export interface SkeletonCircleProps {
  size?: number
  style?: ViewStyle
}

// ─── Pulse animation ───────────────────────────────────────────────────────────

function usePulse() {
  const opacity = useRef(new Animated.Value(0.3)).current
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    )
    anim.start()
    return () => anim.stop()
  }, [opacity])
  return opacity
}

// ─── Skeleton rectangle ────────────────────────────────────────────────────────

export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = rd.sm,
  style,
}: SkeletonProps) {
  const opacity = usePulse()
  return (
    <Animated.View
      style={[
        styles.base,
        { width: width as ViewStyle['width'], height, borderRadius, opacity },
        style,
      ]}
    />
  )
}

// ─── Skeleton circle ───────────────────────────────────────────────────────────

export function SkeletonCircle({ size = 40, style }: SkeletonCircleProps) {
  const opacity = usePulse()
  return (
    <Animated.View
      style={[
        styles.base,
        { width: size, height: size, borderRadius: size / 2, opacity },
        style,
      ]}
    />
  )
}

// ─── Skeleton row (label + value pattern) ─────────────────────────────────────

export function SkeletonRow({
  labelWidth = 80,
  valueWidth = 120,
}: {
  labelWidth?: number
  valueWidth?: number
}) {
  return (
    <View style={styles.row}>
      <Skeleton width={labelWidth} height={12} />
      <Skeleton width={valueWidth} height={14} style={styles.rowValue} />
    </View>
  )
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.public.surfaceAlt,
  },
  row: {
    gap: 6,
  },
  rowValue: {
    marginTop: 4,
  },
})
