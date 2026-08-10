import React, { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import type { StackScreenProps } from '@react-navigation/stack'
import {
  ChevronLeft,
  ShieldCheck,
  ShieldAlert,
  Clock,
  FileText,
  Camera,
  UserRound,
} from 'lucide-react-native'
import { colors, sp, rd, fs } from '@comfytag/ui/tokens'
import { AnimatedPressable } from '../../../components/ui/AnimatedPressable'
import { useAuthStore } from '../../../store'
import { useKycStatus, useUploadKyc } from '../../../hooks'
import type { KycIdType } from '../../../hooks/useKyc'
import type { OrganizerAccountStackParamList } from '../../../navigation/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = StackScreenProps<OrganizerAccountStackParamList, 'Kyc'>

type KycDisplayStatus = 'verified' | 'pending' | 'rejected' | 'not_submitted'

interface DocAsset {
  uri: string
  name: string
  type: string
}

// Must match KYC_ID_TYPES in apps/api/controllers/users.js exactly — any other
// value is rejected server-side with a 400.
const ID_TYPES: { value: KycIdType; label: string }[] = [
  { value: 'nin', label: 'NIN' },
  { value: 'passport', label: 'Passport' },
  { value: 'voters_card', label: "Voter's Card" },
]

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function KycScreen({ navigation }: Props) {
  const user = useAuthStore((s) => s.user)

  const { data: kycData } = useKycStatus()
  const { mutate: uploadKyc, isPending: submitting } = useUploadKyc()

  // Local override for "just submitted" state — cleared once the server confirms.
  const [localPending, setLocalPending] = useState(false)

  const displayStatus: KycDisplayStatus = (() => {
    if (localPending) return 'pending'
    const status = kycData?.kycStatus ?? user?.kycStatus
    if (status === 'verified') return 'verified'
    if (status === 'pending') return 'pending'
    if (status === 'rejected') return 'rejected'
    return 'not_submitted'
  })()

  const [idType, setIdType] = useState<KycIdType>('nin')
  const [selfie, setSelfie] = useState<DocAsset | null>(null)
  const [idDocument, setIdDocument] = useState<DocAsset | null>(null)
  const [formError, setFormError] = useState('')

  const captureDocument = useCallback(
    async (slot: 'selfie' | 'idDocument') => {
      const permission = await ImagePicker.requestCameraPermissionsAsync()
      if (!permission.granted) {
        setFormError('Camera access is needed to capture your KYC documents.')
        return
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: true,
        aspect: slot === 'selfie' ? [1, 1] : [16, 10],
      })
      if (result.canceled || result.assets.length === 0) return

      const asset = result.assets[0]
      const doc: DocAsset = {
        uri: asset.uri,
        name: asset.fileName ?? `${slot}-${Date.now()}.jpg`,
        type: asset.mimeType ?? 'image/jpeg',
      }
      setFormError('')
      if (slot === 'selfie') setSelfie(doc)
      else setIdDocument(doc)
    },
    []
  )

  const handleSubmit = useCallback((): void => {
    if (!user) return
    if (!selfie) { setFormError('Take a selfie to continue.'); return }
    if (!idDocument) { setFormError('Take a photo of your ID document to continue.'); return }

    setFormError('')
    uploadKyc(
      { idType, selfie, idDocument },
      {
        onSuccess: () => setLocalPending(true),
        onError: (err: unknown) => {
          const msg = err instanceof Error ? err.message : ''
          if (msg.includes('401') || msg.includes('Unauthorized')) {
            setFormError('Your session expired. Please log in again.')
          } else if (msg.includes('400') || msg.includes('Bad Request')) {
            setFormError('Invalid submission. Please check your photos and try again.')
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
  }, [user, idType, selfie, idDocument, uploadKyc])

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <AnimatedPressable
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hapticStyle="light"
        >
          <ChevronLeft size={24} color={colors.textPublic.primary} strokeWidth={2} />
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
                <ShieldCheck size={36} color={colors.success.DEFAULT} strokeWidth={1.5} />
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

          {/* ── Rejected / Not submitted — form ── */}
          {(displayStatus === 'rejected' || displayStatus === 'not_submitted') && (
            <>
              {displayStatus === 'rejected' ? (
                <View style={styles.rejectedCard}>
                  <ShieldAlert size={18} color={colors.error.DEFAULT} strokeWidth={2} />
                  <Text style={styles.rejectedText}>
                    Your last submission wasn't approved
                    {kycData?.kycRejectionReason ? `: ${kycData.kycRejectionReason}` : '.'}
                    {' '}Please resubmit below.
                  </Text>
                </View>
              ) : (
                <View style={styles.infoCard}>
                  <View style={styles.infoRow}>
                    <FileText size={18} color={colors.brand.DEFAULT} strokeWidth={2} />
                    <Text style={styles.infoText}>
                      Verify your identity to unlock withdrawals and higher payout limits.
                    </Text>
                  </View>
                </View>
              )}

              <View style={styles.formCard}>
                <Text style={styles.formTitle}>Your Details</Text>

                <Text style={styles.label}>ID Type</Text>
                <View style={styles.idTypePills}>
                  {ID_TYPES.map(({ value, label }) => (
                    <AnimatedPressable
                      key={value}
                      style={[styles.pill, idType === value && styles.pillActive]}
                      onPress={() => setIdType(value)}
                      hapticStyle="light"
                    >
                      <Text style={[styles.pillText, idType === value && styles.pillTextActive]}>
                        {label}
                      </Text>
                    </AnimatedPressable>
                  ))}
                </View>

                <Text style={styles.label}>Selfie</Text>
                <AnimatedPressable
                  style={styles.captureBox}
                  onPress={() => void captureDocument('selfie')}
                  hapticStyle="light"
                >
                  {selfie ? (
                    <Image source={{ uri: selfie.uri }} style={styles.captureThumb} resizeMode="cover" />
                  ) : (
                    <View style={styles.capturePlaceholder}>
                      <UserRound size={22} color={colors.textPublic.secondary} strokeWidth={2} />
                      <Text style={styles.capturePlaceholderText}>Take a selfie</Text>
                    </View>
                  )}
                  {selfie && (
                    <View style={styles.retakeBadge}>
                      <Camera size={12} color="#FFFFFF" strokeWidth={2} />
                      <Text style={styles.retakeText}>Retake</Text>
                    </View>
                  )}
                </AnimatedPressable>

                <Text style={styles.label}>ID Document Photo</Text>
                <AnimatedPressable
                  style={styles.captureBox}
                  onPress={() => void captureDocument('idDocument')}
                  hapticStyle="light"
                >
                  {idDocument ? (
                    <Image source={{ uri: idDocument.uri }} style={styles.captureThumb} resizeMode="cover" />
                  ) : (
                    <View style={styles.capturePlaceholder}>
                      <FileText size={22} color={colors.textPublic.secondary} strokeWidth={2} />
                      <Text style={styles.capturePlaceholderText}>
                        Photograph your {ID_TYPES.find((t) => t.value === idType)?.label}
                      </Text>
                    </View>
                  )}
                  {idDocument && (
                    <View style={styles.retakeBadge}>
                      <Camera size={12} color="#FFFFFF" strokeWidth={2} />
                      <Text style={styles.retakeText}>Retake</Text>
                    </View>
                  )}
                </AnimatedPressable>

                {formError ? <Text style={styles.formError}>{formError}</Text> : null}

                <AnimatedPressable
                  style={[styles.submitBtn, submitting && { opacity: 0.5 }]}
                  onPress={handleSubmit}
                  hapticStyle="medium"
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <ShieldAlert size={16} color="#FFFFFF" strokeWidth={2} />
                  )}
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
    backgroundColor: colors.public.bg,
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
    color: colors.textPublic.primary,
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
    backgroundColor: colors.public.surface,
    borderRadius: rd.xl,
    borderWidth: 1,
    borderColor: colors.public.border,
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
    color: colors.textPublic.primary,
    marginBottom: sp[2],
  },
  statusSubtitle: {
    fontSize: fs.sm,
    color: colors.textPublic.muted,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Rejected banner
  rejectedCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: sp[3],
    marginHorizontal: sp[5],
    marginTop: sp[4],
    marginBottom: sp[3],
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderRadius: rd.lg,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
    padding: sp[4],
  },
  rejectedText: {
    flex: 1,
    fontSize: fs.sm,
    color: colors.textPublic.primary,
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
    color: colors.textPublic.secondary,
    lineHeight: 20,
  },

  // Form card
  formCard: {
    marginHorizontal: sp[5],
    backgroundColor: colors.public.surface,
    borderRadius: rd.xl,
    borderWidth: 1,
    borderColor: colors.public.border,
    padding: sp[5],
  },
  formTitle: {
    fontSize: fs.base,
    fontWeight: '700',
    color: colors.textPublic.primary,
    marginBottom: sp[4],
  },
  label: {
    fontSize: fs.xs,
    fontWeight: '700',
    color: colors.textPublic.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: sp[2],
  },

  // ID type pills
  idTypePills: {
    flexDirection: 'row',
    gap: sp[2],
    marginBottom: sp[4],
  },
  pill: {
    borderWidth: 1,
    borderColor: colors.public.border,
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
    color: colors.textPublic.muted,
  },
  pillTextActive: {
    color: '#FFFFFF',
  },

  // Document capture
  captureBox: {
    height: 120,
    borderRadius: rd.lg,
    borderWidth: 1,
    borderColor: colors.public.border,
    backgroundColor: colors.public.bg,
    overflow: 'hidden',
    marginBottom: sp[4],
    position: 'relative',
  },
  captureThumb: {
    width: '100%',
    height: '100%',
  },
  capturePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: sp[2],
  },
  capturePlaceholderText: {
    fontSize: fs.sm,
    color: colors.textPublic.secondary,
    textAlign: 'center',
  },
  retakeBadge: {
    position: 'absolute',
    bottom: sp[2],
    right: sp[2],
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: rd.full,
    paddingHorizontal: sp[3],
    paddingVertical: 4,
  },
  retakeText: {
    fontSize: fs.xs,
    fontWeight: '700',
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
