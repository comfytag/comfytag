import React, { useEffect, useRef } from 'react'
import { Animated, View, Text, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { StackScreenProps } from '@react-navigation/stack'
import { CheckCircle2 } from 'lucide-react-native'
import { colors, sp, rd, fs } from '@comfytag/ui/tokens'
import { formatNaira } from '@comfytag/utils'
import { AnimatedPressable } from '../../../components/ui/AnimatedPressable'
import { navigateToTabOrLogin } from '../../../lib/navigation'
import type { DiscoverStackParamList } from '../../../navigation/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = StackScreenProps<DiscoverStackParamList, 'OrderConfirmation'>

// ─── OrderConfirmationScreen ──────────────────────────────────────────────────

export default function OrderConfirmationScreen({ route, navigation }: Props) {
  const { eventName, tierName, quantity, totalAmount, reference } = route.params

  const pulseScale = useRef(new Animated.Value(0.6)).current
  const pulseOpacity = useRef(new Animated.Value(0.8)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.parallel([
        Animated.timing(pulseScale, {
          toValue: 1.4,
          duration: 1600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseOpacity, {
          toValue: 0,
          duration: 1600,
          useNativeDriver: true,
        }),
      ])
    )
    loop.start()
    return () => {
      loop.stop()
      pulseScale.setValue(0.6)
      pulseOpacity.setValue(0.8)
    }
  }, [pulseScale, pulseOpacity])

  const handleViewTickets = () => {
    navigateToTabOrLogin(navigation, 'Tickets')
  }

  const handleBackToEvents = () => {
    navigation.popToTop()
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.inner}>
        {/* Success icon */}
        <View style={styles.iconWrap}>
          <Animated.View
            style={[
              styles.pulseRing,
              { transform: [{ scale: pulseScale }], opacity: pulseOpacity },
            ]}
          />
          <View style={styles.iconCircle}>
            <CheckCircle2 size={48} color="#FFFFFF" />
          </View>
        </View>

        {/* Heading */}
        <Text style={styles.heading}>You're in!</Text>
        <Text style={styles.subtitle}>
          Your ticket for {eventName} is confirmed. We've also sent a confirmation to your email.
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

        {/* Support text */}
        <Text style={styles.supportText}>
          Need help? Contact <Text style={styles.supportLink}>ComfyTag Support</Text>
        </Text>
      </View>
    </SafeAreaView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.public.bg,
  },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: sp[6],
  },

  // ── Icon ──────────────────────────────────────────────────────────────────
  iconWrap: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: sp[5],
  },
  pulseRing: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: rd.full,
    backgroundColor: colors.brand.DEFAULT,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: rd.full,
    backgroundColor: colors.brand.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Text ──────────────────────────────────────────────────────────────────
  heading: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPublic.primary,
    textAlign: 'center',
    marginBottom: sp[2],
  },
  subtitle: {
    fontSize: fs.sm,
    color: colors.textPublic.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: sp[6],
  },

  // ── Details card ──────────────────────────────────────────────────────────
  card: {
    width: '100%',
    backgroundColor: colors.public.surface,
    borderRadius: rd.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.public.border,
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
    color: colors.textPublic.muted,
  },
  cardValue: {
    fontSize: fs.sm,
    color: colors.textPublic.primary,
    fontWeight: '600',
  },
  cardReference: {
    fontSize: fs.sm,
    color: colors.textPublic.primary,
    fontFamily: 'monospace',
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.public.border,
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
    color: '#FFFFFF',
  },
  secondaryBtn: {
    height: 52,
    borderRadius: rd.full,
    borderWidth: 1,
    borderColor: colors.public.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  secondaryBtnText: {
    fontSize: fs.base,
    fontWeight: '600',
    color: colors.textPublic.secondary,
  },

  // ── Support text ──────────────────────────────────────────────────────────
  supportText: {
    fontSize: fs.xs,
    color: colors.textPublic.muted,
    textAlign: 'center',
    marginTop: sp[6],
  },
  supportLink: {
    color: colors.brand.DEFAULT,
    fontWeight: '600',
  },
})
