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
import { ChevronLeft, Tag, Trash2 } from 'lucide-react-native'
import type { PromoCode } from '@comfytag/types'
import { colors, sp, rd, fs } from '@comfytag/ui/tokens'
import { formatNaira } from '@comfytag/utils'
import { AnimatedPressable } from '../../../components/ui/AnimatedPressable'
import { get, post, del } from '../../../lib/api'
import type { OrganizerEventsStackParamList } from '../../../navigation/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = StackScreenProps<OrganizerEventsStackParamList, 'PromoCodes'>

type ScreenState = 'loading' | 'loaded' | 'error'

type DiscountType = 'percentage' | 'fixed'

interface AddPromoForm {
  code: string
  discountType: DiscountType
  discountValue: string
  maxUses: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const EMPTY_ADD_FORM: AddPromoForm = {
  code: '',
  discountType: 'percentage',
  discountValue: '',
  maxUses: '',
}

// ─── SkeletonRow ──────────────────────────────────────────────────────────────

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

  return <Animated.View style={[styles.skeletonCard, { opacity }]} />
}

// ─── DiscountBadge ────────────────────────────────────────────────────────────

interface DiscountBadgeProps {
  discountType: DiscountType
  discountValue: number
}

function DiscountBadge({ discountType, discountValue }: DiscountBadgeProps) {
  const label =
    discountType === 'percentage'
      ? `${discountValue}% OFF`
      : `${formatNaira(discountValue)} OFF`

  return (
    <View style={styles.discountBadge}>
      <Text style={styles.discountBadgeText}>{label}</Text>
    </View>
  )
}

// ─── PromoCard ────────────────────────────────────────────────────────────────

interface PromoCardProps {
  promo: PromoCode
  onDelete: () => void
}

function PromoCard({ promo, onDelete }: PromoCardProps) {
  const canDelete = promo.usedCount === 0
  const usedLabel =
    promo.maxUses != null
      ? `${promo.usedCount}/${promo.maxUses} uses`
      : `${promo.usedCount} uses`

  return (
    <View style={styles.promoCard}>
      <View style={styles.promoCardRow}>
        <View style={styles.promoCardLeft}>
          <Text style={styles.promoCode}>{promo.code}</Text>
          <DiscountBadge discountType={promo.discountType} discountValue={promo.discountValue} />
        </View>
        <AnimatedPressable
          hapticStyle="medium"
          onPress={onDelete}
          style={[
            styles.deleteButton,
            !canDelete && styles.deleteButtonDisabled,
          ]}
          disabled={!canDelete}
        >
          <Trash2
            size={18}
            color={canDelete ? colors.error.DEFAULT : colors.textPublic.muted}
            strokeWidth={2}
          />
        </AnimatedPressable>
      </View>

      <View style={styles.promoMetaRow}>
        <Text style={styles.promoMeta}>{usedLabel}</Text>
        <View
          style={[
            styles.activeBadge,
            promo.isActive ? styles.activeBadgeOn : styles.activeBadgeOff,
          ]}
        >
          <Text
            style={[
              styles.activeBadgeText,
              promo.isActive ? styles.activeBadgeTextOn : styles.activeBadgeTextOff,
            ]}
          >
            {promo.isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>
    </View>
  )
}

// ─── AddPromoForm ─────────────────────────────────────────────────────────────

interface AddPromoFormProps {
  form: AddPromoForm
  onChange: (field: keyof AddPromoForm, value: string) => void
  onDiscountTypeChange: (type: DiscountType) => void
  onSubmit: () => void
  saving: boolean
}

function AddPromoFormPanel({
  form,
  onChange,
  onDiscountTypeChange,
  onSubmit,
  saving,
}: AddPromoFormProps) {
  return (
    <View style={styles.addFormCard}>
      <Text style={styles.addFormTitle}>New Promo Code</Text>

      <TextInput
        style={styles.textInput}
        value={form.code}
        onChangeText={(v) => onChange('code', v)}
        placeholder="Code (e.g. LAUNCH20)"
        placeholderTextColor={colors.textPublic.muted}
        autoCapitalize="characters"
        autoCorrect={false}
      />

      {/* Discount type toggle */}
      <View style={styles.typeToggleRow}>
        <AnimatedPressable
          hapticStyle="light"
          onPress={() => onDiscountTypeChange('percentage')}
          style={[
            styles.typePill,
            form.discountType === 'percentage' && styles.typePillActive,
          ]}
        >
          <Text
            style={[
              styles.typePillText,
              form.discountType === 'percentage' && styles.typePillTextActive,
            ]}
          >
            Percentage
          </Text>
        </AnimatedPressable>
        <AnimatedPressable
          hapticStyle="light"
          onPress={() => onDiscountTypeChange('fixed')}
          style={[
            styles.typePill,
            form.discountType === 'fixed' && styles.typePillActive,
          ]}
        >
          <Text
            style={[
              styles.typePillText,
              form.discountType === 'fixed' && styles.typePillTextActive,
            ]}
          >
            Fixed Amount
          </Text>
        </AnimatedPressable>
      </View>

      <TextInput
        style={styles.textInput}
        value={form.discountValue}
        onChangeText={(v) => onChange('discountValue', v)}
        placeholder={form.discountType === 'percentage' ? 'Discount % (e.g. 20)' : 'Amount in ₦'}
        placeholderTextColor={colors.textPublic.muted}
        keyboardType="decimal-pad"
      />

      <TextInput
        style={styles.textInput}
        value={form.maxUses}
        onChangeText={(v) => onChange('maxUses', v)}
        placeholder="Max uses (leave blank for unlimited)"
        placeholderTextColor={colors.textPublic.muted}
        keyboardType="number-pad"
      />

      <AnimatedPressable
        hapticStyle="medium"
        onPress={onSubmit}
        style={styles.submitButton}
        disabled={saving}
      >
        {saving
          ? <ActivityIndicator size="small" color="#FFF" />
          : <Text style={styles.submitButtonText}>Create Promo Code</Text>
        }
      </AnimatedPressable>
    </View>
  )
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function PromoCodesScreen({ navigation, route }: Props) {
  const { eventId } = route.params
  const [screenState, setScreenState] = useState<ScreenState>('loading')
  const [promos, setPromos] = useState<PromoCode[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [addForm, setAddForm] = useState<AddPromoForm>(EMPTY_ADD_FORM)
  const [saving, setSaving] = useState(false)

  const fetchPromos = useCallback(async () => {
    setScreenState('loading')
    try {
      const { data } = await get<PromoCode[]>(`/events/${eventId}/promos`)
      setPromos(data)
      setScreenState('loaded')
    } catch {
      setScreenState('error')
    }
  }, [eventId])

  useEffect(() => {
    fetchPromos()
  }, [fetchPromos])

  const handleDelete = async (promoId: string) => {
    try {
      await del(`/events/${eventId}/promos/${promoId}`)
      await fetchPromos()
    } catch {
      // silent — item remains visible
    }
  }

  const handleCreate = async () => {
    if (!addForm.code.trim() || !addForm.discountValue) return
    setSaving(true)
    try {
      await post(`/events/${eventId}/promos`, {
        code: addForm.code.trim().toUpperCase(),
        discountType: addForm.discountType,
        discountValue: parseFloat(addForm.discountValue),
        ...(addForm.maxUses ? { maxUses: parseInt(addForm.maxUses, 10) } : {}),
      })
      setShowAddForm(false)
      setAddForm(EMPTY_ADD_FORM)
      await fetchPromos()
    } catch {
      // keep form open on error
    } finally {
      setSaving(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <AnimatedPressable
          hapticStyle="light"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ChevronLeft size={24} color={colors.textPublic.primary} strokeWidth={2} />
        </AnimatedPressable>
        <Text style={styles.headerTitle} numberOfLines={1}>Promo Codes</Text>
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
          <Text style={styles.mutedText}>Failed to load promo codes</Text>
          <AnimatedPressable hapticStyle="medium" onPress={fetchPromos} style={styles.retryButton}>
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
            data={promos}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Tag size={48} color={colors.textPublic.muted} strokeWidth={1.5} />
                <Text style={styles.emptyTitle}>No promo codes yet</Text>
              </View>
            }
            ListFooterComponent={
              <View style={styles.footer}>
                {showAddForm && (
                  <AddPromoFormPanel
                    form={addForm}
                    onChange={(field, value) =>
                      setAddForm((prev) => ({ ...prev, [field]: value }))
                    }
                    onDiscountTypeChange={(type) =>
                      setAddForm((prev) => ({ ...prev, discountType: type }))
                    }
                    onSubmit={handleCreate}
                    saving={saving}
                  />
                )}
                <AnimatedPressable
                  hapticStyle="medium"
                  onPress={() => setShowAddForm((prev) => !prev)}
                  style={[
                    styles.toggleFormButton,
                    showAddForm && styles.toggleFormButtonCancel,
                  ]}
                >
                  <Text
                    style={[
                      styles.toggleFormButtonText,
                      showAddForm && styles.toggleFormButtonTextCancel,
                    ]}
                  >
                    {showAddForm ? 'Cancel' : '+ Add Promo Code'}
                  </Text>
                </AnimatedPressable>
              </View>
            }
            renderItem={({ item }) => (
              <PromoCard
                promo={item}
                onDelete={() => handleDelete(item._id)}
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
    backgroundColor: colors.public.bg,
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
    backgroundColor: colors.public.surface,
  },
  promoCard: {
    backgroundColor: colors.public.surface,
    borderRadius: rd.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.public.border,
    padding: sp[4],
    gap: sp[2],
  },
  promoCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  promoCardLeft: {
    flex: 1,
    gap: sp[2],
  },
  promoCode: {
    fontSize: fs.lg,
    fontWeight: '700',
    color: colors.textPublic.primary,
    letterSpacing: 1,
  },
  discountBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.brand.DEFAULT,
    borderRadius: rd.full,
    paddingHorizontal: sp[3],
    paddingVertical: sp[1],
  },
  discountBadgeText: {
    fontSize: fs.xs,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: rd.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.error.DEFAULT,
    marginLeft: sp[3],
  },
  deleteButtonDisabled: {
    borderColor: colors.public.border,
    opacity: 0.4,
  },
  promoMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  promoMeta: {
    fontSize: fs.xs,
    color: colors.textPublic.muted,
  },
  activeBadge: {
    paddingHorizontal: sp[3],
    paddingVertical: sp[1],
    borderRadius: rd.full,
  },
  activeBadgeOn: {
    backgroundColor: 'rgba(16,185,129,0.15)',
  },
  activeBadgeOff: {
    backgroundColor: colors.public.surfaceAlt,
  },
  activeBadgeText: {
    fontSize: fs.xs,
    fontWeight: '600',
  },
  activeBadgeTextOn: {
    color: colors.success.DEFAULT,
  },
  activeBadgeTextOff: {
    color: colors.textPublic.muted,
  },
  addFormCard: {
    backgroundColor: colors.public.surface,
    borderRadius: rd.lg,
    padding: sp[4],
    gap: sp[3],
    borderWidth: 1,
    borderColor: colors.brand.DEFAULT,
    borderStyle: 'dashed',
  },
  addFormTitle: {
    fontSize: fs.sm,
    fontWeight: '700',
    color: colors.textPublic.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  textInput: {
    height: 44,
    borderRadius: rd.md,
    borderWidth: 1,
    borderColor: colors.public.border,
    paddingHorizontal: sp[3],
    color: colors.textPublic.primary,
    fontSize: fs.sm,
    backgroundColor: colors.public.bg,
  },
  typeToggleRow: {
    flexDirection: 'row',
    gap: sp[2],
  },
  typePill: {
    flex: 1,
    height: 36,
    borderRadius: rd.full,
    borderWidth: 1,
    borderColor: colors.public.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typePillActive: {
    backgroundColor: colors.brand.DEFAULT,
    borderColor: colors.brand.DEFAULT,
  },
  typePillText: {
    fontSize: fs.xs,
    fontWeight: '600',
    color: colors.textPublic.secondary,
  },
  typePillTextActive: {
    color: '#FFFFFF',
  },
  submitButton: {
    height: 48,
    borderRadius: rd.md,
    backgroundColor: colors.brand.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: fs.sm,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  footer: {
    gap: sp[3],
    marginTop: sp[2],
  },
  toggleFormButton: {
    height: 52,
    borderRadius: rd.lg,
    borderWidth: 1,
    borderColor: colors.brand.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleFormButtonCancel: {
    borderColor: colors.public.border,
  },
  toggleFormButtonText: {
    fontSize: fs.base,
    fontWeight: '700',
    color: colors.brand.DEFAULT,
  },
  toggleFormButtonTextCancel: {
    color: colors.textPublic.secondary,
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
    color: colors.textPublic.secondary,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: sp[4],
  },
  mutedText: {
    fontSize: fs.base,
    color: colors.textPublic.muted,
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
