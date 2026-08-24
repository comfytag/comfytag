import React, { useState } from 'react'
import {
  View,
  TextInput as RNTextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInputProps as RNTextInputProps,
  ViewStyle,
} from 'react-native'
import { colors, sp, rd, fs } from '@comfytag/ui/tokens'

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface TextInputProps extends Omit<RNTextInputProps, 'style'> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  onRightIconPress?: () => void
  containerStyle?: ViewStyle
  secureToggle?: boolean
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function TextInput({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  secureToggle = false,
  secureTextEntry,
  ...props
}: TextInputProps) {
  const [focused, setFocused] = useState(false)
  const [hidden, setHidden] = useState(secureTextEntry ?? false)

  const hasError = !!error
  const borderColor = hasError
    ? colors.error.DEFAULT
    : focused
    ? colors.public.borderFocus
    : colors.public.border

  return (
    <View style={[styles.container, containerStyle]}>
      {label !== undefined && (
        <Text style={styles.label}>{label}</Text>
      )}

      <View style={[styles.inputRow, { borderColor }]}>
        {leftIcon !== undefined && (
          <View style={styles.leftIcon}>{leftIcon}</View>
        )}

        <RNTextInput
          style={[styles.input, leftIcon ? styles.inputWithLeft : undefined]}
          placeholderTextColor={colors.textPublic.muted}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          secureTextEntry={secureToggle ? hidden : secureTextEntry}
          {...props}
        />

        {secureToggle ? (
          <TouchableOpacity
            style={styles.rightIcon}
            onPress={() => setHidden((h) => !h)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.toggleText}>{hidden ? 'Show' : 'Hide'}</Text>
          </TouchableOpacity>
        ) : rightIcon !== undefined ? (
          <TouchableOpacity
            style={styles.rightIcon}
            onPress={onRightIconPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            disabled={onRightIconPress === undefined}
          >
            {rightIcon}
          </TouchableOpacity>
        ) : null}
      </View>

      {hasError ? (
        <Text style={styles.error}>{error}</Text>
      ) : hint !== undefined ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  )
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    marginBottom: sp[4],
  },
  label: {
    fontSize: fs.sm,
    fontWeight: '500',
    color: colors.textPublic.secondary,
    marginBottom: sp[1],
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.public.surface,
    borderRadius: rd.md,
    borderWidth: 1.5,
    minHeight: 52,
    paddingHorizontal: sp[4],
  },
  leftIcon: {
    marginRight: sp[2],
  },
  rightIcon: {
    marginLeft: sp[2],
  },
  input: {
    flex: 1,
    fontSize: fs.base,
    color: colors.textPublic.primary,
    paddingVertical: sp[3],
  },
  inputWithLeft: {
    paddingLeft: 0,
  },
  toggleText: {
    fontSize: fs.sm,
    color: colors.brand.DEFAULT,
    fontWeight: '500',
  },
  error: {
    fontSize: fs.xs,
    color: colors.error.DEFAULT,
    marginTop: sp[1],
  },
  hint: {
    fontSize: fs.xs,
    color: colors.textPublic.muted,
    marginTop: sp[1],
  },
})
