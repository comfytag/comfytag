import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { colors, sp, rd, fs } from '@comfytag/ui/tokens'

// Content is bottom-anchored (flush against the home indicator / safe area),
// so the bar only needs to be tall enough for the icon+label stack itself —
// no top padding to balance out.
const TAB_BAR_HEIGHT = 48

// ─── Component ─────────────────────────────────────────────────────────────────

interface Props extends BottomTabBarProps {
  /** Which surface this tab bar renders on — dark (organizer) or light (attendee). */
  theme?: 'dark' | 'light'
}

// Every tab renders the same way — icon + label stacked, color-only focus
// state (no pill background). No special center/FAB tab.
export function SharedTabBar({ state, descriptors, navigation, theme = 'dark' }: Props) {
  const insets = useSafeAreaInsets()
  const isLight = theme === 'light'
  const barBg = isLight ? colors.public.surface : colors.mobile.surface
  const barBorder = isLight ? colors.public.border : colors.mobile.border
  const textMuted = isLight ? colors.textPublic.muted : colors.mobile.textMuted

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: barBg,
          borderTopColor: barBorder,
          paddingBottom: insets.bottom,
          minHeight: TAB_BAR_HEIGHT + insets.bottom,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key]
        const label = options.tabBarLabel ?? options.title ?? route.name
        const focused = state.index === index
        const color = focused ? colors.brand.DEFAULT : textMuted

        const onPress = () => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          })
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name)
          }
        }

        const onLongPress = () => {
          navigation.emit({ type: 'tabLongPress', target: route.key })
        }

        const accessibilityLabel = typeof label === 'string' ? label : route.name

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            onLongPress={onLongPress}
            accessibilityRole="button"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={accessibilityLabel}
            style={styles.tab}
          >
            <View style={styles.tabPill}>
              <View style={[styles.indicator, focused && { backgroundColor: colors.brand.DEFAULT }]} />
              {typeof options.tabBarIcon === 'function'
                ? options.tabBarIcon({ focused, color, size: focused ? 23 : 21 })
                : null}
              {typeof label === 'string' && (
                <Text style={[styles.label, { color }, focused && styles.labelActive]} numberOfLines={1}>
                  {label}
                </Text>
              )}
            </View>
          </Pressable>
        )
      })}
    </View>
  )
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: 1,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    minHeight: 36,
  },
  tabPill: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: sp[3],
  },
  indicator: {
    width: sp[4],
    height: 3,
    borderRadius: rd.full,
    backgroundColor: 'transparent',
  },
  label: {
    fontSize: fs.xs,
    fontWeight: '600',
  },
  labelActive: {
    fontWeight: '800',
  },
})
