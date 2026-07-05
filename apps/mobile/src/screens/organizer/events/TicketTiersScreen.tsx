import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { StackScreenProps } from '@react-navigation/stack'
import { ChevronLeft, CalendarX } from 'lucide-react-native'
import type { Event, TicketTier } from '@comfytag/types'
import { colors, sp, rd, fs } from '@comfytag/ui/tokens'
import { formatNaira } from '@comfytag/utils'
import { AnimatedPressable } from '../../../components/ui/AnimatedPressable'
import { get, put, del } from '../../../lib/api'
import type { OrganizerEventsStackParamList } from '../../../navigation/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = StackScreenProps<OrganizerEventsStackParamList, 'TicketTiers'>

type ScreenState = 'loading' | 'loaded' | 'error'

interface EditForm {
  name: string
  price: string
  capacity: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_TIERS = 5

const cardShadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  android: { elevation: 4 },
})

// ─── SkeletonCard ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  const opacity = useRef(new Animated.Value(0.4)).current

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.9, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    )
    anim.start()
    return () => anim.stop()
  }, [opacity])

  return (
    <Animated.View style={[styles.skeletonCard, { opacity }]} />
  )
}

// ─── ProgressBar ──────────────────────────────────────────────────────────────

interface ProgressBarProps {
  sold: number
  capacity: number
}

function ProgressBar({ sold, capacity }: ProgressBarProps) {
  if (capacity <= 0) return null
  const pct = Math.min((sold / capacity) * 100, 100)
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${pct}%` }]} />
    </View>
  )
}

// ─── TierEditForm ─────────────────────────────────────────────────────────────

interface TierEditFormProps {
  form: EditForm
  onChange: (field: keyof EditForm, value: string) => void
  onSave: () => void
  onCancel: () => void
  saving: boolean
}

function TierEditForm({ form, onChange, onSave, onCancel, saving }: TierEditFormProps) {
  return (
    <View style={styles.inlineForm}>
      <TextInput
        style={styles.textInput}
        value={form.name}
        onChangeText={(v) => onChange('name', v)}
        placeholder="Tier name"
        placeholderTextColor={colors.mobile.textMuted}
        autoCapitalize="words"
      />
      <TextInput
        style={styles.textInput}
        value={form.price}
        onChangeText={(v) => onChange('price', v)}
        placeholder="Price (₦)"
        placeholderTextColor={colors.mobile.textMuted}
        keyboardType="decimal-pad"
      />
      <TextInput
        style={styles.textInput}
        value={form.capacity}
        onChangeText={(v) => onChange('capacity', v)}
        placeholder="Capacity"
        placeholderTextColor={colors.mobile.textMuted}
        keyboardType="number-pad"
      />
      <View style={styles.formActions}>
        <AnimatedPressable hapticStyle="medium" onPress={onSave} style={styles.saveButton} disabled={saving}>
          {saving
            ? <ActivityIndicator size="small" color="#FFF" />
            : <Text style={styles.saveButtonText}>Save</Text>
          }
        </AnimatedPressable>
        <AnimatedPressable hapticStyle="light" onPress={onCancel} style={styles.cancelButton}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </AnimatedPressable>
      </View>
    </View>
  )
}

// ─── TierCard ─────────────────────────────────────────────────────────────────

interface TierCardProps {
  tier: TicketTier
  isEditing: boolean
  editForm: EditForm
  saving: boolean
  onEdit: () => void
  onDelete: () => void
  onFormChange: (field: keyof EditForm, value: string) => void
  onSave: () => void
  onCancelEdit: () => void
}

function TierCard({
  tier,
  isEditing,
  editForm,
  saving,
  onEdit,
  onDelete,
  onFormChange,
  onSave,
  onCancelEdit,
}: TierCardProps) {
  const canDelete = tier.sold === 0

  return (
    <View style={[styles.tierCard, cardShadow]}>
      <View style={styles.tierHeader}>
        <Text style={styles.tierName}>{tier.name}</Text>
        <Text style={styles.tierPrice}>{formatNaira(tier.price)}</Text>
      </View>

      <Text style={styles.tierCapacityText}>
        {tier.sold} sold / {tier.capacity} capacity
      </Text>

      <ProgressBar sold={tier.sold} capacity={tier.capacity} />

      {isEditing ? (
        <TierEditForm
          form={editForm}
          onChange={onFormChange}
          onSave={onSave}
          onCancel={onCancelEdit}
          saving={saving}
        />
      ) : (
        <View style={styles.tierActions}>
          <AnimatedPressable hapticStyle="light" onPress={onEdit} style={styles.actionPill}>
            <Text style={styles.actionPillText}>Edit</Text>
          </AnimatedPressable>
          <AnimatedPressable
            hapticStyle="medium"
            onPress={onDelete}
            style={[styles.actionPill, styles.actionPillDanger, !canDelete && styles.actionPillDisabled]}
            disabled={!canDelete}
          >
            <Text style={[styles.actionPillText, styles.actionPillTextDanger, !canDelete && styles.actionPillTextDisabled]}>
              Delete
            </Text>
          </AnimatedPressable>
        </View>
      )}
    </View>
  )
}

// ─── AddTierForm ──────────────────────────────────────────────────────────────

interface AddTierFormProps {
  form: EditForm
  onChange: (field: keyof EditForm, value: string) => void
  onAdd: () => void
  onCancel: () => void
  saving: boolean
}

function AddTierForm({ form, onChange, onAdd, onCancel, saving }: AddTierFormProps) {
  return (
    <View style={[styles.tierCard, cardShadow, styles.addFormCard]}>
      <Text style={styles.addFormTitle}>New Tier</Text>
      <TierEditForm
        form={form}
        onChange={onChange}
        onSave={onAdd}
        onCancel={onCancel}
        saving={saving}
      />
    </View>
  )
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function TicketTiersScreen({ navigation, route }: Props) {
  const { eventId, eventName } = route.params
  const [screenState, setScreenState] = useState<ScreenState>('loading')
  const [tiers, setTiers] = useState<TicketTier[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<EditForm>({ name: '', price: '', capacity: '' })
  const [showAddForm, setShowAddForm] = useState(false)
  const [addForm, setAddForm] = useState<EditForm>({ name: '', price: '', capacity: '' })
  const [saving, setSaving] = useState(false)

  const fetchTiers = useCallback(async () => {
    setScreenState('loading')
    try {
      const { data } = await get<Event>(`/events/${eventId}`)
      setTiers(data.ticketType ?? [])
      setScreenState('loaded')
    } catch {
      setScreenState('error')
    }
  }, [eventId])

  useEffect(() => {
    fetchTiers()
  }, [fetchTiers])

  const openEdit = (tier: TicketTier) => {
    setEditingId(tier._id)
    setEditForm({
      name: tier.name,
      price: String(tier.price),
      capacity: String(tier.capacity),
    })
    setShowAddForm(false)
  }

  const handleSaveEdit = async () => {
    if (!editingId) return
    setSaving(true)
    try {
      await put(`/events/${eventId}/tiers/${editingId}`, {
        name: editForm.name.trim(),
        price: parseFloat(editForm.price),
        capacity: parseInt(editForm.capacity, 10),
      })
      setEditingId(null)
      await fetchTiers()
    } catch {
      // keep form open on error
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (tierId: string) => {
    try {
      await del(`/events/${eventId}/tiers/${tierId}`)
      await fetchTiers()
    } catch {
      // silent — tier will remain visible
    }
  }

  const handleAddTier = async () => {
    setSaving(true)
    try {
      const existingPayload = tiers.map((t) => ({
        name: t.name,
        price: t.price,
        capacity: t.capacity,
      }))
      const newTier = {
        name: addForm.name.trim(),
        price: parseFloat(addForm.price),
        capacity: parseInt(addForm.capacity, 10),
      }
      await put<Event>(`/events/${eventId}`, {
        ticketType: [...existingPayload, newTier],
      })
      setShowAddForm(false)
      setAddForm({ name: '', price: '', capacity: '' })
      await fetchTiers()
    } catch {
      // keep form open on error
    } finally {
      setSaving(false)
    }
  }

  const canAddMore = tiers.length < MAX_TIERS

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <AnimatedPressable
          hapticStyle="light"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ChevronLeft size={24} color={colors.mobile.textPrimary} strokeWidth={2} />
        </AnimatedPressable>
        <Text style={styles.headerTitle} numberOfLines={1}>Ticket Tiers</Text>
        <View style={styles.headerSpacer} />
      </View>

      {screenState === 'loading' ? (
        <View style={styles.skeletonContainer}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : screenState === 'error' ? (
        <View style={styles.centered}>
          <Text style={styles.mutedText}>Failed to load tiers</Text>
          <AnimatedPressable hapticStyle="medium" onPress={fetchTiers} style={styles.retryButton}>
            <Text style={styles.retryText}>Try Again</Text>
          </AnimatedPressable>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={90}
        >
          <FlatList
            data={tiers}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <CalendarX size={48} color={colors.mobile.textMuted} strokeWidth={1.5} />
                <Text style={styles.emptyTitle}>No ticket tiers yet</Text>
                <Text style={styles.emptySubtitle}>
                  Add a tier to start selling tickets for {eventName}
                </Text>
              </View>
            }
            ListFooterComponent={
              <View style={styles.footer}>
                {showAddForm && (
                  <AddTierForm
                    form={addForm}
                    onChange={(field, value) => setAddForm((prev) => ({ ...prev, [field]: value }))}
                    onAdd={handleAddTier}
                    onCancel={() => {
                      setShowAddForm(false)
                      setAddForm({ name: '', price: '', capacity: '' })
                    }}
                    saving={saving}
                  />
                )}
                {canAddMore && !showAddForm && (
                  <AnimatedPressable
                    hapticStyle="medium"
                    onPress={() => {
                      setShowAddForm(true)
                      setEditingId(null)
                    }}
                    style={styles.addButton}
                  >
                    <Text style={styles.addButtonText}>+ Add Tier</Text>
                  </AnimatedPressable>
                )}
              </View>
            }
            renderItem={({ item }) => (
              <TierCard
                tier={item}
                isEditing={editingId === item._id}
                editForm={editForm}
                saving={saving}
                onEdit={() => openEdit(item)}
                onDelete={() => handleDelete(item._id)}
                onFormChange={(field, value) => setEditForm((prev) => ({ ...prev, [field]: value }))}
                onSave={handleSaveEdit}
                onCancelEdit={() => setEditingId(null)}
              />
            )}
          />
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.mobile.bg,
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
    paddingHorizontal: sp[2],
  },
  headerSpacer: {
    width: 44,
  },
  listContent: {
    paddingHorizontal: sp[4],
    paddingBottom: sp[8],
    gap: sp[3],
  },
  skeletonContainer: {
    paddingHorizontal: sp[4],
    paddingTop: sp[4],
    gap: sp[3],
  },
  skeletonCard: {
    height: 80,
    borderRadius: rd.lg,
    backgroundColor: colors.mobile.surface,
  },
  tierCard: {
    backgroundColor: colors.mobile.surface,
    borderRadius: rd.lg,
    padding: sp[4],
    gap: sp[3],
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tierName: {
    fontSize: fs.base,
    fontWeight: '700',
    color: colors.mobile.textPrimary,
    flex: 1,
  },
  tierPrice: {
    fontSize: fs.base,
    fontWeight: '700',
    color: colors.brand.DEFAULT,
  },
  tierCapacityText: {
    fontSize: fs.xs,
    color: colors.mobile.textMuted,
  },
  progressTrack: {
    height: 4,
    borderRadius: rd.full,
    backgroundColor: colors.mobile.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: rd.full,
    backgroundColor: colors.brand.DEFAULT,
  },
  tierActions: {
    flexDirection: 'row',
    gap: sp[2],
  },
  actionPill: {
    height: 32,
    paddingHorizontal: sp[4],
    borderRadius: rd.full,
    borderWidth: 1,
    borderColor: colors.mobile.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionPillText: {
    fontSize: fs.xs,
    fontWeight: '600',
    color: colors.mobile.textPrimary,
  },
  actionPillDanger: {
    borderColor: colors.error.DEFAULT,
  },
  actionPillTextDanger: {
    color: colors.error.DEFAULT,
  },
  actionPillDisabled: {
    borderColor: colors.mobile.border,
    opacity: 0.4,
  },
  actionPillTextDisabled: {
    color: colors.mobile.textMuted,
  },
  inlineForm: {
    gap: sp[3],
  },
  textInput: {
    height: 44,
    borderRadius: rd.md,
    borderWidth: 1,
    borderColor: colors.mobile.border,
    paddingHorizontal: sp[3],
    color: colors.mobile.textPrimary,
    fontSize: fs.sm,
    backgroundColor: colors.mobile.bg,
  },
  formActions: {
    flexDirection: 'row',
    gap: sp[2],
    alignItems: 'center',
  },
  saveButton: {
    flex: 1,
    height: 44,
    borderRadius: rd.md,
    backgroundColor: colors.brand.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: fs.sm,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cancelButton: {
    height: 44,
    paddingHorizontal: sp[4],
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: fs.sm,
    color: colors.mobile.textSecondary,
  },
  addFormCard: {
    borderWidth: 1,
    borderColor: colors.brand.DEFAULT,
    borderStyle: 'dashed',
  },
  addFormTitle: {
    fontSize: fs.sm,
    fontWeight: '700',
    color: colors.mobile.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  footer: {
    gap: sp[3],
    marginTop: sp[2],
  },
  addButton: {
    height: 52,
    borderRadius: rd.lg,
    borderWidth: 1,
    borderColor: colors.brand.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: fs.base,
    fontWeight: '700',
    color: colors.brand.DEFAULT,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: sp[8],
    paddingBottom: sp[6],
    gap: sp[3],
  },
  emptyTitle: {
    fontSize: fs.base,
    fontWeight: '700',
    color: colors.mobile.textSecondary,
  },
  emptySubtitle: {
    fontSize: fs.sm,
    color: colors.mobile.textMuted,
    textAlign: 'center',
    paddingHorizontal: sp[4],
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: sp[4],
  },
  mutedText: {
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
})
