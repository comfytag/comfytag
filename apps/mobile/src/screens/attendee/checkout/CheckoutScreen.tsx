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
import { ChevronLeft, X, Minus, Plus, Calendar, MapPin, CreditCard, Landmark, ShieldCheck } from 'lucide-react-native'
import { WebView } from 'react-native-webview'
import type { WebViewMessageEvent } from 'react-native-webview'
import { colors, sp, rd, fs } from '@comfytag/ui/tokens'
import { formatNaira, calculateTicketCharge } from '@comfytag/utils'
import { AnimatedPressable } from '../../../components/ui/AnimatedPressable'
import { useAuthStore } from '../../../store'
import { navigateUpTo } from '../../../lib/navigation'
import {
  useVerifyPayment,
  useCreatePaidTicket,
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
  channels: string[]
  userId: string
  eventId: string
  tierName: string
  numOfTicket: number
  name: string
  phone: string
}): string {
  const safeName = params.eventName.replace(/['"<>]/g, '')
  const safeEmail = params.email.replace(/['"<>]/g, '')
  const channelsJson = JSON.stringify(params.channels)
  // Lets the webhook rebuild this exact ticket if the client never completes
  // the create-ticket call after a successful charge.
  const metadataJson = JSON.stringify({
    userId: params.userId,
    eventId: params.eventId,
    tierName: params.tierName,
    numOfTicket: params.numOfTicket,
    name: params.name,
    email: params.email,
    phone: params.phone,
    custom_fields: [{ display_name: 'Event', variable_name: 'event', value: safeName }],
  })
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="https://js.paystack.co/v1/inline.js"></script>
</head>
<body style="margin:0;background:#FAFAF9;">
<script>
  window.onload = function() {
    var handler = PaystackPop.setup({
      key: '${params.publicKey}',
      email: '${safeEmail}',
      amount: ${params.amountKobo},
      ref: '${params.reference}',
      channels: ${channelsJson},
      metadata: ${metadataJson},
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
      <Text
        style={[
          styles.tierName,
          isSelected && styles.tierNameSelected,
          isSoldOut && styles.tierTextMuted,
        ]}
      >
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

interface PaymentMethodRowProps {
  icon: React.ReactNode
  title: string
  subtitle: string
  isSelected: boolean
  onPress: () => void
}

function PaymentMethodRow({ icon, title, subtitle, isSelected, onPress }: PaymentMethodRowProps) {
  return (
    <AnimatedPressable
      onPress={onPress}
      hapticStyle="light"
      style={[styles.paymentRow, isSelected && styles.paymentRowSelected]}
    >
      <View style={styles.paymentIconWrap}>{icon}</View>
      <View style={styles.paymentTextWrap}>
        <Text style={styles.paymentTitle}>{title}</Text>
        <Text style={styles.paymentSubtitle}>{subtitle}</Text>
      </View>
      <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
        {isSelected && <View style={styles.radioInner} />}
      </View>
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
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank'>('card')
  const [screenState, setScreenState] = useState<ScreenState>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [pendingReference, setPendingReference] = useState<string>('')

  const { mutate: verifyPayment } = useVerifyPayment()
  const { mutate: createPaidTicket } = useCreatePaidTicket()
  const { mutate: purchaseFreeTicket } = usePurchaseFreeTicket()

  const selectedTier: TicketTier | undefined = tiers.find(
    (t) => t._id === selectedTierId
  )

  const charge = useMemo(
    () =>
      selectedTier === undefined
        ? { subtotal: 0, buyerFee: 0, organizerFee: 0, totalCharge: 0, organizerNet: 0 }
        : calculateTicketCharge(selectedTier.price, quantity),
    [selectedTier, quantity]
  )
  const subtotal = charge.subtotal
  const processingFee = charge.buyerFee
  const totalAmount = charge.totalCharge
  const isFree = selectedTier !== undefined && selectedTier.price === 0

  const paystackHtml = useMemo(() => {
    if (user === null || selectedTier === undefined || pendingReference === '') return ''
    return buildPaystackHtml({
      publicKey: process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY ?? '',
      email: user.email,
      amountKobo: totalAmount * 100,
      reference: pendingReference,
      eventName,
      channels: paymentMethod === 'card' ? ['card'] : ['bank_transfer'],
      userId: user._id,
      eventId,
      tierName: selectedTier.name,
      numOfTicket: quantity,
      name: user.name,
      phone: user.phone ?? '',
    })
  }, [user, selectedTier, totalAmount, pendingReference, eventName, paymentMethod, eventId, quantity])

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
        tierName: selectedTier.name,
        eventname: eventName,
        numOfTicket: quantity,
        name: user.name,
        email: user.email,
        phone: user.phone ?? '',
        userId: user._id,
      },
      {
        onSuccess: (ticket) => {
          navigation.replace('OrderConfirmation', {
            eventName,
            tierName: selectedTier.name,
            quantity,
            totalAmount: 0,
            reference: ticket.reference,
          })
        },
        onError: () => {
          setScreenState('error')
          setErrorMessage('Could not claim free ticket. Please try again.')
        },
      }
    )
  }

  // No server round-trip needed to "start" a paid checkout — Paystack's inline
  // popup only needs a unique reference, which we can mint client-side. The
  // reference is verified server-side (useVerifyPayment) once Paystack confirms
  // the charge, before it's ever used to create a ticket.
  const handlePaidPress = () => {
    if (user === null || selectedTier === undefined) return
    setErrorMessage(null)
    const reference = `CT_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    setPendingReference(reference)
    setScreenState('paying')
  }

  const handleCTAPress = () => {
    // Guests can browse and configure the whole order; an account is only
    // required at the point of actually paying/claiming.
    if (user === null) {
      navigateUpTo(navigation, 'Login')
      return
    }
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
      if (selectedTier === undefined || user === null) return
      const ref = msg.reference ?? pendingReference
      setScreenState('verifying')
      verifyPayment(
        { reference: ref },
        {
          onSuccess: (result) => {
            if (result === undefined || !result.charged) {
              setScreenState('error')
              setErrorMessage(
                `Payment could not be confirmed. Save this reference and contact support: ${ref}`
              )
              return
            }
            createPaidTicket(
              {
                userId: user._id,
                eventId,
                tierName: selectedTier.name,
                eventname: eventName,
                numOfTicket: quantity,
                name: user.name,
                email: user.email,
                phone: user.phone ?? '',
                reference: ref,
              },
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
          },
          onError: () => {
            setScreenState('error')
            setErrorMessage(
              `Payment received but verification failed. Save this reference: ${ref}`
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
          <ChevronLeft size={22} color={colors.textPublic.primary} />
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
            <Calendar size={14} color={colors.textPublic.secondary} />
            <Text style={styles.eventInfoText}>{eventDate}</Text>
          </View>
          <View style={styles.eventInfoRow}>
            <MapPin size={14} color={colors.textPublic.secondary} />
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
                quantity <= 1 ? colors.textPublic.muted : colors.textPublic.primary
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
                quantity >= 10 ? colors.textPublic.muted : colors.textPublic.primary
              }
            />
          </AnimatedPressable>
        </View>

        {/* Payment method selector (paid tickets only) */}
        {!isFree && (
          <>
            <Text style={styles.sectionLabel}>PAYMENT METHOD</Text>
            <PaymentMethodRow
              icon={<CreditCard size={18} color={colors.textPublic.secondary} />}
              title="Debit / Credit Card"
              subtitle="Pay securely with Visa or Mastercard"
              isSelected={paymentMethod === 'card'}
              onPress={() => setPaymentMethod('card')}
            />
            <PaymentMethodRow
              icon={<Landmark size={18} color={colors.textPublic.secondary} />}
              title="Bank Transfer"
              subtitle="Direct transfer from your bank app"
              isSelected={paymentMethod === 'bank'}
              onPress={() => setPaymentMethod('bank')}
            />
          </>
        )}

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
              <Text style={styles.summaryLabel}>Processing fee</Text>
              <Text style={styles.summaryValue}>{formatNaira(processingFee)}</Text>
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

        {/* Trust badge */}
        {!isFree && (
          <View style={styles.trustBadge}>
            <ShieldCheck size={16} color={colors.textPublic.muted} />
            <Text style={styles.trustBadgeText}>Secure 256-bit SSL Encrypted Payment</Text>
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
            <ActivityIndicator size="small" color="#FFFFFF" />
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
              <X size={22} color={colors.textPublic.primary} />
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
    backgroundColor: colors.public.bg,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sp[4],
    paddingVertical: sp[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.public.border,
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
    color: colors.textPublic.primary,
    textAlign: 'center',
  },
  headerSpacer: {
    minWidth: 44,
  },

  // ── Verifying overlay ─────────────────────────────────────────────────────
  verifyingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(249,249,248,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  verifyingText: {
    fontSize: fs.sm,
    color: colors.textPublic.secondary,
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
    backgroundColor: colors.public.surface,
    borderWidth: 1,
    borderColor: colors.public.border,
    borderRadius: rd.lg,
    padding: sp[4],
    marginBottom: sp[5],
  },
  eventName: {
    fontSize: fs.base,
    fontWeight: '700',
    color: colors.textPublic.primary,
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
    color: colors.textPublic.secondary,
    flex: 1,
  },

  // ── Section label ─────────────────────────────────────────────────────────
  sectionLabel: {
    fontSize: fs.sm,
    color: colors.textPublic.muted,
    letterSpacing: 1,
    marginBottom: sp[3],
    fontWeight: '600',
  },

  // ── Tier rows ─────────────────────────────────────────────────────────────
  tierRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.public.surface,
    borderWidth: 1,
    borderColor: colors.public.border,
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
    color: colors.textPublic.primary,
    flex: 1,
  },
  tierNameSelected: {
    color: '#FFFFFF',
  },
  tierPrice: {
    fontSize: fs.sm,
    fontWeight: '700',
    color: colors.textPublic.secondary,
    marginLeft: sp[3],
  },
  tierPriceSelected: {
    color: '#FFFFFF',
  },
  tierTextMuted: {
    color: colors.textPublic.muted,
  },

  // ── Payment method ────────────────────────────────────────────────────────
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.public.surface,
    borderWidth: 1,
    borderColor: colors.public.border,
    borderRadius: rd.lg,
    padding: sp[4],
    marginBottom: sp[2],
    gap: sp[3],
  },
  paymentRowSelected: {
    borderColor: colors.brand.DEFAULT,
    borderWidth: 2,
  },
  paymentIconWrap: {
    width: 40,
    height: 32,
    borderRadius: rd.sm,
    backgroundColor: colors.public.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentTextWrap: {
    flex: 1,
    gap: 2,
  },
  paymentTitle: {
    fontSize: fs.sm,
    fontWeight: '700',
    color: colors.textPublic.primary,
  },
  paymentSubtitle: {
    fontSize: fs.xs,
    color: colors.textPublic.muted,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: rd.full,
    borderWidth: 2,
    borderColor: colors.public.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: colors.brand.DEFAULT,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: rd.full,
    backgroundColor: colors.brand.DEFAULT,
  },

  // ── Trust badge ───────────────────────────────────────────────────────────
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sp[2],
    marginTop: sp[2],
    marginBottom: sp[4],
    opacity: 0.7,
  },
  trustBadgeText: {
    fontSize: fs.xs,
    color: colors.textPublic.muted,
  },

  // ── Inline error ──────────────────────────────────────────────────────────
  inlineError: {
    fontSize: fs.sm,
    color: colors.error.DEFAULT,
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
    backgroundColor: colors.public.surface,
    borderWidth: 1,
    borderColor: colors.public.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnDisabled: {
    opacity: 0.4,
  },
  qtyCount: {
    fontSize: fs.base,
    fontWeight: '700',
    color: colors.textPublic.primary,
    minWidth: 32,
    textAlign: 'center',
  },

  // ── Order summary ─────────────────────────────────────────────────────────
  summaryCard: {
    backgroundColor: colors.public.surface,
    borderWidth: 1,
    borderColor: colors.public.border,
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
    color: colors.textPublic.secondary,
  },
  summaryValue: {
    fontSize: fs.sm,
    color: colors.textPublic.secondary,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.public.border,
    marginBottom: sp[3],
  },
  summaryTotalLabel: {
    fontSize: fs.base,
    fontWeight: '700',
    color: colors.textPublic.primary,
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
    backgroundColor: colors.public.bg,
    borderTopWidth: 1,
    borderTopColor: colors.public.border,
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
    color: '#FFFFFF',
  },

  // ── Paystack Modal ────────────────────────────────────────────────────────
  modalContainer: {
    flex: 1,
    backgroundColor: colors.public.bg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sp[4],
    paddingVertical: sp[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.public.border,
  },
  modalTitle: {
    flex: 1,
    fontSize: fs.base,
    fontWeight: '700',
    color: colors.textPublic.primary,
    textAlign: 'center',
  },
  modalHeaderSpacer: {
    width: 22,
  },
  webview: {
    flex: 1,
    backgroundColor: colors.public.bg,
  },
})
