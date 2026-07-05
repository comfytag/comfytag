import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { StackScreenProps } from '@react-navigation/stack'
import { ChevronLeft, X } from 'lucide-react-native'
import { colors, sp, rd, fs } from '@comfytag/ui/tokens'
import { AnimatedPressable } from '../../../components/ui/AnimatedPressable'
import { useCreateEvent, usePublishEvent } from '../../../hooks'
import type { OrganizerEventsStackParamList } from '../../../navigation/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = StackScreenProps<OrganizerEventsStackParamList, 'CreateEvent'>

type Step = 1 | 2 | 3 | 4 | 5

interface TierDraft {
  id: string
  name: string
  price: string
  capacity: string
}

interface FormState {
  name: string
  category: string
  description: string
  date: string
  startTime: string
  endTime: string
  venue: string
  address: string
  state: string
  tiers: TierDraft[]
  imageUrl: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const INITIAL_FORM: FormState = {
  name: '',
  category: '',
  description: '',
  date: '',
  startTime: '',
  endTime: '',
  venue: '',
  address: '',
  state: '',
  tiers: [],
  imageUrl: '',
}

const MAX_TIERS = 5

// ─── Validation ───────────────────────────────────────────────────────────────

function validateStep(step: Step, form: FormState): string {
  if (step === 1) {
    if (!form.name.trim()) return 'Event name is required'
    if (!form.category.trim()) return 'Category is required'
    if (!form.description.trim()) return 'Description is required'
  }
  if (step === 2) {
    if (!form.address.trim()) return 'Address is required'
    if (!form.state.trim()) return 'State is required'
  }
  if (step === 3) {
    for (const t of form.tiers) {
      if (!t.name.trim()) return 'Each tier needs a name'
      if (!t.capacity.trim() || parseInt(t.capacity, 10) <= 0) return 'Each tier needs a valid capacity'
    }
  }
  return ''
}

// ─── Field wrapper ────────────────────────────────────────────────────────────

interface FieldProps {
  label: string
  children: React.ReactNode
}

function Field({ label, children }: FieldProps) {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  )
}

// ─── ReviewRow (step 5 only) ──────────────────────────────────────────────────

interface ReviewRowProps {
  label: string
  value: string
  isLast?: boolean
}

function ReviewRow({ label, value, isLast = false }: ReviewRowProps) {
  return (
    <View style={[styles.reviewRow, !isLast && styles.reviewRowBorder]}>
      <Text style={styles.reviewLabel}>{label}</Text>
      <Text style={styles.reviewValue} numberOfLines={2}>{value}</Text>
    </View>
  )
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function CreateEventScreen({ navigation }: Props) {
  const [step, setStep] = useState<Step>(1)
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [validationError, setValidationError] = useState('')
  const [submitError, setSubmitError] = useState('')

  const { mutate: createEvent, isPending: creating } = useCreateEvent()
  const { mutate: publishEvent, isPending: publishing } = usePublishEvent()

  const submitting = creating || publishing

  useEffect(() => {
    setValidationError('')
  }, [step])

  const handleNext = () => {
    const error = validateStep(step, form)
    if (error) {
      setValidationError(error)
      return
    }
    setStep((s) => (s + 1) as Step)
  }

  const handleBack = () => {
    if (step === 1) {
      navigation.goBack()
    } else {
      setStep((s) => (s - 1) as Step)
    }
  }

  const addTier = () => {
    if (form.tiers.length >= MAX_TIERS) return
    setForm((f) => ({
      ...f,
      tiers: [
        ...f.tiers,
        { id: Date.now().toString(), name: '', price: '', capacity: '' },
      ],
    }))
  }

  const removeTier = (id: string) => {
    setForm((f) => ({ ...f, tiers: f.tiers.filter((t) => t.id !== id) }))
  }

  const updateTier = (id: string, field: keyof Omit<TierDraft, 'id'>, value: string) => {
    setForm((f) => ({
      ...f,
      tiers: f.tiers.map((t) => (t.id === id ? { ...t, [field]: value } : t)),
    }))
  }

  const handleSubmit = (status: 'draft' | 'published'): void => {
    setSubmitError('')
    createEvent(
      {
        name: form.name.trim(),
        category: form.category.trim(),
        description: form.description.trim(),
        address: form.address.trim(),
        state: form.state.trim(),
        date: form.date ? new Date(form.date).toISOString() : new Date().toISOString(),
        startTime: form.startTime || '',
        endTime: form.endTime || '',
        venue: form.venue || '',
        images: form.imageUrl ? [form.imageUrl] : undefined,
        ticketType: form.tiers.map((t) => ({
          name: t.name,
          price: parseFloat(t.price) || 0,
          capacity: parseInt(t.capacity, 10) || 0,
        })),
      },
      {
        onSuccess: (createdEvent) => {
          if (status === 'published' && createdEvent?._id) {
            publishEvent(
              { eventId: createdEvent._id },
              {
                onSuccess: () => navigation.goBack(),
                onError: () => navigation.goBack(),
              }
            )
          } else {
            navigation.goBack()
          }
        },
        onError: () => {
          setSubmitError('Failed to create event. Please try again.')
        },
      }
    )
  }

  const renderStep = (): React.ReactNode => {
    switch (step) {
      case 1:
        return (
          <View>
            <Text style={styles.stepHeading}>Basic Info</Text>
            <Field label="Event Name">
              <TextInput
                style={styles.textInput}
                value={form.name}
                onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
                placeholder="e.g. Lagos Music Festival"
                placeholderTextColor={colors.mobile.textMuted}
              />
            </Field>
            <Field label="Category">
              <TextInput
                style={styles.textInput}
                value={form.category}
                onChangeText={(v) => setForm((f) => ({ ...f, category: v }))}
                placeholder="Music, Comedy, Fashion, Sports…"
                placeholderTextColor={colors.mobile.textMuted}
              />
            </Field>
            <Field label="Description">
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={form.description}
                onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
                placeholder="Tell attendees what to expect…"
                placeholderTextColor={colors.mobile.textMuted}
                multiline
                textAlignVertical="top"
              />
            </Field>
          </View>
        )

      case 2:
        return (
          <View>
            <Text style={styles.stepHeading}>Date & Location</Text>
            <Field label="Date">
              <TextInput
                style={styles.textInput}
                value={form.date}
                onChangeText={(v) => setForm((f) => ({ ...f, date: v }))}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.mobile.textMuted}
                keyboardType="numbers-and-punctuation"
              />
            </Field>
            <Field label="Start Time">
              <TextInput
                style={styles.textInput}
                value={form.startTime}
                onChangeText={(v) => setForm((f) => ({ ...f, startTime: v }))}
                placeholder="18:00"
                placeholderTextColor={colors.mobile.textMuted}
                keyboardType="numbers-and-punctuation"
              />
            </Field>
            <Field label="End Time">
              <TextInput
                style={styles.textInput}
                value={form.endTime}
                onChangeText={(v) => setForm((f) => ({ ...f, endTime: v }))}
                placeholder="22:00"
                placeholderTextColor={colors.mobile.textMuted}
                keyboardType="numbers-and-punctuation"
              />
            </Field>
            <Field label="Venue Name">
              <TextInput
                style={styles.textInput}
                value={form.venue}
                onChangeText={(v) => setForm((f) => ({ ...f, venue: v }))}
                placeholder="e.g. Eko Hotel"
                placeholderTextColor={colors.mobile.textMuted}
              />
            </Field>
            <Field label="Address *">
              <TextInput
                style={styles.textInput}
                value={form.address}
                onChangeText={(v) => setForm((f) => ({ ...f, address: v }))}
                placeholder="Full street address"
                placeholderTextColor={colors.mobile.textMuted}
              />
            </Field>
            <Field label="State *">
              <TextInput
                style={styles.textInput}
                value={form.state}
                onChangeText={(v) => setForm((f) => ({ ...f, state: v }))}
                placeholder="e.g. Lagos"
                placeholderTextColor={colors.mobile.textMuted}
              />
            </Field>
          </View>
        )

      case 3:
        return (
          <View>
            <Text style={styles.stepHeading}>Ticket Tiers</Text>
            {form.tiers.length === 0 ? (
              <View style={styles.emptyTiers}>
                <Text style={styles.emptyTiersText}>No tiers added</Text>
                <AnimatedPressable onPress={addTier} style={styles.addTierButton} hapticStyle="medium">
                  <Text style={styles.addTierButtonText}>Add Tier</Text>
                </AnimatedPressable>
              </View>
            ) : (
              <>
                {form.tiers.map((tier, index) => (
                  <View key={tier.id} style={styles.tierCard}>
                    <View style={styles.tierCardHeader}>
                      <Text style={styles.tierCardLabel}>Tier {index + 1}</Text>
                      <AnimatedPressable
                        onPress={() => removeTier(tier.id)}
                        style={styles.removeTierButton}
                        hapticStyle="light"
                      >
                        <X size={16} color={colors.mobile.error} strokeWidth={2.5} />
                      </AnimatedPressable>
                    </View>
                    <Field label="Tier Name">
                      <TextInput
                        style={styles.textInput}
                        value={tier.name}
                        onChangeText={(v) => updateTier(tier.id, 'name', v)}
                        placeholder="e.g. VIP, Regular, Early Bird"
                        placeholderTextColor={colors.mobile.textMuted}
                      />
                    </Field>
                    <Field label="Price (₦)">
                      <TextInput
                        style={styles.textInput}
                        value={tier.price}
                        onChangeText={(v) => updateTier(tier.id, 'price', v)}
                        placeholder="0.00"
                        placeholderTextColor={colors.mobile.textMuted}
                        keyboardType="decimal-pad"
                      />
                    </Field>
                    <Field label="Capacity">
                      <TextInput
                        style={styles.textInput}
                        value={tier.capacity}
                        onChangeText={(v) => updateTier(tier.id, 'capacity', v)}
                        placeholder="100"
                        placeholderTextColor={colors.mobile.textMuted}
                        keyboardType="number-pad"
                      />
                    </Field>
                  </View>
                ))}
                {form.tiers.length < MAX_TIERS && (
                  <AnimatedPressable onPress={addTier} style={styles.addTierButton} hapticStyle="medium">
                    <Text style={styles.addTierButtonText}>Add Tier</Text>
                  </AnimatedPressable>
                )}
              </>
            )}
          </View>
        )

      case 4:
        return (
          <View>
            <Text style={styles.stepHeading}>Cover Image</Text>
            <Field label="Image URL">
              <TextInput
                style={styles.textInput}
                value={form.imageUrl}
                onChangeText={(v) => setForm((f) => ({ ...f, imageUrl: v }))}
                placeholder="https://…"
                placeholderTextColor={colors.mobile.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
            </Field>
            <Text style={styles.imageNote}>
              Enter a direct image URL. Image picker coming soon.
            </Text>
            {form.imageUrl.length > 0 && (
              <Image
                source={{ uri: form.imageUrl }}
                style={styles.imagePreview}
                resizeMode="cover"
              />
            )}
          </View>
        )

      case 5: {
        const timeDisplay =
          form.startTime || form.endTime
            ? `${form.startTime || '—'}–${form.endTime || '—'}`
            : 'Not set'
        const tierSummary =
          form.tiers.length > 0
            ? `${form.tiers.length} tier${form.tiers.length === 1 ? '' : 's'}`
            : 'No tiers (free entry)'

        return (
          <View>
            <Text style={styles.stepHeading}>Review & Publish</Text>
            <View style={styles.reviewCard}>
              <ReviewRow label="Name" value={form.name || '—'} />
              <ReviewRow label="Category" value={form.category || '—'} />
              <ReviewRow label="Date" value={form.date || 'Not set'} />
              <ReviewRow label="Time" value={timeDisplay} />
              <ReviewRow label="Venue" value={form.venue || '—'} />
              <ReviewRow label="Address" value={form.address || '—'} />
              <ReviewRow label="State" value={form.state || '—'} />
              <ReviewRow label="Ticket Tiers" value={tierSummary} isLast />
            </View>
            {submitError.length > 0 && (
              <Text style={styles.submitError}>{submitError}</Text>
            )}
          </View>
        )
      }
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <AnimatedPressable onPress={handleBack} style={styles.backButton} hapticStyle="light">
          <ChevronLeft size={24} color={colors.mobile.textPrimary} strokeWidth={2} />
        </AnimatedPressable>
        <Text style={styles.headerTitle}>Create Event</Text>
        <Text style={styles.headerStep}>{step}/5</Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${(step / 5) * 100}%` }]} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderStep()}
          {validationError.length > 0 && (
            <Text style={styles.validationError}>{validationError}</Text>
          )}
          <View style={styles.scrollSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom CTA */}
      {step < 5 ? (
        <View style={styles.bottomCta}>
          <AnimatedPressable onPress={handleNext} style={styles.nextButton} hapticStyle="medium">
            <Text style={styles.nextButtonText}>Next →</Text>
          </AnimatedPressable>
        </View>
      ) : (
        <View style={styles.step5Ctas}>
          <AnimatedPressable
            onPress={() => handleSubmit('draft')}
            style={styles.draftButton}
            hapticStyle="medium"
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={colors.mobile.textPrimary} />
            ) : (
              <Text style={styles.draftButtonText}>Save as Draft</Text>
            )}
          </AnimatedPressable>
          <AnimatedPressable
            onPress={() => handleSubmit('published')}
            style={styles.publishButton}
            hapticStyle="medium"
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.publishButtonText}>Publish Now</Text>
            )}
          </AnimatedPressable>
        </View>
      )}
    </SafeAreaView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.mobile.bg,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sp[4],
    paddingTop: sp[3],
    paddingBottom: sp[3],
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: fs.base,
    fontWeight: '700',
    color: colors.mobile.textPrimary,
  },
  headerStep: {
    width: 44,
    textAlign: 'right',
    fontSize: fs.sm,
    color: colors.mobile.textMuted,
  },
  progressTrack: {
    height: 3,
    backgroundColor: colors.mobile.border,
  },
  progressFill: {
    height: 3,
    backgroundColor: colors.brand.DEFAULT,
  },
  scrollContent: {
    paddingHorizontal: sp[4],
    paddingTop: sp[5],
    paddingBottom: sp[4],
  },
  scrollSpacer: {
    height: sp[8],
  },
  stepHeading: {
    fontSize: fs.lg,
    fontWeight: '700',
    color: colors.mobile.textPrimary,
    marginBottom: sp[5],
  },
  fieldContainer: {
    marginBottom: sp[4],
  },
  fieldLabel: {
    fontSize: fs.sm,
    fontWeight: '600',
    color: colors.mobile.textSecondary,
    marginBottom: sp[2],
  },
  textInput: {
    backgroundColor: colors.mobile.surface,
    borderWidth: 1,
    borderColor: colors.mobile.border,
    borderRadius: rd.lg,
    paddingHorizontal: sp[4],
    paddingVertical: sp[3],
    fontSize: fs.base,
    color: colors.mobile.textPrimary,
    minHeight: 48,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  validationError: {
    fontSize: fs.sm,
    color: colors.mobile.error,
    marginTop: sp[2],
  },
  // Tier styles
  emptyTiers: {
    alignItems: 'center',
    paddingVertical: sp[8],
    gap: sp[4],
  },
  emptyTiersText: {
    fontSize: fs.base,
    color: colors.mobile.textMuted,
  },
  addTierButton: {
    backgroundColor: colors.brand.DEFAULT,
    paddingHorizontal: sp[6],
    paddingVertical: sp[3],
    borderRadius: rd.lg,
    alignItems: 'center',
  },
  addTierButtonText: {
    fontSize: fs.sm,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tierCard: {
    backgroundColor: colors.mobile.surface,
    borderRadius: rd.lg,
    padding: sp[4],
    marginBottom: sp[3],
  },
  tierCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: sp[3],
  },
  tierCardLabel: {
    fontSize: fs.sm,
    color: colors.mobile.textMuted,
    fontWeight: '600',
  },
  removeTierButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Image step
  imageNote: {
    fontSize: fs.xs,
    color: colors.mobile.textMuted,
    marginTop: sp[2],
  },
  imagePreview: {
    width: '100%',
    height: 180,
    borderRadius: rd.xl,
    marginTop: sp[3],
  },
  // Review card
  reviewCard: {
    backgroundColor: colors.mobile.surface,
    borderRadius: rd.lg,
    paddingHorizontal: sp[4],
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: sp[3],
  },
  reviewRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.mobile.border,
  },
  reviewLabel: {
    fontSize: fs.xs,
    color: colors.mobile.textMuted,
  },
  reviewValue: {
    fontSize: fs.sm,
    color: colors.mobile.textPrimary,
    textAlign: 'right',
    flex: 1,
    marginLeft: sp[4],
  },
  submitError: {
    fontSize: fs.sm,
    color: colors.mobile.error,
    marginTop: sp[4],
    textAlign: 'center',
  },
  // Bottom CTAs
  bottomCta: {
    paddingHorizontal: sp[4],
    paddingVertical: sp[4],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.mobile.border,
  },
  nextButton: {
    backgroundColor: colors.brand.DEFAULT,
    height: 52,
    borderRadius: rd.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    fontSize: fs.base,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  step5Ctas: {
    flexDirection: 'row',
    paddingHorizontal: sp[4],
    paddingVertical: sp[4],
    gap: sp[3],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.mobile.border,
  },
  draftButton: {
    flex: 1,
    height: 52,
    borderRadius: rd.full,
    borderWidth: 1,
    borderColor: colors.mobile.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftButtonText: {
    fontSize: fs.sm,
    fontWeight: '600',
    color: colors.mobile.textPrimary,
  },
  publishButton: {
    flex: 1,
    height: 52,
    borderRadius: rd.full,
    backgroundColor: colors.brand.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  publishButtonText: {
    fontSize: fs.sm,
    fontWeight: '700',
    color: '#FFFFFF',
  },
})
