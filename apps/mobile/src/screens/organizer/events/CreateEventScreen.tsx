import React, { useState } from 'react'
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
import * as ImagePicker from 'expo-image-picker'
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker'
import { ChevronLeft, X, Camera, Calendar, Clock } from 'lucide-react-native'
import { colors, sp, rd, fs } from '@comfytag/ui/tokens'
import { AnimatedPressable } from '../../../components/ui/AnimatedPressable'
import { useCreateEvent, usePublishEvent, useUploadEventImage, useCategories } from '../../../hooks'
import { useEventDraftStore } from '../../../store'
import type { CreateEventStep, EventDraftForm, TierDraft } from '../../../store/eventDraftStore'
import type { OrganizerEventsStackParamList } from '../../../navigation/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = StackScreenProps<OrganizerEventsStackParamList, 'CreateEvent'>

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS: { id: CreateEventStep; label: string }[] = [
  { id: 'basics', label: 'Basic Info' },
  { id: 'tickets', label: 'Ticket Tiers' },
  { id: 'review', label: 'Review & Publish' },
]

const MAX_TIERS = 5
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const TIME_RE = /^([01]?\d|2[0-3]):[0-5]\d$/

function isValidDateString(value: string): boolean {
  return DATE_RE.test(value) && !isNaN(new Date(value).getTime())
}

// ─── Date/time <-> picker conversions ──────────────────────────────────────────

function dateStringToDate(value: string): Date {
  return isValidDateString(value) ? new Date(`${value}T00:00:00`) : new Date()
}

function dateToDateString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function timeStringToDate(value: string): Date {
  const base = new Date()
  if (TIME_RE.test(value)) {
    const [h, m] = value.split(':').map(Number)
    base.setHours(h, m, 0, 0)
  } else {
    base.setHours(12, 0, 0, 0)
  }
  return base
}

function dateToTimeString(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validateStep(step: CreateEventStep, form: EventDraftForm): string {
  if (step === 'basics') {
    if (!form.name.trim()) return 'Event name is required'
    if (!form.category.trim()) return 'Category is required'
    if (!form.description.trim()) return 'Description is required'
    if (!isValidDateString(form.date.trim())) return 'Enter a valid date (YYYY-MM-DD)'
    if (!TIME_RE.test(form.startTime.trim())) return 'Enter a valid start time (HH:MM)'
    if (form.endTime.trim().length > 0 && !TIME_RE.test(form.endTime.trim())) {
      return 'Enter a valid end time (HH:MM)'
    }
    if (!form.venue.trim()) return 'Venue name is required'
    if (!form.address.trim()) return 'Address is required'
    if (!form.state.trim()) return 'State is required'
  }
  if (step === 'tickets') {
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

// ─── Date/time field ────────────────────────────────────────────────────────
// Native picker on both platforms — Android's is an imperative OS dialog
// (handled by the caller before this ever renders `active`), iOS renders the
// picker inline in-place with a Done button to collapse it.

interface DateTimeFieldProps {
  label: string
  value: string
  placeholder: string
  mode: 'date' | 'time'
  active: boolean
  pickerValue: Date
  onOpen: () => void
  onChange: (event: DateTimePickerEvent, date?: Date) => void
  onDone: () => void
}

function DateTimeField({
  label,
  value,
  placeholder,
  mode,
  active,
  pickerValue,
  onOpen,
  onChange,
  onDone,
}: DateTimeFieldProps) {
  return (
    <Field label={label}>
      <AnimatedPressable onPress={onOpen} style={styles.dateTimeTrigger} hapticStyle="light">
        {mode === 'date' ? (
          <Calendar size={18} color={colors.textPublic.secondary} strokeWidth={2} />
        ) : (
          <Clock size={18} color={colors.textPublic.secondary} strokeWidth={2} />
        )}
        <Text style={value.length > 0 ? styles.dateTimeValue : styles.dateTimePlaceholder}>
          {value.length > 0 ? value : placeholder}
        </Text>
      </AnimatedPressable>
      {active && Platform.OS === 'ios' && (
        <View style={styles.iosPickerWrap}>
          <DateTimePicker mode={mode} value={pickerValue} display="spinner" onChange={onChange} />
          <AnimatedPressable onPress={onDone} style={styles.iosPickerDone} hapticStyle="light">
            <Text style={styles.iosPickerDoneText}>Done</Text>
          </AnimatedPressable>
        </View>
      )}
    </Field>
  )
}

// ─── ReviewRow ─────────────────────────────────────────────────────────────────

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

// ─── Cover image picker ───────────────────────────────────────────────────────

interface CoverImagePickerProps {
  imageUrl: string
  uploading: boolean
  onPick: () => void
}

function CoverImagePicker({ imageUrl, uploading, onPick }: CoverImagePickerProps) {
  return (
    <AnimatedPressable
      onPress={onPick}
      disabled={uploading}
      style={styles.coverUpload}
      hapticStyle="light"
    >
      {imageUrl.length > 0 ? (
        <Image source={{ uri: imageUrl }} style={styles.coverImage} resizeMode="cover" />
      ) : (
        <View style={styles.coverPlaceholder}>
          <Camera size={32} color={colors.textPublic.secondary} strokeWidth={2} />
          <Text style={styles.coverPlaceholderText}>Upload Event Cover</Text>
        </View>
      )}
      {uploading && (
        <View style={styles.coverUploadingOverlay}>
          <ActivityIndicator color="#FFFFFF" />
        </View>
      )}
    </AnimatedPressable>
  )
}

// ─── Category picker ────────────────────────────────────────────────────────
// Chips sourced from categories organizers have already used (Event.distinct
// on the backend) so most picks stay consistent with the filters attendees
// browse by; "Other" opens a free-text field for a genuinely new category.

interface CategoryPickerProps {
  value: string
  onChange: (value: string) => void
}

function CategoryPicker({ value, onChange }: CategoryPickerProps) {
  const { data: categories = [] } = useCategories()
  const [customMode, setCustomMode] = useState(false)
  const isKnownValue = categories.includes(value)
  const showCustomInput = customMode || (value.length > 0 && !isKnownValue)

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryChipRow}>
        {categories.map((cat) => {
          const active = cat === value
          return (
            <AnimatedPressable
              key={cat}
              onPress={() => {
                setCustomMode(false)
                onChange(cat)
              }}
              style={[styles.categoryChip, active && styles.categoryChipActive]}
              hapticStyle="light"
            >
              <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>{cat}</Text>
            </AnimatedPressable>
          )
        })}
        <AnimatedPressable
          onPress={() => setCustomMode(true)}
          style={[styles.categoryChip, showCustomInput && styles.categoryChipActive]}
          hapticStyle="light"
        >
          <Text style={[styles.categoryChipText, showCustomInput && styles.categoryChipTextActive]}>Other</Text>
        </AnimatedPressable>
      </ScrollView>
      {showCustomInput && (
        <TextInput
          style={[styles.textInput, styles.categoryCustomInput]}
          value={value}
          onChangeText={onChange}
          placeholder="Enter a new category"
          placeholderTextColor={colors.textPublic.muted}
        />
      )}
    </View>
  )
}

// ─── Progress indicator ───────────────────────────────────────────────────────

function ProgressIndicator({ currentIndex }: { currentIndex: number }) {
  return (
    <View style={styles.progressWrap}>
      <View style={styles.progressSegments}>
        {STEPS.map((s, i) => (
          <View
            key={s.id}
            style={[styles.progressSegment, i <= currentIndex && styles.progressSegmentActive]}
          />
        ))}
      </View>
      <View style={styles.progressLabels}>
        {STEPS.map((s, i) => (
          <Text
            key={s.id}
            style={[styles.progressLabel, i === currentIndex && styles.progressLabelActive]}
            numberOfLines={1}
          >
            {s.label}
          </Text>
        ))}
      </View>
    </View>
  )
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function CreateEventScreen({ navigation }: Props) {
  // Step + form state live in a persisted Zustand store (autosaved draft) —
  // leaving this screen and coming back restores exactly where the organizer left off.
  const step = useEventDraftStore((s) => s.step)
  const form = useEventDraftStore((s) => s.form)
  const setStep = useEventDraftStore((s) => s.setStep)
  const updateForm = useEventDraftStore((s) => s.updateForm)
  const resetDraft = useEventDraftStore((s) => s.resetDraft)

  const [validationError, setValidationError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [activePicker, setActivePicker] = useState<'date' | 'startTime' | 'endTime' | null>(null)

  const { mutate: createEvent, isPending: creating } = useCreateEvent()
  const { mutate: publishEvent, isPending: publishing } = usePublishEvent()
  const { mutate: uploadImage, isPending: uploadingImage } = useUploadEventImage()

  const submitting = creating || publishing
  // A draft persisted before the step list last changed could still reference
  // a step id that no longer exists (e.g. the old 'media' step) — fall back
  // to the first step instead of leaving stepIndex at -1, which would crash
  // goToStep's STEPS[index] lookup.
  const stepIndex = Math.max(0, STEPS.findIndex((s) => s.id === step))

  const handlePickCoverImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      setSubmitError('Photo library access is needed to upload a cover image.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [16, 9],
    })
    if (result.canceled || result.assets.length === 0) return

    const asset = result.assets[0]
    setSubmitError('')
    uploadImage(
      {
        uri: asset.uri,
        name: asset.fileName ?? `cover-${Date.now()}.jpg`,
        type: asset.mimeType ?? 'image/jpeg',
      },
      {
        onSuccess: (data) => {
          if (data.url) updateForm({ imageUrl: data.url })
        },
        onError: () => setSubmitError('Could not upload image. Please try again.'),
      }
    )
  }

  const handlePickerChange = (which: 'date' | 'startTime' | 'endTime') => (
    event: DateTimePickerEvent,
    selected?: Date
  ) => {
    if (Platform.OS === 'android') setActivePicker(null)
    if (event.type === 'dismissed' || selected === undefined) return
    if (which === 'date') updateForm({ date: dateToDateString(selected) })
    else if (which === 'startTime') updateForm({ startTime: dateToTimeString(selected) })
    else updateForm({ endTime: dateToTimeString(selected) })
  }

  const openPicker = (which: 'date' | 'startTime' | 'endTime') => {
    const mode = which === 'date' ? 'date' : 'time'
    const value =
      which === 'date'
        ? dateStringToDate(form.date)
        : timeStringToDate(which === 'startTime' ? form.startTime : form.endTime)

    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({ value, mode, onChange: handlePickerChange(which), is24Hour: true })
    } else {
      setActivePicker((prev) => (prev === which ? null : which))
    }
  }

  const goToStep = (index: number) => {
    setValidationError('')
    setStep(STEPS[index].id)
  }

  const handleNext = () => {
    const error = validateStep(step, form)
    if (error) {
      setValidationError(error)
      return
    }
    if (stepIndex < STEPS.length - 1) {
      goToStep(stepIndex + 1)
    }
  }

  const handleBack = () => {
    if (stepIndex === 0) {
      navigation.goBack()
    } else {
      goToStep(stepIndex - 1)
    }
  }

  const addTier = () => {
    if (form.tiers.length >= MAX_TIERS) return
    updateForm({
      tiers: [
        ...form.tiers,
        { id: Date.now().toString(), name: '', price: '', capacity: '' },
      ],
    })
  }

  const removeTier = (id: string) => {
    updateForm({ tiers: form.tiers.filter((t) => t.id !== id) })
  }

  const updateTier = (id: string, field: keyof Omit<TierDraft, 'id'>, value: string) => {
    updateForm({
      tiers: form.tiers.map((t) => (t.id === id ? { ...t, [field]: value } : t)),
    })
  }

  const handleSubmit = (status: 'draft' | 'published'): void => {
    setSubmitError('')
    const parsedDate = new Date(form.date)
    createEvent(
      {
        name: form.name.trim(),
        category: form.category.trim(),
        description: form.description.trim(),
        address: form.address.trim(),
        state: form.state.trim(),
        // validateStep already guarantees form.date is a valid YYYY-MM-DD
        // string before Next can leave the basics step; this guard only
        // matters if that ever changes, so it never throws on submit.
        date: isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString(),
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
                onSuccess: () => {
                  resetDraft()
                  navigation.goBack()
                },
                onError: () => {
                  resetDraft()
                  navigation.goBack()
                },
              }
            )
          } else {
            resetDraft()
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
      case 'basics':
        return (
          <View>
            <Text style={styles.stepHeading}>Basic Info</Text>
            <CoverImagePicker
              imageUrl={form.imageUrl}
              uploading={uploadingImage}
              onPick={() => void handlePickCoverImage()}
            />
            <Field label="Event Name">
              <TextInput
                style={styles.textInput}
                value={form.name}
                onChangeText={(v) => updateForm({ name: v })}
                placeholder="e.g. Lagos Music Festival"
                placeholderTextColor={colors.textPublic.muted}
              />
            </Field>
            <Field label="Category">
              <CategoryPicker value={form.category} onChange={(v) => updateForm({ category: v })} />
            </Field>
            <Field label="Description">
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={form.description}
                onChangeText={(v) => updateForm({ description: v })}
                placeholder="Tell attendees what to expect…"
                placeholderTextColor={colors.textPublic.muted}
                multiline
                textAlignVertical="top"
              />
            </Field>
            <DateTimeField
              label="Date *"
              mode="date"
              value={form.date}
              placeholder="Select a date"
              active={activePicker === 'date'}
              pickerValue={dateStringToDate(form.date)}
              onOpen={() => openPicker('date')}
              onChange={handlePickerChange('date')}
              onDone={() => setActivePicker(null)}
            />
            <DateTimeField
              label="Start Time *"
              mode="time"
              value={form.startTime}
              placeholder="Select a start time"
              active={activePicker === 'startTime'}
              pickerValue={timeStringToDate(form.startTime)}
              onOpen={() => openPicker('startTime')}
              onChange={handlePickerChange('startTime')}
              onDone={() => setActivePicker(null)}
            />
            <DateTimeField
              label="End Time"
              mode="time"
              value={form.endTime}
              placeholder="Select an end time"
              active={activePicker === 'endTime'}
              pickerValue={timeStringToDate(form.endTime)}
              onOpen={() => openPicker('endTime')}
              onChange={handlePickerChange('endTime')}
              onDone={() => setActivePicker(null)}
            />
            <Field label="Venue Name *">
              <TextInput
                style={styles.textInput}
                value={form.venue}
                onChangeText={(v) => updateForm({ venue: v })}
                placeholder="e.g. Eko Hotel"
                placeholderTextColor={colors.textPublic.muted}
              />
            </Field>
            <Field label="Address *">
              <TextInput
                style={styles.textInput}
                value={form.address}
                onChangeText={(v) => updateForm({ address: v })}
                placeholder="Full street address"
                placeholderTextColor={colors.textPublic.muted}
              />
            </Field>
            <Field label="State *">
              <TextInput
                style={styles.textInput}
                value={form.state}
                onChangeText={(v) => updateForm({ state: v })}
                placeholder="e.g. Lagos"
                placeholderTextColor={colors.textPublic.muted}
              />
            </Field>
          </View>
        )

      case 'tickets':
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
                        <X size={16} color={colors.error.DEFAULT} strokeWidth={2.5} />
                      </AnimatedPressable>
                    </View>
                    <Field label="Tier Name">
                      <TextInput
                        style={styles.textInput}
                        value={tier.name}
                        onChangeText={(v) => updateTier(tier.id, 'name', v)}
                        placeholder="e.g. VIP, Regular, Early Bird"
                        placeholderTextColor={colors.textPublic.muted}
                      />
                    </Field>
                    <Field label="Price (₦)">
                      <TextInput
                        style={styles.textInput}
                        value={tier.price}
                        onChangeText={(v) => updateTier(tier.id, 'price', v)}
                        placeholder="0.00"
                        placeholderTextColor={colors.textPublic.muted}
                        keyboardType="decimal-pad"
                      />
                    </Field>
                    <Field label="Capacity">
                      <TextInput
                        style={styles.textInput}
                        value={tier.capacity}
                        onChangeText={(v) => updateTier(tier.id, 'capacity', v)}
                        placeholder="100"
                        placeholderTextColor={colors.textPublic.muted}
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

      case 'review': {
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

  const isReview = step === 'review'

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <AnimatedPressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hapticStyle="light"
        >
          <ChevronLeft size={24} color={colors.textPublic.primary} strokeWidth={2} />
        </AnimatedPressable>
        <Text style={styles.headerTitle}>Create Event</Text>
        <Text style={styles.headerStep}>{stepIndex + 1}/{STEPS.length}</Text>
      </View>

      <ProgressIndicator currentIndex={stepIndex} />

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
      {!isReview ? (
        <View style={styles.bottomNav}>
          <AnimatedPressable onPress={handleBack} style={styles.backButtonBottom} hapticStyle="light">
            <Text style={styles.backButtonBottomText}>Back</Text>
          </AnimatedPressable>
          <AnimatedPressable onPress={handleNext} style={styles.nextButton} hapticStyle="medium">
            <Text style={styles.nextButtonText}>Next →</Text>
          </AnimatedPressable>
        </View>
      ) : (
        <View style={styles.reviewBottomWrap}>
          <AnimatedPressable onPress={handleBack} style={styles.backLink} hapticStyle="light">
            <Text style={styles.backLinkText}>← Back to edit</Text>
          </AnimatedPressable>
          <View style={styles.reviewCtas}>
            <AnimatedPressable
              onPress={() => handleSubmit('draft')}
              style={styles.draftButton}
              hapticStyle="medium"
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={colors.textPublic.primary} />
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
        </View>
      )}
    </SafeAreaView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.public.bg,
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
    color: colors.textPublic.primary,
  },
  headerStep: {
    width: 44,
    textAlign: 'right',
    fontSize: fs.sm,
    color: colors.textPublic.muted,
  },

  // Progress indicator
  progressWrap: {
    paddingHorizontal: sp[4],
    paddingBottom: sp[3],
  },
  progressSegments: {
    flexDirection: 'row',
    gap: sp[2],
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: rd.full,
    backgroundColor: colors.public.border,
  },
  progressSegmentActive: {
    backgroundColor: colors.brand.DEFAULT,
  },
  progressLabels: {
    flexDirection: 'row',
    marginTop: sp[2],
  },
  progressLabel: {
    flex: 1,
    fontSize: fs.xs,
    color: colors.textPublic.muted,
    textAlign: 'center',
  },
  progressLabelActive: {
    color: colors.brand.DEFAULT,
    fontWeight: '700',
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
    color: colors.textPublic.primary,
    marginBottom: sp[5],
  },
  fieldContainer: {
    marginBottom: sp[4],
  },
  fieldLabel: {
    fontSize: fs.sm,
    fontWeight: '600',
    color: colors.textPublic.secondary,
    marginBottom: sp[2],
  },
  textInput: {
    backgroundColor: colors.public.surface,
    borderWidth: 1,
    borderColor: colors.public.border,
    borderRadius: rd.lg,
    paddingHorizontal: sp[4],
    paddingVertical: sp[3],
    fontSize: fs.base,
    color: colors.textPublic.primary,
    minHeight: 48,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },

  // Date/time field
  dateTimeTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp[3],
    backgroundColor: colors.public.surface,
    borderWidth: 1,
    borderColor: colors.public.border,
    borderRadius: rd.lg,
    paddingHorizontal: sp[4],
    minHeight: 48,
  },
  dateTimeValue: {
    fontSize: fs.base,
    color: colors.textPublic.primary,
  },
  dateTimePlaceholder: {
    fontSize: fs.base,
    color: colors.textPublic.muted,
  },
  iosPickerWrap: {
    backgroundColor: colors.public.surface,
    borderWidth: 1,
    borderColor: colors.public.border,
    borderRadius: rd.lg,
    marginTop: sp[2],
    alignItems: 'center',
    paddingBottom: sp[2],
  },
  iosPickerDone: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: sp[2],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.public.border,
    marginTop: sp[1],
  },
  iosPickerDoneText: {
    fontSize: fs.sm,
    fontWeight: '700',
    color: colors.brand.DEFAULT,
  },

  validationError: {
    fontSize: fs.sm,
    color: colors.error.DEFAULT,
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
    color: colors.textPublic.muted,
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
    backgroundColor: colors.public.surface,
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
    color: colors.textPublic.muted,
    fontWeight: '600',
  },
  removeTierButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Cover image picker
  coverUpload: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: rd.xl,
    marginBottom: sp[5],
    overflow: 'hidden',
  },
  coverPlaceholder: {
    flex: 1,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.public.border,
    borderRadius: rd.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: sp[2],
    backgroundColor: colors.public.surfaceAlt,
  },
  coverPlaceholderText: {
    fontSize: fs.sm,
    color: colors.textPublic.secondary,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverUploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Category chip picker
  categoryChipRow: {
    gap: sp[2],
    paddingBottom: sp[1],
  },
  categoryChip: {
    paddingHorizontal: sp[4],
    paddingVertical: sp[2],
    borderRadius: rd.full,
    backgroundColor: colors.public.surfaceAlt,
  },
  categoryChipActive: {
    backgroundColor: colors.brand.DEFAULT,
  },
  categoryChipText: {
    fontSize: fs.sm,
    fontWeight: '600',
    color: colors.textPublic.secondary,
  },
  categoryChipTextActive: {
    color: colors.textPublic.onBrand,
  },
  categoryCustomInput: {
    marginTop: sp[3],
  },
  // Review card
  reviewCard: {
    backgroundColor: colors.public.surface,
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
    borderBottomColor: colors.public.border,
  },
  reviewLabel: {
    fontSize: fs.xs,
    color: colors.textPublic.muted,
  },
  reviewValue: {
    fontSize: fs.sm,
    color: colors.textPublic.primary,
    textAlign: 'right',
    flex: 1,
    marginLeft: sp[4],
  },
  submitError: {
    fontSize: fs.sm,
    color: colors.error.DEFAULT,
    marginTop: sp[4],
    textAlign: 'center',
  },
  // Bottom nav (Basics / Tickets / Media steps)
  bottomNav: {
    flexDirection: 'row',
    paddingHorizontal: sp[4],
    paddingVertical: sp[4],
    gap: sp[3],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.public.border,
  },
  backButtonBottom: {
    flex: 1,
    height: 52,
    borderRadius: rd.full,
    borderWidth: 1,
    borderColor: colors.public.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonBottomText: {
    fontSize: fs.base,
    fontWeight: '600',
    color: colors.textPublic.primary,
  },
  nextButton: {
    flex: 1,
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
  // Bottom nav (Review step)
  reviewBottomWrap: {
    paddingHorizontal: sp[4],
    paddingTop: sp[3],
    paddingBottom: sp[4],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.public.border,
  },
  backLink: {
    alignSelf: 'center',
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: sp[3],
    marginBottom: sp[1],
  },
  backLinkText: {
    fontSize: fs.sm,
    fontWeight: '600',
    color: colors.brand.DEFAULT,
  },
  reviewCtas: {
    flexDirection: 'row',
    gap: sp[3],
  },
  draftButton: {
    flex: 1,
    height: 52,
    borderRadius: rd.full,
    borderWidth: 1,
    borderColor: colors.public.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftButtonText: {
    fontSize: fs.sm,
    fontWeight: '600',
    color: colors.textPublic.primary,
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
