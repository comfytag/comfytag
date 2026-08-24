import React, { useRef, useState } from 'react'
import {
  View,
  TextInput,
  StyleSheet,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from 'react-native'
import { colors, sp, rd, fs } from '@comfytag/ui/tokens'

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface OTPInputProps {
  length?: number
  onComplete: (otp: string) => void
  onChangeOTP?: (otp: string) => void
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function OTPInput({ length = 6, onComplete, onChangeOTP }: OTPInputProps) {
  const [otp, setOtp] = useState<string[]>(Array(length).fill(''))
  const refs = useRef<(TextInput | null)[]>([])

  const handleChange = (text: string, index: number) => {
    const digits = text.replace(/[^0-9]/g, '')

    if (digits.length > 1) {
      const next = [...otp]
      for (let i = 0; i < digits.length && index + i < length; i++) {
        next[index + i] = digits[i]
      }
      setOtp(next)

      const joined = next.join('')
      onChangeOTP?.(joined)

      const nextIndex = Math.min(index + digits.length, length - 1)
      refs.current[nextIndex]?.focus()

      if (joined.length === length && !joined.includes('')) {
        onComplete(joined)
      }
      return
    }

    const digit = digits.slice(-1)
    const next = [...otp]
    next[index] = digit
    setOtp(next)

    const joined = next.join('')
    onChangeOTP?.(joined)

    if (digit && index < length - 1) {
      refs.current[index + 1]?.focus()
    }
    if (joined.length === length && !joined.includes('')) {
      onComplete(joined)
    }
  }

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number
  ) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      refs.current[index - 1]?.focus()
    }
  }

  return (
    <View style={styles.container}>
      {otp.map((digit, i) => (
        <TextInput
          key={i}
          ref={(r) => {
            refs.current[i] = r
          }}
          style={[styles.cell, digit ? styles.cellFilled : undefined]}
          value={digit}
          onChangeText={(t) => handleChange(t, i)}
          onKeyPress={(e) => handleKeyPress(e, i)}
          keyboardType="number-pad"
          maxLength={length}
          selectTextOnFocus
          textAlign="center"
        />
      ))}
    </View>
  )
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: sp[3],
    justifyContent: 'center',
  },
  cell: {
    width: 48,
    height: 56,
    backgroundColor: colors.public.surface,
    borderRadius: rd.md,
    borderWidth: 1.5,
    borderColor: colors.public.border,
    fontSize: fs['2xl'],
    fontWeight: '700',
    color: colors.textPublic.primary,
    textAlign: 'center',
  },
  cellFilled: {
    borderColor: colors.brand.DEFAULT,
  },
})
