import React, { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
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
import { ChevronLeft } from 'lucide-react-native'
import type { Event } from '@comfytag/types'
import { colors, sp, rd, fs } from '@comfytag/ui/tokens'
import { AnimatedPressable } from '../../../components/ui/AnimatedPressable'
import { useOrganizerEventById, useUpdateEvent } from '../../../hooks'
import type { OrganizerEventsStackParamList } from '../../../navigation/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = StackScreenProps<OrganizerEventsStackParamList, 'EditEvent'>

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
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isoToDateString(iso: string | undefined): string {
  if (!iso) return ''
  try {
    return new Date(iso).toISOString().slice(0, 10)
  } catch {
    return ''
  }
}

function eventToForm(event: Event): FormState {
  return {
    name: event.name ?? '',
    category: event.category ?? '',
    description: event.description ?? '',
    date: isoToDateString(event.date),
    startTime: event.startTime ?? '',
    endTime: event.endTime ?? '',
    venue: event.venue ?? '',
    address: event.address ?? '',
    state: event.state ?? '',
  }
}

function formsDiffer(a: FormState, b: FormState): boolean {
  return (Object.keys(a) as (keyof FormState)[]).some(
    (k) => a[k].trim() !== b[k].trim()
  )
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

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function EditEventScreen({ navigation, route }: Props) {
  const { eventId } = route.params

  const {
    data: event,
    isLoading,
    isError,
    refetch,
  } = useOrganizerEventById(eventId)

  const { mutate: updateEvent, isPending: saving } = useUpdateEvent()

  const [original, setOriginal] = useState<FormState | null>(null)
  const [form, setForm] = useState<FormState | null>(null)
  const [saveError, setSaveError] = useState('')

  // Seed form once when event data first arrives
  useEffect(() => {
    if (event && form === null) {
      const parsed = eventToForm(event)
      setOriginal(parsed)
      setForm(parsed)
    }
  }, [event, form])

  const hasChanges = useMemo(() => {
    if (!original || !form) return false
    return formsDiffer(form, original)
  }, [form, original])

  const setField = (key: keyof FormState, value: string) => {
    setForm((f) => (f ? { ...f, [key]: value } : f))
  }

  const handleSave = (): void => {
    if (!hasChanges || saving || !form) return
    setSaveError('')
    updateEvent(
      {
        eventId,
        name: form.name.trim(),
        category: form.category.trim(),
        description: form.description.trim(),
        address: form.address.trim(),
        state: form.state.trim(),
        date: form.date ? new Date(form.date).toISOString() : undefined,
        startTime: form.startTime || undefined,
        endTime: form.endTime || undefined,
        venue: form.venue || undefined,
      },
      {
        onSuccess: () => navigation.goBack(),
        onError: () => setSaveError('Failed to save changes. Please try again.'),
      }
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <AnimatedPressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hapticStyle="light"
        >
          <ChevronLeft size={24} color={colors.mobile.textPrimary} strokeWidth={2} />
        </AnimatedPressable>
        <Text style={styles.headerTitle}>Edit Event</Text>
        <AnimatedPressable
          onPress={handleSave}
          style={styles.saveButton}
          hapticStyle="medium"
          disabled={!hasChanges || saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.brand.DEFAULT} />
          ) : (
            <Text style={[styles.saveText, (!hasChanges || saving) && styles.saveTextDisabled]}>
              Save
            </Text>
          )}
        </AnimatedPressable>
      </View>

      {isLoading ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={colors.brand.DEFAULT} />
        </View>
      ) : isError ? (
        <View style={styles.centeredState}>
          <Text style={styles.errorStateText}>Failed to load event</Text>
          <AnimatedPressable onPress={() => void refetch()} style={styles.retryButton} hapticStyle="medium">
            <Text style={styles.retryText}>Try Again</Text>
          </AnimatedPressable>
        </View>
      ) : form ? (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Field label="Event Name">
              <TextInput
                style={styles.textInput}
                value={form.name}
                onChangeText={(v) => setField('name', v)}
                placeholder="e.g. Lagos Music Festival"
                placeholderTextColor={colors.mobile.textMuted}
              />
            </Field>
            <Field label="Category">
              <TextInput
                style={styles.textInput}
                value={form.category}
                onChangeText={(v) => setField('category', v)}
                placeholder="Music, Comedy, Fashion…"
                placeholderTextColor={colors.mobile.textMuted}
              />
            </Field>
            <Field label="Description">
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={form.description}
                onChangeText={(v) => setField('description', v)}
                placeholder="Tell attendees what to expect…"
                placeholderTextColor={colors.mobile.textMuted}
                multiline
                textAlignVertical="top"
              />
            </Field>
            <Field label="Date">
              <TextInput
                style={styles.textInput}
                value={form.date}
                onChangeText={(v) => setField('date', v)}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.mobile.textMuted}
                keyboardType="numbers-and-punctuation"
              />
            </Field>
            <Field label="Start Time">
              <TextInput
                style={styles.textInput}
                value={form.startTime}
                onChangeText={(v) => setField('startTime', v)}
                placeholder="HH:MM"
                placeholderTextColor={colors.mobile.textMuted}
                keyboardType="numbers-and-punctuation"
              />
            </Field>
            <Field label="End Time">
              <TextInput
                style={styles.textInput}
                value={form.endTime}
                onChangeText={(v) => setField('endTime', v)}
                placeholder="HH:MM"
                placeholderTextColor={colors.mobile.textMuted}
                keyboardType="numbers-and-punctuation"
              />
            </Field>
            <Field label="Venue">
              <TextInput
                style={styles.textInput}
                value={form.venue}
                onChangeText={(v) => setField('venue', v)}
                placeholder="e.g. Eko Hotel"
                placeholderTextColor={colors.mobile.textMuted}
              />
            </Field>
            <Field label="Address">
              <TextInput
                style={styles.textInput}
                value={form.address}
                onChangeText={(v) => setField('address', v)}
                placeholder="Full street address"
                placeholderTextColor={colors.mobile.textMuted}
              />
            </Field>
            <Field label="State">
              <TextInput
                style={styles.textInput}
                value={form.state}
                onChangeText={(v) => setField('state', v)}
                placeholder="e.g. Lagos"
                placeholderTextColor={colors.mobile.textMuted}
              />
            </Field>

            {saveError.length > 0 && (
              <View style={styles.saveErrorBanner}>
                <Text style={styles.saveErrorText}>{saveError}</Text>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      ) : null}
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.mobile.border,
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
  saveButton: {
    minWidth: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: sp[2],
  },
  saveText: {
    fontSize: fs.base,
    fontWeight: '600',
    color: colors.brand.DEFAULT,
  },
  saveTextDisabled: {
    color: colors.mobile.textMuted,
  },
  scrollContent: {
    paddingHorizontal: sp[4],
    paddingTop: sp[5],
    paddingBottom: sp[8],
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
    minHeight: 100,
    textAlignVertical: 'top',
  },
  centeredState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: sp[4],
  },
  errorStateText: {
    fontSize: fs.base,
    color: colors.mobile.textMuted,
  },
  retryButton: {
    paddingHorizontal: sp[6],
    paddingVertical: sp[3],
    backgroundColor: colors.brand.DEFAULT,
    borderRadius: rd.md,
  },
  retryText: {
    fontSize: fs.sm,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  saveErrorBanner: {
    backgroundColor: '#450A0A',
    borderRadius: rd.lg,
    padding: sp[4],
    marginTop: sp[2],
  },
  saveErrorText: {
    fontSize: fs.sm,
    color: '#FCA5A5',
    textAlign: 'center',
  },
})
