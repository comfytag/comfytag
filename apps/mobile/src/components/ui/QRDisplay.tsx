// Requires: pnpm add react-native-qrcode-svg  (run in apps/mobile/)
import React from 'react'
import { View, Text, StyleSheet, ViewStyle } from 'react-native'
import QRCode from 'react-native-qrcode-svg'
import { colors, sp, rd } from '@comfytag/ui/tokens'

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface QRDisplayProps {
  value: string
  size?: number
  label?: string
  style?: ViewStyle
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function QRDisplay({
  value,
  size = 220,
  label,
  style,
}: QRDisplayProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={[styles.qrWrapper, { width: size + 32, padding: sp[4] }]}>
        <QRCode
          value={value}
          size={size}
          color="#000000"
          backgroundColor="#FFFFFF"
          quietZone={8}
        />
      </View>
      {label !== undefined && (
        <Text style={styles.label}>{label}</Text>
      )}
    </View>
  )
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  qrWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: rd.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginTop: sp[3],
    fontSize: 12,
    color: colors.mobile.textMuted,
    fontFamily: 'monospace',
    letterSpacing: 2,
  },
})
