import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  Alert,
  Animated,
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
import { ChevronLeft, Plus, Trash2, BadgeCheck } from 'lucide-react-native'
import { colors, sp, rd, fs } from '@comfytag/ui/tokens'
import type { BankAccount } from '@comfytag/types'
import { AnimatedPressable } from '../../../components/ui/AnimatedPressable'
import {
  useBankAccounts,
  useAddBankAccount,
  useDeleteBankAccount,
} from '../../../hooks'
import type { OrganizerAccountStackParamList } from '../../../navigation/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = StackScreenProps<OrganizerAccountStackParamList, 'Bank'>

// ─── SkeletonRow ──────────────────────────────────────────────────────────────

function SkeletonRow() {
  const opacity = useRef(new Animated.Value(0.4)).current

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    )
    anim.start()
    return () => anim.stop()
  }, [opacity])

  return <Animated.View style={[styles.skeletonRow, { opacity }]} />
}

// ─── BankRow ──────────────────────────────────────────────────────────────────

interface BankRowProps {
  bank: BankAccount
  onDelete: (id: string) => void
}

function BankRow({ bank, onDelete }: BankRowProps) {
  return (
    <View style={styles.bankRow}>
      <View style={styles.bankRowInfo}>
        <View style={styles.bankRowHeader}>
          <Text style={styles.bankName}>{bank.bankName}</Text>
          {bank.isActive && (
            <View style={styles.activeBadge}>
              <BadgeCheck size={12} color={colors.success.DEFAULT} strokeWidth={2} />
              <Text style={styles.activeBadgeText}>Active</Text>
            </View>
          )}
        </View>
        <Text style={styles.bankAcctName}>{bank.acctName}</Text>
        <Text style={styles.bankAcctNumber}>{bank.acctNumber}</Text>
      </View>
      <AnimatedPressable
        style={styles.deleteBtn}
        onPress={() => onDelete(bank._id)}
        hapticStyle="medium"
      >
        <Trash2 size={16} color="#EF4444" strokeWidth={2} />
      </AnimatedPressable>
    </View>
  )
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function BankScreen({ navigation }: Props) {
  const {
    data: banks = [],
    isLoading,
    isError,
    refetch,
  } = useBankAccounts()

  const { mutate: addBank, isPending: saving } = useAddBankAccount()
  const { mutate: deleteBank } = useDeleteBankAccount()

  const [showForm, setShowForm] = useState(false)
  const [bankName, setBankName] = useState('')
  const [acctNumber, setAcctNumber] = useState('')
  const [acctName, setAcctName] = useState('')
  const [formError, setFormError] = useState('')

  const handleAdd = useCallback((): void => {
    if (!bankName.trim())           { setFormError('Bank name is required.'); return }
    if (acctNumber.trim().length < 10) { setFormError('Enter a valid account number.'); return }
    if (!acctName.trim())           { setFormError('Account name is required.'); return }

    setFormError('')
    addBank(
      {
        bankName: bankName.trim(),
        acctNumber: acctNumber.trim(),
        acctName: acctName.trim(),
      },
      {
        onSuccess: () => {
          setBankName('')
          setAcctNumber('')
          setAcctName('')
          setShowForm(false)
        },
        onError: () => setFormError('Failed to add account. Try again.'),
      }
    )
  }, [addBank, bankName, acctNumber, acctName])

  const handleDelete = useCallback(
    (bankId: string) => {
      Alert.alert(
        'Remove Bank Account',
        'Are you sure you want to remove this account?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => {
              deleteBank(
                { bankId },
                {
                  onError: () =>
                    Alert.alert('Error', 'Could not remove account. Try again.'),
                }
              )
            },
          },
        ]
      )
    },
    [deleteBank]
  )

  const closeForm = useCallback((): void => {
    setShowForm(false)
    setFormError('')
    setBankName('')
    setAcctNumber('')
    setAcctName('')
  }, [])

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
        <Text style={styles.headerTitle}>Bank Account</Text>
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
          {isLoading ? (
            <View style={styles.skeletonContainer}>
              <SkeletonRow />
              <SkeletonRow />
            </View>
          ) : isError ? (
            <View style={styles.centered}>
              <Text style={styles.errorText}>Failed to load bank accounts</Text>
              <AnimatedPressable
                style={styles.retryBtn}
                onPress={() => void refetch()}
                hapticStyle="medium"
              >
                <Text style={styles.retryBtnText}>Try Again</Text>
              </AnimatedPressable>
            </View>
          ) : (
            <>
              {/* Bank list */}
              {banks.length === 0 && !showForm ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No bank accounts yet</Text>
                  <Text style={styles.emptySubText}>
                    Add a bank account to receive withdrawals.
                  </Text>
                </View>
              ) : (
                <View style={styles.list}>
                  {banks.map((bank, i) => (
                    <React.Fragment key={bank._id}>
                      <BankRow bank={bank} onDelete={handleDelete} />
                      {i < banks.length - 1 && <View style={styles.rowDivider} />}
                    </React.Fragment>
                  ))}
                </View>
              )}

              {/* Add bank form */}
              {showForm ? (
                <View style={styles.formCard}>
                  <Text style={styles.formTitle}>Add Bank Account</Text>
                  <TextInput
                    style={styles.input}
                    value={bankName}
                    onChangeText={(v) => { setBankName(v); setFormError('') }}
                    placeholder="Bank name (e.g. First Bank)"
                    placeholderTextColor={colors.textPublic.muted}
                    autoCapitalize="words"
                  />
                  <TextInput
                    style={styles.input}
                    value={acctNumber}
                    onChangeText={(v) => { setAcctNumber(v); setFormError('') }}
                    placeholder="Account number"
                    placeholderTextColor={colors.textPublic.muted}
                    keyboardType="number-pad"
                    maxLength={10}
                  />
                  <TextInput
                    style={styles.input}
                    value={acctName}
                    onChangeText={(v) => { setAcctName(v); setFormError('') }}
                    placeholder="Account name"
                    placeholderTextColor={colors.textPublic.muted}
                    autoCapitalize="words"
                  />
                  {formError ? <Text style={styles.formError}>{formError}</Text> : null}
                  <View style={styles.formActions}>
                    <AnimatedPressable
                      style={styles.cancelBtn}
                      onPress={closeForm}
                      hapticStyle="light"
                    >
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </AnimatedPressable>
                    <AnimatedPressable
                      style={[styles.saveBtn, saving && { opacity: 0.5 }]}
                      onPress={handleAdd}
                      hapticStyle="medium"
                      disabled={saving}
                    >
                      <Text style={styles.saveBtnText}>
                        {saving ? 'Saving…' : 'Save Account'}
                      </Text>
                    </AnimatedPressable>
                  </View>
                </View>
              ) : (
                <AnimatedPressable
                  style={styles.addBtn}
                  onPress={() => setShowForm(true)}
                  hapticStyle="medium"
                >
                  <Plus size={16} color={colors.brand.DEFAULT} strokeWidth={2} />
                  <Text style={styles.addBtnText}>Add Bank Account</Text>
                </AnimatedPressable>
              )}
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

  // Bank list
  list: {
    marginHorizontal: sp[5],
    backgroundColor: colors.public.surface,
    borderRadius: rd.xl,
    borderWidth: 1,
    borderColor: colors.public.border,
    overflow: 'hidden',
    marginBottom: sp[4],
  },
  bankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sp[4],
    paddingVertical: sp[3],
  },
  bankRowInfo: {
    flex: 1,
  },
  bankRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp[2],
    marginBottom: 2,
  },
  bankName: {
    fontSize: fs.sm,
    fontWeight: '700',
    color: colors.textPublic.primary,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(16,185,129,0.12)',
    borderRadius: rd.full,
    paddingHorizontal: sp[2],
    paddingVertical: 2,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.success.DEFAULT,
  },
  bankAcctName: {
    fontSize: fs.sm,
    color: colors.textPublic.secondary,
    marginTop: 2,
  },
  bankAcctNumber: {
    fontSize: fs.xs,
    color: colors.textPublic.muted,
    marginTop: 2,
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: rd.md,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: sp[3],
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.public.border,
    marginHorizontal: sp[4],
  },

  // Add button
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sp[2],
    marginHorizontal: sp[5],
    marginTop: sp[2],
    borderWidth: 1,
    borderColor: colors.brand.DEFAULT,
    borderStyle: 'dashed',
    borderRadius: rd.lg,
    paddingVertical: sp[3],
  },
  addBtnText: {
    fontSize: fs.sm,
    fontWeight: '600',
    color: colors.brand.DEFAULT,
  },

  // Form
  formCard: {
    marginHorizontal: sp[5],
    backgroundColor: colors.public.surface,
    borderRadius: rd.xl,
    borderWidth: 1,
    borderColor: colors.public.border,
    padding: sp[5],
    marginBottom: sp[4],
  },
  formTitle: {
    fontSize: fs.base,
    fontWeight: '700',
    color: colors.textPublic.primary,
    marginBottom: sp[4],
  },
  input: {
    backgroundColor: colors.public.bg,
    borderWidth: 1,
    borderColor: colors.public.border,
    borderRadius: rd.lg,
    height: 48,
    paddingHorizontal: sp[4],
    fontSize: fs.sm,
    color: colors.textPublic.primary,
    marginBottom: sp[3],
  },
  formError: {
    fontSize: fs.xs,
    color: '#EF4444',
    marginBottom: sp[2],
  },
  formActions: {
    flexDirection: 'row',
    gap: sp[3],
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.public.border,
    borderRadius: rd.lg,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: fs.sm,
    fontWeight: '600',
    color: colors.textPublic.secondary,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: colors.brand.DEFAULT,
    borderRadius: rd.lg,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: fs.sm,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Skeleton
  skeletonContainer: {
    paddingHorizontal: sp[5],
    paddingTop: sp[2],
    gap: sp[3],
  },
  skeletonRow: {
    height: 80,
    backgroundColor: colors.public.surface,
    borderRadius: rd.lg,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: sp[10],
    paddingHorizontal: sp[6],
  },
  emptyText: {
    fontSize: fs.base,
    fontWeight: '600',
    color: colors.textPublic.secondary,
  },
  emptySubText: {
    fontSize: fs.sm,
    color: colors.textPublic.muted,
    textAlign: 'center',
    marginTop: sp[2],
    lineHeight: 20,
  },

  // Error
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: sp[12],
    gap: sp[4],
  },
  errorText: {
    fontSize: fs.base,
    color: colors.textPublic.muted,
  },
  retryBtn: {
    paddingHorizontal: sp[6],
    paddingVertical: sp[3],
    backgroundColor: colors.brand.DEFAULT,
    borderRadius: rd.md,
  },
  retryBtnText: {
    fontSize: fs.sm,
    fontWeight: '600',
    color: '#FFFFFF',
  },
})
