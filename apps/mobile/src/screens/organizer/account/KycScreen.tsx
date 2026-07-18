import React, { useCallback, useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { StackScreenProps } from '@react-navigation/stack'
import {
  ChevronLeft,
  ShieldCheck,
  ShieldAlert,
  Clock,
  FileText,
} from 'lucide-react-native'
import { colors, sp, rd, fs } from '@comfytag/ui/tokens'
import { AnimatedPressable } from '../../../components/ui/AnimatedPressable'
import { post } from '../../../lib/api'
import { useAuthStore } from '../../../store'
import { useKycStatus, kycKeys } from '../../../hooks'
import type { OrganizerAccountStackParamList } from '../../../navigation/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = StackScreenProps<OrganizerAccountStackParamList, 'Kyc'>

type IdType = 'NIN' | 'BVN' | 'passport'

type KycDisplayStatus = 'verified' | 'pending' | 'not_submitted'

interface SubmitPayload {
  fullName: string
  idType: IdType
  idNumber: string
  address: string
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function KycScreen({ navigation }: Props) {
  const user = useAuthStore((s) => s.user)
  const qc   = useQueryClient()

  const { data: kycData } = useKycStatus()

  // Local override for "just submitted" state — cleared when server confirms
  const [localPending, setLocalPending] = useState(false)

  const displayStatus: KycDisplayStatus = (() => {
    if (localPending) return 'pending'
    if (kycData?.overallStatus === 'verified') return 'verified'
    if (kycData?.overallStatus === 'partial')  return 'pending'
    if (user?.kycStatus === 'verified')        return 'verified'
    return 'not_submitted'
  })()

  const [idType, setIdType]     = useState<IdType>('NIN')
  const [idNumber, setIdNumber] = useState('')
  const [address, setAddress]   = useState('')
  const [fullName, setFullName] = useState(user?.name ?? '')
  const [formError, setFormError] = useState('')

  const { mutate: submitKyc, isPending: submitting } = useMutation({
    mutationFn: ({ fullName: fn, idType: it, idNumber: idn, address: addr }: SubmitPayload) => {
      if (!user) throw new Error('Not authenticated')
      return post(`/kyc/${user._id}`, { fullName: fn, idType: it, idNumber: idn, address: addr })
    },
    onSuccess: () => {
      setLocalPending(true)
      void qc.invalidateQueries({ queryKey: kycKeys.status })
    },
  })

  const handleSubmit = useCallback((): void => {
    if (!user) return
    if (!fullName.trim())  { setFormError('Full name is required.'); return }
    if (!idNumber.trim())  { setFormError('ID number is required.'); return }
    if (!address.trim())   { setFormError('Address is required.'); return }

    setFormError('')
    submitKyc(
      { fullName: fullName.trim(), idType, idNumber: idNumber.trim(), address: address.trim() },
      {
        onError: (err: unknown) => {
          const msg = err instanceof Error ? err.message : ''
          if (msg.includes('401') || msg.includes('Unauthorized')) {
            setFormError('Your session expired. Please log in again.')
          } else if (msg.includes('400') || msg.includes('Bad Request')) {
            setFormError('Invalid information. Please check all fields and try again.')
          } else if (msg.includes('Network') || msg.includes('offline')) {
            setFormError('Network error. Please check your connection and try again.')
          } else if (msg.includes('timeout')) {
            setFormError('Request timed out. Please try again.')
          } else {
            setFormError('Failed to submit KYC. Please try again or contact support.')
          }
        },
      }
    )
  }, [user, fullName, idType, idNumber, address, submitKyc])

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <AnimatedPressable
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hapticStyle="light"
        >
          <ChevronLeft size={24} color={colors.mobile.textPrimary} strokeWidth={2} />
        </AnimatedPressable>
        <Text style={styles.headerTitle}>KYC Verification</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Verified ── */}
          {displayStatus === 'verified' && (
            <View style={styles.statusCard}>
              <View style={[styles.statusIconWrap, styles.statusIconVerified]}>
                <ShieldCheck size={36} color={colors.mobile.success} strokeWidth={1.5} />
              </View>
              <Text style={styles.statusTitle}>Identity Verified</Text>
              <Text style={styles.statusSubtitle}>
                Your identity has been verified. You can now accept payments and request withdrawals.
              </Text>
            </View>
          )}

          {/* ── Pending ── */}
          {displayStatus === 'pending' && (
            <View style={styles.statusCard}>
              <View style={[styles.statusIconWrap, styles.statusIconPending]}>
                <Clock size={36} color="#F59E0B" strokeWidth={1.5} />
              </View>
              <Text style={styles.statusTitle}>Under Review</Text>
              <Text style={styles.statusSubtitle}>
                Your KYC submission is being reviewed. This usually takes 24–48 hours. You'll get a notification when it's done.
              </Text>
            </View>
          )}

          {/* ── Not submitted — form ── */}
          {displayStatus === 'not_submitted' && (
            <>
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <FileText size={18} color={colors.brand.DEFAULT} strokeWidth={2} />
                  <Text style={styles.infoText}>
                    Verify your identity to unlock withdrawals and higher payout limits.
                  </Text>
                </View>
              </View>

              <View style={styles.formCard}>
                <Text style={styles.formTitle}>Your Details</Text>

                <Text style={styles.label}>Full Legal Name</Text>
                <TextInput
                  style={styles.input}
                  value={fullName}
                  onChangeText={(v) => { setFullName(v); setFormError('') }}
                  placeholder="As it appears on your ID"
                  placeholderTextColor={colors.mobile.textMuted}
                  autoCapitalize="words"
                />

                <Text style={styles.label}>ID Type</Text>
                <View style={styles.idTypePills}>
                  {(['NIN', 'BVN', 'passport'] as IdType[]).map((type) => (
                    <AnimatedPressable
                      key={type}
                      style={[
                        styles.pill,
                        idType === type && styles.pillActive,
                      ]}
                      onPress={() => setIdType(type)}
                      hapticStyle="light"
                    >
                      <Text
                        style={[
                          styles.pillText,
                          idType === type && styles.pillTextActive,
                        ]}
                      >
                        {type.toUpperCase()}
                      </Text>
                    </AnimatedPressable>
                  ))}
                </View>

                <Text style={styles.label}>ID Number</Text>
                <TextInput
                  style={styles.input}
                  value={idNumber}
                  onChangeText={(v) => { setIdNumber(v); setFormError('') }}
                  placeholder={idType === 'passport' ? 'Passport number' : `${idType} number`}
                  placeholderTextColor={colors.mobile.textMuted}
                  autoCapitalize="characters"
                />

                <Text style={styles.label}>Residential Address</Text>
                <TextInput
                  style={[styles.input, styles.inputMultiline]}
                  value={address}
                  onChangeText={(v) => { setAddress(v); setFormError('') }}
                  placeholder="Street, city, state"
                  placeholderTextColor={colors.mobile.textMuted}
                  autoCapitalize="words"
                  multiline
                  numberOfLines={3}
                />

                {formError ? <Text style={styles.formError}>{formError}</Text> : null}

                <AnimatedPressable
                  style={[styles.submitBtn, submitting && { opacity: 0.5 }]}
                  onPress={handleSubmit}
                  hapticStyle="medium"
                  disabled={submitting}
                >
                  <ShieldAlert size={16} color="#FFFFFF" strokeWidth={2} />
                  <Text style={styles.submitBtnText}>
                    {submitting ? 'Submitting…' : 'Submit for Verification'}
                  </Text>
                </AnimatedPressable>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.mobile.bg,
  },
  scrollContent: {
    paddingBottom: sp[10],
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sp[4],
    paddingTop: sp[2],
    paddingBottom: sp[3],
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: fs.base,
    fontWeight: '600',
    color: colors.mobile.textPrimary,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 44,
    height: 44,
  },

  // Status cards
  statusCard: {
    marginHorizontal: sp[5],
    marginTop: sp[4],
    backgroundColor: colors.mobile.surface,
    borderRadius: rd.xl,
    borderWidth: 1,
    borderColor: colors.mobile.border,
    padding: sp[6],
    alignItems: 'center',
  },
  statusIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: sp[4],
  },
  statusIconVerified: {
    backgroundColor: 'rgba(16,185,129,0.12)',
  },
  statusIconPending: {
    backgroundColor: 'rgba(245,158,11,0.12)',
  },
  statusTitle: {
    fontSize: fs.lg,
    fontWeight: '700',
    color: colors.mobile.textPrimary,
    marginBottom: sp[2],
  },
  statusSubtitle: {
    fontSize: fs.sm,
    color: colors.mobile.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Info card
  infoCard: {
    marginHorizontal: sp[5],
    marginTop: sp[4],
    marginBottom: sp[3],
    backgroundColor: 'rgba(124,58,237,0.08)',
    borderRadius: rd.lg,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.2)',
    padding: sp[4],
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: sp[3],
  },
  infoText: {
    flex: 1,
    fontSize: fs.sm,
    color: colors.mobile.textSecondary,
    lineHeight: 20,
  },

  // Form card
  formCard: {
    marginHorizontal: sp[5],
    backgroundColor: colors.mobile.surface,
    borderRadius: rd.xl,
    borderWidth: 1,
    borderColor: colors.mobile.border,
    padding: sp[5],
  },
  formTitle: {
    fontSize: fs.base,
    fontWeight: '700',
    color: colors.mobile.textPrimary,
    marginBottom: sp[4],
  },
  label: {
    fontSize: fs.xs,
    fontWeight: '700',
    color: colors.mobile.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: sp[2],
  },
  input: {
    backgroundColor: colors.mobile.bg,
    borderWidth: 1,
    borderColor: colors.mobile.border,
    borderRadius: rd.lg,
    height: 48,
    paddingHorizontal: sp[4],
    fontSize: fs.sm,
    color: colors.mobile.textPrimary,
    marginBottom: sp[4],
  },
  inputMultiline: {
    height: 80,
    paddingTop: sp[3],
    textAlignVertical: 'top',
  },

  // ID type pills
  idTypePills: {
    flexDirection: 'row',
    gap: sp[2],
    marginBottom: sp[4],
  },
  pill: {
    borderWidth: 1,
    borderColor: colors.mobile.border,
    borderRadius: rd.full,
    paddingHorizontal: sp[4],
    paddingVertical: sp[2],
  },
  pillActive: {
    backgroundColor: colors.brand.DEFAULT,
    borderColor: colors.brand.DEFAULT,
  },
  pillText: {
    fontSize: fs.xs,
    fontWeight: '700',
    color: colors.mobile.textMuted,
  },
  pillTextActive: {
    color: '#FFFFFF',
  },

  formError: {
    fontSize: fs.xs,
    color: '#EF4444',
    marginBottom: sp[3],
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sp[2],
    backgroundColor: colors.brand.DEFAULT,
    borderRadius: rd.lg,
    paddingVertical: sp[3],
    marginTop: sp[2],
  },
  submitBtnText: {
    fontSize: fs.sm,
    fontWeight: '700',
    color: '#FFFFFF',
  },
})
