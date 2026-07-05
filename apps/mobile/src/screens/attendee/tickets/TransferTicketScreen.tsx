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
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { StackScreenProps } from '@react-navigation/stack'
import { ChevronLeft, Send, Share2 } from 'lucide-react-native'
import { colors, sp, rd, fs } from '@comfytag/ui/tokens'
import { AnimatedPressable } from '../../../components/ui/AnimatedPressable'
import { useTransferTicket } from '../../../hooks'
import type { TicketsStackParamList } from '../../../navigation/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = StackScreenProps<TicketsStackParamList, 'TransferTicket'>

// ─── TransferTicketScreen ─────────────────────────────────────────────────────

export default function TransferTicketScreen({ route, navigation }: Props) {
  const { ticketId, eventName, ticketType } = route.params

  const [email, setEmail] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [transferRef, setTransferRef] = useState<string | null>(null)

  const { mutate: transferTicket, isPending } = useTransferTicket()

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSend = () => {
    const trimmed = email.trim()
    if (trimmed.length === 0) return
    if (!trimmed.includes('@')) {
      setErrorMessage('Please enter a valid email address.')
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
            <Send size={36} color={colors.mobile.textPrimary} strokeWidth={1.5} />
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
            <Share2 size={16} color={colors.mobile.textPrimary} />
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
          <ChevronLeft size={24} color={colors.mobile.textPrimary} strokeWidth={2} />
        </AnimatedPressable>
        <Text style={styles.headerTitle}>Transfer Ticket</Text>
        <View style={styles.headerSpacer} />
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
          {/* Ticket info card */}
          <View style={styles.ticketCard}>
            <Text style={styles.ticketEventName} numberOfLines={2}>
              {eventName}
            </Text>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>{ticketType}</Text>
            </View>
          </View>

          {/* Warning */}
          <View style={styles.warningCard}>
            <Text style={styles.warningText}>
              Transferring a ticket removes it from your account. This cannot be undone once the recipient accepts.
            </Text>
          </View>

          {/* Input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>RECIPIENT EMAIL</Text>
            <TextInput
              style={[
                styles.textInput,
                errorMessage.length > 0 && styles.textInputError,
              ]}
              placeholder="recipient@email.com"
              placeholderTextColor={colors.mobile.textMuted}
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
              <Text style={styles.inlineError}>{errorMessage}</Text>
            )}
          </View>

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
              <ActivityIndicator size="small" color={colors.mobile.textPrimary} />
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
    backgroundColor: colors.mobile.bg,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sp[4],
    paddingTop: sp[2],
    paddingBottom: sp[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.mobile.border,
  },
  headerBack: {
    width: 44,
    height: 44,
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
    width: 44,
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
    paddingTop: sp[4],
  },

  // ── Ticket info card ──────────────────────────────────────────────────────
  ticketCard: {
    backgroundColor: colors.mobile.surface,
    borderRadius: rd.xl,
    padding: sp[4],
    marginBottom: sp[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: sp[3],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.mobile.border,
  },
  ticketEventName: {
    flex: 1,
    fontSize: fs.base,
    fontWeight: '700',
    color: colors.mobile.textPrimary,
  },
  typeBadge: {
    backgroundColor: 'rgba(124,58,237,0.15)',
    borderRadius: rd.full,
    paddingVertical: sp[1],
    paddingHorizontal: sp[3],
    flexShrink: 0,
  },
  typeBadgeText: {
    fontSize: fs.sm,
    fontWeight: '600',
    color: colors.brand.DEFAULT,
  },

  // ── Warning ───────────────────────────────────────────────────────────────
  warningCard: {
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderRadius: rd.md,
    padding: sp[4],
    marginBottom: sp[5],
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
  },
  warningText: {
    fontSize: fs.sm,
    color: colors.mobile.error,
    lineHeight: 20,
  },

  // ── Input section ─────────────────────────────────────────────────────────
  inputSection: {
    marginTop: sp[2],
  },
  inputLabel: {
    fontSize: fs.xs,
    color: colors.mobile.textMuted,
    letterSpacing: 1,
    marginBottom: sp[2],
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: colors.mobile.surface,
    borderWidth: 1,
    borderColor: colors.mobile.border,
    borderRadius: rd.lg,
    height: 52,
    paddingHorizontal: sp[4],
    fontSize: fs.base,
    color: colors.mobile.textPrimary,
  },
  textInputError: {
    borderColor: colors.mobile.error,
  },
  inlineError: {
    fontSize: fs.sm,
    color: colors.mobile.error,
    marginTop: sp[2],
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
    backgroundColor: colors.mobile.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.mobile.border,
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
    color: colors.mobile.textPrimary,
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
    color: colors.mobile.textPrimary,
    textAlign: 'center',
    marginBottom: sp[3],
  },
  sentSubtitle: {
    fontSize: fs.sm,
    color: colors.mobile.textSecondary,
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
    color: colors.mobile.textPrimary,
  },
  backButton: {
    height: 52,
    borderRadius: rd.full,
    borderWidth: 1,
    borderColor: colors.mobile.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: sp[8],
    width: '100%',
  },
  backButtonText: {
    fontSize: fs.base,
    fontWeight: '600',
    color: colors.mobile.textSecondary,
  },

  // ── Platform shadow (unused on dark bg but kept for consistency) ──────────
  ...Platform.select({ ios: {}, android: {} }),
})
