import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { StackScreenProps } from '@react-navigation/stack'
import { useNavigation } from '@react-navigation/native'
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import { CheckCircle2 } from 'lucide-react-native'
import { colors, sp, rd, fs } from '@comfytag/ui/tokens'
import { formatNaira } from '@comfytag/utils'
import { AnimatedPressable } from '../../../components/ui/AnimatedPressable'
import type { DiscoverStackParamList } from '../../../navigation/types'
import type { AttendeeTabParamList } from '../../../navigation/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = StackScreenProps<DiscoverStackParamList, 'OrderConfirmation'>
type TabNav = BottomTabNavigationProp<AttendeeTabParamList>

// ─── OrderConfirmationScreen ──────────────────────────────────────────────────

export default function OrderConfirmationScreen({ route, navigation }: Props) {
  const { eventName, tierName, quantity, totalAmount, reference } = route.params
  const tabNavigation = useNavigation<TabNav>()

  const handleViewTickets = () => {
    tabNavigation.navigate('Tickets')
  }

  const handleBackToEvents = () => {
    navigation.popToTop()
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.inner}>
        {/* Success icon */}
        <View style={styles.iconCircle}>
          <CheckCircle2 size={48} color={colors.mobile.textPrimary} />
        </View>

        {/* Heading */}
        <Text style={styles.heading}>You're in!</Text>
        <Text style={styles.subtitle}>
          Your ticket for {eventName} is confirmed.
        </Text>

        {/* Details card */}
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Ticket</Text>
            <Text style={styles.cardReference}>{reference}</Text>
          </View>
          <View style={styles.cardDivider} />
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Tier</Text>
            <Text style={styles.cardValue}>{tierName}</Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Qty</Text>
            <Text style={styles.cardValue}>{quantity}</Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Paid</Text>
            <Text style={styles.cardPaidValue}>{formatNaira(totalAmount)}</Text>
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.buttons}>
          <AnimatedPressable
            hapticStyle="medium"
            style={styles.primaryBtn}
            onPress={handleViewTickets}
          >
            <Text style={styles.primaryBtnText}>View My Tickets</Text>
          </AnimatedPressable>
          <AnimatedPressable
            hapticStyle="light"
            style={styles.secondaryBtn}
            onPress={handleBackToEvents}
          >
            <Text style={styles.secondaryBtnText}>Back to Events</Text>
          </AnimatedPressable>
        </View>
      </View>
    </SafeAreaView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.mobile.bg,
  },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: sp[6],
  },

  // ── Icon ──────────────────────────────────────────────────────────────────
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: rd.full,
    backgroundColor: colors.brand.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: sp[5],
  },

  // ── Text ──────────────────────────────────────────────────────────────────
  heading: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.mobile.textPrimary,
    textAlign: 'center',
    marginBottom: sp[2],
  },
  subtitle: {
    fontSize: fs.sm,
    color: colors.mobile.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: sp[6],
  },

  // ── Details card ──────────────────────────────────────────────────────────
  card: {
    width: '100%',
    backgroundColor: colors.mobile.surface,
    borderRadius: 20,
    padding: sp[6],
    marginBottom: sp[8],
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: sp[3],
  },
  cardLabel: {
    fontSize: fs.sm,
    color: colors.mobile.textMuted,
  },
  cardValue: {
    fontSize: fs.sm,
    color: colors.mobile.textPrimary,
    fontWeight: '600',
  },
  cardReference: {
    fontSize: fs.sm,
    color: colors.mobile.textPrimary,
    fontFamily: 'monospace',
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.mobile.border,
    marginBottom: sp[3],
  },
  cardPaidValue: {
    fontSize: fs.sm,
    color: colors.brand.DEFAULT,
    fontWeight: '700',
  },

  // ── Buttons ───────────────────────────────────────────────────────────────
  buttons: {
    width: '100%',
    gap: sp[3],
  },
  primaryBtn: {
    backgroundColor: colors.brand.DEFAULT,
    height: 52,
    borderRadius: rd.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontSize: fs.base,
    fontWeight: '700',
    color: colors.mobile.textPrimary,
  },
  secondaryBtn: {
    height: 52,
    borderRadius: rd.full,
    borderWidth: 1,
    borderColor: colors.mobile.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  secondaryBtnText: {
    fontSize: fs.base,
    fontWeight: '600',
    color: colors.mobile.textSecondary,
  },
})
