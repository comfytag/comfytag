import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Share,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { StackScreenProps } from '@react-navigation/stack'
import {
  ChevronLeft,
  Send,
  Share2,
  Ticket as TicketIcon,
  AlertTriangle,
  AlertCircle,
  Contact,
} from 'lucide-react-native'
import { colors, sp, rd, fs } from '@comfytag/ui/tokens'
import { formatDate } from '@comfytag/utils'
import { AnimatedPressable } from '../../../components/ui/AnimatedPressable'
import { Avatar } from '../../../components/ui/Avatar'
import { useTransferTicket, useTicketDetail } from '../../../hooks'
import { useAuthStore } from '../../../store'
import type { TicketsStackParamList } from '../../../navigation/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = StackScreenProps<TicketsStackParamList, 'TransferTicket'>

// ─── Subcomponents ────────────────────────────────────────────────────────────

function TicketNotches() {
  return (
    <View style={styles.notchRow}>
      <View style={[styles.notchCircle, { left: -12 }]} />
      <View style={[styles.notchCircle, { right: -12 }]} />
    </View>
  )
}

// ─── TransferTicketScreen ─────────────────────────────────────────────────────

export default function TransferTicketScreen({ route, navigation }: Props) {
  const { ticketId, eventName, ticketType } = route.params
  const user = useAuthStore((s) => s.user)

  const { data: ticket } = useTicketDetail(ticketId)

  const [email, setEmail] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [transferRef, setTransferRef] = useState<string | null>(null)

  const { mutate: transferTicket, isPending } = useTransferTicket()

  // ── Derived ───────────────────────────────────────────────────────────────

  const isVip = ticketType.toLowerCase().includes('vip')
  const numOfTicket = ticket?.numOfTicket ?? 1
  const tagLine = numOfTicket > 1 ? `${ticketType} · ${numOfTicket} tickets` : ticketType
  const tagId = ticket?.reference.slice(-10).toUpperCase() ?? '—'
  const expiresLabel = ticket !== undefined ? formatDate(ticket.eventDate ?? ticket.date) : '—'

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSend = () => {
    const trimmed = email.trim()
    if (trimmed.length === 0) return
    if (!trimmed.includes('@')) {
      setErrorMessage('Please enter a valid email address (e.g., name@domain.com).')
      return
    }
    setErrorMessage('')
    transferTicket(
      { ticketId, recipientEmail: trimmed },
      {
        onSuccess: (data) => {
          setTransferRef(data?.transferRef ?? null)
        },
        onError: (err) => {
          setErrorMessage(
            err instanceof Error ? err.message : 'Transfer failed. Please try again.'
          )
        },
      }
    )
  }

  const handleSelectFromContacts = () => {
    Alert.alert(
      'Select from Contacts',
      "Picking a recipient from your contacts isn't set up yet — enter their email address instead."
    )
  }

  const handleShare = async () => {
    if (transferRef === null) return
    try {
      await Share.share({
        message: `You've been sent a ticket for ${eventName} on ComfyTag! Use this reference to claim it: ${transferRef}`,
        title: 'ComfyTag Ticket Transfer',
      })
    } catch {
      /* silent */
    }
  }

  const isDisabled = email.trim().length === 0 || isPending

  // ── Sent state ────────────────────────────────────────────────────────────

  if (transferRef !== null) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.sentContainer}>
          <View style={styles.sentIconCircle}>
            <Send size={36} color="#FFFFFF" strokeWidth={1.5} />
          </View>
          <Text style={styles.sentHeading}>Transfer Sent!</Text>
          <Text style={styles.sentSubtitle}>
            {email} has been notified. They have 48 hours to accept.
          </Text>

          <AnimatedPressable
            onPress={() => void handleShare()}
            hapticStyle="medium"
            style={styles.shareButton}
          >
            <Share2 size={16} color="#FFFFFF" />
            <Text style={styles.shareButtonText}>Share Transfer Link</Text>
          </AnimatedPressable>

          <AnimatedPressable
            onPress={() => navigation.navigate('TicketsList')}
            style={styles.backButton}
            hapticStyle="light"
          >
            <Text style={styles.backButtonText}>Back to My Tickets</Text>
          </AnimatedPressable>
        </View>
      </SafeAreaView>
    )
  }

  // ── Form state ────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <AnimatedPressable
          onPress={() => navigation.goBack()}
          style={styles.headerBack}
          hapticStyle="light"
        >
          <ChevronLeft size={24} color={colors.brand.DEFAULT} strokeWidth={2} />
        </AnimatedPressable>
        <Text style={styles.headerBrand}>ComfyTag</Text>
        <Avatar uri={user?.avatar ?? user?.image} name={user?.name} size="sm" />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title */}
          <Text style={styles.screenTitle}>Transfer Ticket</Text>
          <Text style={styles.screenSubtitle}>Send your secure access tag to another user.</Text>

          {/* Ticket summary card */}
          <View style={styles.ticketCard}>
            <View style={styles.ticketCardTop}>
              <View style={styles.ticketIconSquare}>
                <TicketIcon size={28} color="#FFFFFF" strokeWidth={2} />
              </View>
              <View style={styles.ticketCardInfo}>
                <Text style={styles.ticketEyebrow}>{isVip ? 'PREMIUM TAG' : 'TICKET'}</Text>
                <Text style={styles.ticketEventName} numberOfLines={2}>
                  {eventName}
                </Text>
                <Text style={styles.ticketMeta}>{tagLine}</Text>
              </View>
            </View>

            <TicketNotches />

            <View style={styles.ticketCardBottom}>
              <View>
                <Text style={styles.ticketCardLabel}>TAG ID</Text>
                <Text style={styles.ticketCardValueMono}>{tagId}</Text>
              </View>
              <View style={styles.ticketCardBottomRight}>
                <Text style={styles.ticketCardLabel}>EXPIRES</Text>
                <Text style={styles.ticketCardValue}>{expiresLabel}</Text>
              </View>
            </View>
          </View>

          {/* Warning */}
          <View style={styles.warningCard}>
            <AlertTriangle size={20} color={colors.error.DEFAULT} strokeWidth={2} />
            <View style={styles.warningTextWrap}>
              <Text style={styles.warningTitle}>Important Security Note</Text>
              <Text style={styles.warningText}>
                Once the transfer is accepted, your biometric link to this tag will be
                permanently revoked. Transfers are irreversible after the recipient claims
                the tag.
              </Text>
            </View>
          </View>

          {/* Input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>RECIPIENT EMAIL</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={[
                  styles.textInput,
                  errorMessage.length > 0 && styles.textInputError,
                ]}
                placeholder="Enter email address"
                placeholderTextColor={colors.textPublic.muted}
                value={email}
                onChangeText={(val) => {
                  setEmail(val)
                  if (errorMessage.length > 0) setErrorMessage('')
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isPending}
              />
              {errorMessage.length > 0 && (
                <AlertCircle
                  size={20}
                  color={colors.error.DEFAULT}
                  strokeWidth={2}
                  style={styles.inputErrorIcon}
                />
              )}
            </View>
            {errorMessage.length > 0 && (
              <Text style={styles.inlineError}>{errorMessage}</Text>
            )}
          </View>

          {/* Select from contacts */}
          <AnimatedPressable
            onPress={handleSelectFromContacts}
            style={styles.contactsButton}
            hapticStyle="light"
          >
            <Contact size={18} color={colors.textPublic.secondary} strokeWidth={2} />
            <Text style={styles.contactsButtonText}>Select from Contacts</Text>
          </AnimatedPressable>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* CTA */}
        <View style={styles.ctaContainer}>
          <AnimatedPressable
            onPress={handleSend}
            style={[styles.ctaButton, isDisabled && styles.ctaButtonDisabled]}
            hapticStyle="medium"
            disabled={isDisabled}
          >
            {isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.ctaButtonText}>Send Transfer</Text>
            )}
          </AnimatedPressable>
        </View>
      </KeyboardAvoidingView>
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
    justifyContent: 'space-between',
    paddingHorizontal: sp[4],
    paddingTop: sp[2],
    paddingBottom: sp[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.public.border,
  },
  headerBack: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -sp[2],
  },
  headerBrand: {
    fontSize: fs.lg,
    fontWeight: '800',
    color: colors.brand.DEFAULT,
    letterSpacing: -0.3,
  },

  // ── Keyboard / scroll ─────────────────────────────────────────────────────
  keyboardView: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: sp[4],
    paddingTop: sp[5],
  },

  // ── Title ─────────────────────────────────────────────────────────────────
  screenTitle: {
    fontSize: fs['2xl'],
    fontWeight: '800',
    color: colors.textPublic.primary,
    marginBottom: sp[1],
  },
  screenSubtitle: {
    fontSize: fs.sm,
    color: colors.textPublic.secondary,
    marginBottom: sp[6],
  },

  // ── Ticket summary card ──────────────────────────────────────────────────
  ticketCard: {
    backgroundColor: colors.public.surface,
    borderRadius: rd.xl,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.public.border,
    marginBottom: sp[6],
  },
  ticketCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp[4],
    padding: sp[5],
  },
  ticketIconSquare: {
    width: 64,
    height: 64,
    borderRadius: rd.lg,
    backgroundColor: colors.brand.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  ticketCardInfo: {
    flex: 1,
  },
  ticketEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.brand.DEFAULT,
    letterSpacing: 1.5,
    marginBottom: sp[1],
  },
  ticketEventName: {
    fontSize: fs.lg,
    fontWeight: '700',
    color: colors.textPublic.primary,
    marginBottom: 2,
  },
  ticketMeta: {
    fontSize: fs.sm,
    color: colors.textPublic.secondary,
  },
  ticketCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.public.surfaceAlt,
    padding: sp[5],
  },
  ticketCardBottomRight: {
    alignItems: 'flex-end',
  },
  ticketCardLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textPublic.muted,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  ticketCardValueMono: {
    fontSize: fs.sm,
    fontWeight: '600',
    color: colors.textPublic.primary,
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
  ticketCardValue: {
    fontSize: fs.sm,
    fontWeight: '600',
    color: colors.textPublic.primary,
  },

  // ── Ticket-tear notch ────────────────────────────────────────────────────
  notchRow: {
    height: 0,
  },
  notchCircle: {
    position: 'absolute',
    top: -8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.public.bg,
  },

  // ── Warning ───────────────────────────────────────────────────────────────
  warningCard: {
    flexDirection: 'row',
    gap: sp[3],
    backgroundColor: colors.error.bg,
    borderRadius: rd.xl,
    padding: sp[4],
    marginBottom: sp[6],
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
  },
  warningTextWrap: {
    flex: 1,
  },
  warningTitle: {
    fontSize: fs.sm,
    fontWeight: '700',
    color: colors.error.DEFAULT,
    marginBottom: sp[1],
  },
  warningText: {
    fontSize: fs.sm,
    color: colors.textPublic.secondary,
    lineHeight: 20,
  },

  // ── Input section ─────────────────────────────────────────────────────────
  inputSection: {
    marginBottom: sp[4],
  },
  inputLabel: {
    fontSize: fs.xs,
    color: colors.textPublic.muted,
    letterSpacing: 1,
    marginBottom: sp[2],
    fontWeight: '600',
  },
  inputWrap: {
    position: 'relative',
    justifyContent: 'center',
  },
  textInput: {
    backgroundColor: colors.public.surface,
    borderWidth: 1,
    borderColor: colors.public.border,
    borderRadius: rd.lg,
    height: 52,
    paddingHorizontal: sp[4],
    fontSize: fs.base,
    color: colors.textPublic.primary,
  },
  textInputError: {
    borderWidth: 2,
    borderColor: colors.error.DEFAULT,
    paddingRight: sp[10],
  },
  inputErrorIcon: {
    position: 'absolute',
    right: sp[4],
  },
  inlineError: {
    fontSize: fs.sm,
    color: colors.error.DEFAULT,
    marginTop: sp[2],
    lineHeight: 18,
  },

  // ── Select from contacts ─────────────────────────────────────────────────
  contactsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sp[2],
    height: 52,
    borderRadius: rd.lg,
    borderWidth: 1,
    borderColor: colors.public.border,
    marginTop: sp[3],
  },
  contactsButtonText: {
    fontSize: fs.base,
    fontWeight: '600',
    color: colors.textPublic.primary,
  },

  // ── Spacing ───────────────────────────────────────────────────────────────
  bottomSpacer: {
    height: sp[8],
  },

  // ── CTA ───────────────────────────────────────────────────────────────────
  ctaContainer: {
    paddingHorizontal: sp[4],
    paddingTop: sp[3],
    paddingBottom: sp[4],
    backgroundColor: colors.public.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.public.border,
  },
  ctaButton: {
    height: 52,
    backgroundColor: colors.brand.DEFAULT,
    borderRadius: rd.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonDisabled: {
    opacity: 0.5,
  },
  ctaButtonText: {
    fontSize: fs.base,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ── Sent state ────────────────────────────────────────────────────────────
  sentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: sp[8],
  },
  sentIconCircle: {
    width: 80,
    height: 80,
    borderRadius: rd.full,
    backgroundColor: colors.brand.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: sp[5],
  },
  sentHeading: {
    fontSize: fs['2xl'],
    fontWeight: '800',
    color: colors.textPublic.primary,
    textAlign: 'center',
    marginBottom: sp[3],
  },
  sentSubtitle: {
    fontSize: fs.sm,
    color: colors.textPublic.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: sp[6],
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sp[2],
    backgroundColor: colors.brand.DEFAULT,
    height: 52,
    borderRadius: rd.full,
    paddingHorizontal: sp[8],
    width: '100%',
    marginBottom: sp[3],
  },
  shareButtonText: {
    fontSize: fs.base,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  backButton: {
    height: 52,
    borderRadius: rd.full,
    borderWidth: 1,
    borderColor: colors.public.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: sp[8],
    width: '100%',
  },
  backButtonText: {
    fontSize: fs.base,
    fontWeight: '600',
    color: colors.textPublic.secondary,
  },
})
