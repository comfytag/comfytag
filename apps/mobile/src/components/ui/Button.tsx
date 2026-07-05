import React from 'react'
import {
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native'
import { AnimatedPressable } from './AnimatedPressable'
import { colors, sp, rd, fs } from '@comfytag/ui/tokens'

// ─── Types ─────────────────────────────────────────────────────────────────────

export type ButtonVariant = 'primary' | 'brand' | 'ghost' | 'outline' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps {
  onPress: () => void
  label: string
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  disabled?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  style?: ViewStyle
  textStyle?: TextStyle
  fullWidth?: boolean
}

// ─── Variant styles ────────────────────────────────────────────────────────────

const variantStyles: Record<
  ButtonVariant,
  { bg: string; text: string; border?: string }
> = {
  primary: {
    bg: colors.mobile.btnPrimaryBg,
    text: colors.mobile.btnPrimaryText,
  },
  brand: {
    bg: colors.mobile.btnBrandBg,
    text: colors.mobile.textOnBrand,
  },
  ghost: {
    bg: 'transparent',
    text: colors.mobile.textPrimary,
    border: colors.mobile.btnGhostBorder,
  },
  outline: {
    bg: 'transparent',
    text: colors.brand.DEFAULT,
    border: colors.brand.DEFAULT,
  },
  danger: {
    bg: 'transparent',
    text: colors.mobile.error,
    border: colors.mobile.error,
  },
}

const sizeStyles: Record<
  ButtonSize,
  { height: number; fontSize: number; paddingH: number; iconSize: number }
> = {
  sm: { height: 36, fontSize: fs.sm, paddingH: sp[4], iconSize: 14 },
  md: { height: 48, fontSize: fs.base, paddingH: sp[6], iconSize: 16 },
  lg: { height: 56, fontSize: fs.lg, paddingH: sp[8], iconSize: 18 },
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function Button({
  onPress,
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  fullWidth = true,
}: ButtonProps) {
  const v = variantStyles[variant]
  const s = sizeStyles[size]
  const isDisabled = disabled || loading

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={isDisabled}
      hapticStyle="medium"
      scaleDown={0.97}
      style={[
        styles.base,
        {
          backgroundColor: v.bg,
          borderColor: v.border ?? 'transparent',
          borderWidth: v.border ? 1.5 : 0,
          height: s.height,
          paddingHorizontal: s.paddingH,
          width: fullWidth ? '100%' : undefined,
          opacity: isDisabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={v.text}
          size={size === 'sm' ? 'small' : 'small'}
        />
      ) : (
        <>
          {icon !== undefined && iconPosition === 'left' && (
            <>{icon}</>
          )}
          <Text
            style={[
              styles.label,
              { color: v.text, fontSize: s.fontSize },
              textStyle,
            ]}
          >
            {label}
          </Text>
          {icon !== undefined && iconPosition === 'right' && (
            <>{icon}</>
          )}
        </>
      )}
    </AnimatedPressable>
  )
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: rd.full,
    gap: sp[2],
  },
  label: {
    fontWeight: '600',
    letterSpacing: 0.1,
  },
})
