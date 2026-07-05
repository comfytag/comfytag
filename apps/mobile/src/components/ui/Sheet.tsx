import React, { useEffect, useRef } from 'react'
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Dimensions,
  ScrollView,
  ViewStyle,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, sp, rd, fs } from '@comfytag/ui/tokens'

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface SheetProps {
  visible: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  snapHeight?: 'sm' | 'md' | 'lg' | 'full'
  style?: ViewStyle
}

const { height: SCREEN_H } = Dimensions.get('window')

const SNAP_HEIGHTS: Record<string, number> = {
  sm:   SCREEN_H * 0.35,
  md:   SCREEN_H * 0.55,
  lg:   SCREEN_H * 0.80,
  full: SCREEN_H * 0.93,
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function Sheet({
  visible,
  onClose,
  title,
  children,
  snapHeight = 'md',
  style,
}: SheetProps) {
  const insets = useSafeAreaInsets()
  const translateY = useRef(new Animated.Value(SCREEN_H)).current
  const opacity = useRef(new Animated.Value(0)).current
  const sheetH = SNAP_HEIGHTS[snapHeight]

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          damping: 25,
          stiffness: 300,
          mass: 0.9,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SCREEN_H,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [visible, opacity, translateY])

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          {
            height: sheetH,
            transform: [{ translateY }],
            paddingBottom: insets.bottom + sp[4],
          },
          style,
        ]}
      >
        {/* Handle */}
        <View style={styles.handle} />

        {/* Header */}
        {title !== undefined && (
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Content */}
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </Animated.View>
    </Modal>
  )
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.mobile.surface,
    borderTopLeftRadius: rd['2xl'],
    borderTopRightRadius: rd['2xl'],
    overflow: 'hidden',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.mobile.border,
    borderRadius: rd.full,
    alignSelf: 'center',
    marginTop: sp[3],
    marginBottom: sp[2],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sp[5],
    paddingVertical: sp[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.mobile.border,
  },
  title: {
    fontSize: fs.lg,
    fontWeight: '700',
    color: colors.mobile.textPrimary,
  },
  closeText: {
    fontSize: fs.lg,
    color: colors.mobile.textSecondary,
  },
  content: {
    padding: sp[5],
  },
})
