import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Modal,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { StackScreenProps } from '@react-navigation/stack'
import { ChevronLeft, X, Minus, Plus, Calendar, MapPin } from 'lucide-react-native'
import { WebView } from 'react-native-webview'
import type { WebViewMessageEvent } from 'react-native-webview'
import { colors, sp, rd, fs } from '@comfytag/ui/tokens'
import { formatNaira } from '@comfytag/utils'
import { AnimatedPressable } from '../../../components/ui/AnimatedPressable'
import { useAuthStore } from '../../../store'
import {
  useInitiatePayment,
  useVerifyPayment,
  usePurchaseFreeTicket,
} from '../../../hooks'
import type { TicketTier } from '@comfytag/types'
import type { DiscoverStackParamList } from '../../../navigation/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = StackScreenProps<DiscoverStackParamList, 'Checkout'>

type ScreenState = 'idle' | 'initiating' | 'paying' | 'verifying' | 'error'

interface WebViewMessage {
  event: 'success' | 'cancel'
  reference?: string
}

// ─── Paystack HTML builder ────────────────────────────────────────────────────

function buildPaystackHtml(params: {
  publicKey: string
  email: string
  amountKobo: number
  reference: string
  eventName: string
}): string {
  const safeName = params.eventName.replace(/['"<>]/g, '')
  const safeEmail = params.email.replace(/['"<>]/g, '')
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="https://js.paystack.co/v1/inline.js"></script>
</head>
<body style="margin:0;background:#0D0D0D;">
<script>
  window.onload = function() {
    var handler = PaystackPop.setup({
      key: '${params.publicKey}',
      email: '${safeEmail}',
      amount: ${params.amountKobo},
      ref: '${params.reference}',
      metadata: { custom_fields: [{ display_name: 'Event', variable_name: 'event', value: '${safeName}' }] },
      onClose: function() {
        window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'cancel' }));
      },
      callback: function(response) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'success', reference: response.reference }));
      }
    });
    handler.openIframe();
  };
</script>
</body>
</html>`
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

interface TierRowProps {
  tier: TicketTier
  isSelected: boolean
  onPress: () => void
}

function TierRow({ tier, isSelected, onPress }: TierRowProps) {
  const available = tier.capacity - tier.sold
  const isSoldOut = available <= 0
  return (
    <AnimatedPressable
      onPress={onPress}
      hapticStyle="light"
      disabled={isSoldOut}
      style={[
        styles.tierRow,
        isSelected && styles.tierRowSelected,
        isSoldOut && styles.tierRowSoldOut,
      ]}
    >
      <Text style={[styles.tierName, isSoldOut && styles.tierTextMuted]}>
        {tier.name}
        {isSoldOut ? '  (Sold out)' : ''}
      </Text>
      <Text
        style={[
          styles.tierPrice,
          isSelected && styles.tierPriceSelected,
          isSoldOut && styles.tierTextMuted,
        ]}
      >
        {tier.price === 0 ? 'Free' : formatNaira(tier.price)}
      </Text>
    </AnimatedPressable>
  )
}

// ─── CheckoutScreen ───────────────────────────────────────────────────────────

export default function CheckoutScreen({ route, navigation }: Props) {
  const { eventId, eventName, eventDate, eventVenue, tiers, preSelectedTierId } =
    route.params

  const user = useAuthStore((s) => s.user)

  const firstAvailableTier = tiers.find((t) => t.capacity - t.sold > 0) ?? tiers[0]
  const initialTierId = preSelectedTierId ?? firstAvailableTier?._id ?? ''

  const [selectedTierId, setSelectedTierId] = useState<string>(initialTierId)
  const [quantity, setQuantity] = useState(1)
  const [screenState, setScreenState] = useState<ScreenState>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [pendingReference, setPendingReference] = useState<string>('')

  const { mutate: initiatePayment } = useInitiatePayment()
  const { mutate: verifyPayment } = useVerifyPayment()
  const { mutate: purchaseFreeTicket } = usePurchaseFreeTicket()

  const selectedTier: TicketTier | undefined = tiers.find(
    (t) => t._id === selectedTierId
  )

  const subtotal = useMemo(
    () => (selectedTier === undefined ? 0 : selectedTier.price * quantity),
    [selectedTier, quantity]
  )
  const platformFee = useMemo(() => Math.round(subtotal * 0.05), [subtotal])
  const totalAmount = useMemo(() => subtotal + platformFee, [subtotal, platformFee])
  const isFree = selectedTier !== undefined && selectedTier.price === 0

  const paystackHtml = useMemo(() => {
    if (user === null || selectedTier === undefined || pendingReference === '') return ''
    return buildPaystackHtml({
      publicKey: process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY ?? '',
      email: user.email,
      amountKobo: totalAmount * 100,
      reference: pendingReference,
      eventName,
    })
  }, [user, selectedTier, totalAmount, pendingReference, eventName])

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleTierSelect = (tier: TicketTier) => {
    if (tier.capacity - tier.sold <= 0) return
    setSelectedTierId(tier._id)
    setQuantity(1)
    setErrorMessage(null)
  }

  const handleDecrement = () => setQuantity((q) => Math.max(1, q - 1))

  const handleIncrement = () => {
    const available =
      selectedTier !== undefined ? selectedTier.capacity - selectedTier.sold : 0
    setQuantity((q) => Math.min(Math.min(10, available), q + 1))
  }

  const handleFreeClaim = () => {
    if (user === null || selectedTier === undefined) return
    setScreenState('initiating')
    setErrorMessage(null)
    purchaseFreeTicket(
      {
        eventId,
        tierId: selectedTierId,
        guestName: user.name,
        guestEmail: user.email,
        guestPhone: user.phone ?? '',
      },
      {
        onSuccess: (data) => {
          const ref =
            (data as { reference?: string }).reference ??
            (data as { data?: { reference?: string } }).data?.reference ??
            ''
          navigation.replace('OrderConfirmation', {
            eventName,
            tierName: selectedTier.name,
            quantity,
            totalAmount: 0,
            reference: ref,
          })
        },
        onError: () => {
          setScreenState('error')
          setErrorMessage('Could not claim free ticket. Please try again.')
        },
      }
    )
  }

  const handlePaidPress = () => {
    if (user === null || selectedTier === undefined) return
    setScreenState('initiating')
    setErrorMessage(null)
    initiatePayment(
      {
        eventId,
        tierId: selectedTierId,
        quantity,
        guestName: user.name,
        guestEmail: user.email,
        guestPhone: user.phone ?? '',
      },
      {
        onSuccess: (result) => {
          if (result === undefined) {
            setScreenState('error')
            setErrorMessage('Could not start payment. Please try again.')
            return
          }
          setPendingReference(result.reference)
          setScreenState('paying')
        },
        onError: () => {
          setScreenState('error')
          setErrorMessage('Could not start payment. Please try again.')
        },
      }
    )
  }

  const handleCTAPress = () => {
    if (isFree) {
      handleFreeClaim()
    } else {
      handlePaidPress()
    }
  }

  const handlePaystackCancel = () => setScreenState('idle')

  const handleWebViewMessage = (e: WebViewMessageEvent) => {
    let msg: WebViewMessage
    try {
      msg = JSON.parse(e.nativeEvent.data) as WebViewMessage
    } catch {
      return
    }

    if (msg.event === 'cancel') {
      setScreenState('idle')
      return
    }

    if (msg.event === 'success') {
      if (selectedTier === undefined) return
      const ref = msg.reference ?? pendingReference
      setScreenState('verifying')
      verifyPayment(
        { reference: ref },
        {
          onSuccess: () => {
            navigation.replace('OrderConfirmation', {
              eventName,
              tierName: selectedTier.name,
              quantity,
              totalAmount,
              reference: ref,
            })
          },
          onError: () => {
            setScreenState('error')
            setErrorMessage(
              `Payment received but ticket creation failed. Save this reference: ${ref}`
            )
          },
        }
      )
    }
  }

  const isCTABusy =
    screenState === 'initiating' || screenState === 'verifying'
  const isCTADisabled = isCTABusy || selectedTier === undefined

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Fixed Header */}
      <View style={styles.header}>
        <AnimatedPressable
          onPress={() => navigation.goBack()}
          hapticStyle="light"
          style={styles.backBtn}
        >
          <ChevronLeft size={22} color={colors.mobile.textPrimary} />
        </AnimatedPressable>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Verifying overlay */}
      {screenState === 'verifying' && (
        <View style={styles.verifyingOverlay}>
          <ActivityIndicator size="large" color={colors.brand.DEFAULT} />
          <Text style={styles.verifyingText}>Confirming your payment…</Text>
        </View>
      )}

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Event info card */}
        <View style={styles.eventCard}>
          <Text style={styles.eventName} numberOfLines={2}>
            {eventName}
          </Text>
          <View style={styles.eventInfoRow}>
            <Calendar size={14} color={colors.mobile.textSecondary} />
            <Text style={styles.eventInfoText}>{eventDate}</Text>
          </View>
          <View style={styles.eventInfoRow}>
            <MapPin size={14} color={colors.mobile.textSecondary} />
            <Text style={styles.eventInfoText}>{eventVenue}</Text>
          </View>
        </View>

        {/* Tier selector */}
        <Text style={styles.sectionLabel}>SELECT TICKET</Text>
        {tiers.map((tier) => (
          <TierRow
            key={tier._id}
            tier={tier}
            isSelected={tier._id === selectedTierId}
            onPress={() => handleTierSelect(tier)}
          />
        ))}

        {/* Inline error */}
        {errorMessage !== null && (
          <Text style={styles.inlineError}>{errorMessage}</Text>
        )}

        {/* Quantity selector */}
        <Text style={styles.sectionLabel}>QUANTITY</Text>
        <View style={styles.quantityRow}>
          <AnimatedPressable
            onPress={handleDecrement}
            hapticStyle="light"
            disabled={quantity <= 1}
            style={[styles.qtyBtn, quantity <= 1 && styles.qtyBtnDisabled]}
          >
            <Minus
              size={16}
              color={
                quantity <= 1 ? colors.mobile.textMuted : colors.mobile.textPrimary
              }
            />
          </AnimatedPressable>

          <Text style={styles.qtyCount}>{quantity}</Text>

          <AnimatedPressable
            onPress={handleIncrement}
            hapticStyle="light"
            disabled={
              quantity >= 10 ||
              (selectedTier !== undefined &&
                quantity >= selectedTier.capacity - selectedTier.sold)
            }
            style={[
              styles.qtyBtn,
              (quantity >= 10 ||
                (selectedTier !== undefined &&
                  quantity >= selectedTier.capacity - selectedTier.sold)) &&
                styles.qtyBtnDisabled,
            ]}
          >
            <Plus
              size={16}
              color={
                quantity >= 10 ? colors.mobile.textMuted : colors.mobile.textPrimary
              }
            />
          </AnimatedPressable>
        </View>

        {/* Order summary */}
        {selectedTier !== undefined && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                {selectedTier.name} × {quantity}
              </Text>
              <Text style={styles.summaryValue}>{formatNaira(subtotal)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Platform fee (5%)</Text>
              <Text style={styles.summaryValue}>{formatNaira(platformFee)}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryTotalLabel}>Total</Text>
              <Text style={styles.summaryTotalValue}>
                {isFree ? 'Free' : formatNaira(totalAmount)}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.bottomPad} />
      </ScrollView>

      {/* Fixed bottom CTA */}
      <View style={styles.ctaContainer}>
        <AnimatedPressable
          hapticStyle="medium"
          style={[styles.ctaButton, isCTADisabled && styles.ctaButtonDisabled]}
          onPress={handleCTAPress}
          disabled={isCTADisabled}
        >
          {isCTABusy ? (
            <ActivityIndicator size="small" color={colors.mobile.textPrimary} />
          ) : (
            <Text style={styles.ctaText}>
              {isFree ? 'Claim Free Ticket' : `Pay ${formatNaira(totalAmount)}`}
            </Text>
          )}
        </AnimatedPressable>
      </View>

      {/* Paystack Modal */}
      <Modal
        visible={screenState === 'paying'}
        animationType="slide"
        onRequestClose={handlePaystackCancel}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <AnimatedPressable onPress={handlePaystackCancel} hapticStyle="light">
              <X size={22} color={colors.mobile.textPrimary} />
            </AnimatedPressable>
            <Text style={styles.modalTitle}>Secure Payment</Text>
            <View style={styles.modalHeaderSpacer} />
          </View>
          {paystackHtml.length > 0 && (
            <WebView
              source={{ html: paystackHtml }}
              onMessage={handleWebViewMessage}
              javaScriptEnabled
              style={styles.webview}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.mobile.bg,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sp[4],
    paddingVertical: sp[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.mobile.border,
  },
  backBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: fs.base,
    fontWeight: '700',
    color: colors.mobile.textPrimary,
    textAlign: 'center',
  },
  headerSpacer: {
    minWidth: 44,
  },

  // ── Verifying overlay ─────────────────────────────────────────────────────
  verifyingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(13,13,13,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  verifyingText: {
    fontSize: fs.sm,
    color: colors.mobile.textSecondary,
    marginTop: sp[4],
  },

  // ── Scroll ────────────────────────────────────────────────────────────────
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: sp[4],
    paddingTop: sp[4],
  },

  // ── Event card ────────────────────────────────────────────────────────────
  eventCard: {
    backgroundColor: colors.mobile.surface,
    borderRadius: rd.lg,
    padding: sp[4],
    marginBottom: sp[5],
  },
  eventName: {
    fontSize: fs.base,
    fontWeight: '700',
    color: colors.mobile.textPrimary,
    marginBottom: sp[3],
    lineHeight: 22,
  },
  eventInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp[2],
    marginBottom: sp[2],
  },
  eventInfoText: {
    fontSize: fs.sm,
    color: colors.mobile.textSecondary,
    flex: 1,
  },

  // ── Section label ─────────────────────────────────────────────────────────
  sectionLabel: {
    fontSize: fs.sm,
    color: colors.mobile.textMuted,
    letterSpacing: 1,
    marginBottom: sp[3],
    fontWeight: '600',
  },

  // ── Tier rows ─────────────────────────────────────────────────────────────
  tierRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.mobile.surface,
    borderWidth: 1,
    borderColor: colors.mobile.border,
    borderRadius: rd.lg,
    padding: sp[4],
    marginBottom: sp[2],
    minHeight: 56,
  },
  tierRowSelected: {
    backgroundColor: colors.brand.DEFAULT,
    borderColor: colors.brand.DEFAULT,
  },
  tierRowSoldOut: {
    opacity: 0.4,
  },
  tierName: {
    fontSize: fs.sm,
    fontWeight: '700',
    color: colors.mobile.textPrimary,
    flex: 1,
  },
  tierPrice: {
    fontSize: fs.sm,
    fontWeight: '700',
    color: colors.mobile.textSecondary,
    marginLeft: sp[3],
  },
  tierPriceSelected: {
    color: colors.mobile.textPrimary,
  },
  tierTextMuted: {
    color: colors.mobile.textMuted,
  },

  // ── Inline error ──────────────────────────────────────────────────────────
  inlineError: {
    fontSize: fs.sm,
    color: colors.mobile.error,
    marginBottom: sp[3],
    lineHeight: 20,
  },

  // ── Quantity ──────────────────────────────────────────────────────────────
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: sp[5],
    gap: sp[4],
  },
  qtyBtn: {
    width: 44,
    height: 44,
    borderRadius: rd.full,
    backgroundColor: colors.mobile.surface,
    borderWidth: 1,
    borderColor: colors.mobile.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnDisabled: {
    opacity: 0.4,
  },
  qtyCount: {
    fontSize: fs.base,
    fontWeight: '700',
    color: colors.mobile.textPrimary,
    minWidth: 32,
    textAlign: 'center',
  },

  // ── Order summary ─────────────────────────────────────────────────────────
  summaryCard: {
    backgroundColor: colors.mobile.surface,
    borderRadius: rd.lg,
    padding: sp[4],
    marginBottom: sp[4],
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: sp[3],
  },
  summaryLabel: {
    fontSize: fs.sm,
    color: colors.mobile.textSecondary,
  },
  summaryValue: {
    fontSize: fs.sm,
    color: colors.mobile.textSecondary,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.mobile.border,
    marginBottom: sp[3],
  },
  summaryTotalLabel: {
    fontSize: fs.base,
    fontWeight: '700',
    color: colors.mobile.textPrimary,
  },
  summaryTotalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.brand.DEFAULT,
  },

  // ── Bottom pad ────────────────────────────────────────────────────────────
  bottomPad: {
    height: sp[4],
  },

  // ── CTA ───────────────────────────────────────────────────────────────────
  ctaContainer: {
    paddingHorizontal: sp[4],
    paddingBottom: sp[6],
    paddingTop: sp[3],
    backgroundColor: colors.mobile.bg,
    borderTopWidth: 1,
    borderTopColor: colors.mobile.border,
  },
  ctaButton: {
    backgroundColor: colors.brand.DEFAULT,
    height: 56,
    borderRadius: rd.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonDisabled: {
    opacity: 0.6,
  },
  ctaText: {
    fontSize: fs.base,
    fontWeight: '700',
    color: colors.mobile.textPrimary,
  },

  // ── Paystack Modal ────────────────────────────────────────────────────────
  modalContainer: {
    flex: 1,
    backgroundColor: colors.mobile.bg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sp[4],
    paddingVertical: sp[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.mobile.border,
  },
  modalTitle: {
    flex: 1,
    fontSize: fs.base,
    fontWeight: '700',
    color: colors.mobile.textPrimary,
    textAlign: 'center',
  },
  modalHeaderSpacer: {
    width: 22,
  },
  webview: {
    flex: 1,
    backgroundColor: colors.mobile.bg,
  },
})
