import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ArrowDownToLine, Wallet } from 'lucide-react-native'
import { colors, sp, rd, fs } from '@comfytag/ui/tokens'
import { formatNaira, formatDate } from '@comfytag/utils'
import type { BankAccount, WithdrawRequest } from '@comfytag/types'
import { AnimatedPressable } from '../../../components/ui/AnimatedPressable'
import {
  usePartnerRevenue,
  useWithdrawals,
  useBankAccounts,
  useRequestPayout,
} from '../../../hooks'

// ─── Constants ────────────────────────────────────────────────────────────────

const GOLD = '#D97706'

const STATUS: Record<WithdrawRequest['status'], { color: string; label: string }> = {
  pending:    { color: '#F59E0B',             label: 'Pending'    },
  approved:   { color: colors.success.DEFAULT, label: 'Approved'   },
  processing: { color: colors.success.DEFAULT, label: 'Processing' },
  rejected:   { color: '#EF4444',             label: 'Rejected'   },
  failed:     { color: '#EF4444',             label: 'Failed'     },
  sent:       { color: GOLD,                  label: 'Paid Out'   },
}

// ─── SkeletonPulse ────────────────────────────────────────────────────────────

function SkeletonPulse({ style }: { style: object }) {
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

  return <Animated.View style={[style, { opacity }]} />
}

// ─── WithdrawRow ──────────────────────────────────────────────────────────────

function WithdrawRow({ item }: { item: WithdrawRequest }) {
  const cfg = STATUS[item.status]
  return (
    <View style={styles.withdrawRow}>
      <View style={styles.withdrawRowLeft}>
        <Text style={styles.withdrawEventName} numberOfLines={1}>
          {item.eventName ?? 'Withdrawal'}
        </Text>
        <Text style={styles.withdrawDate}>{formatDate(item.createdAt)}</Text>
      </View>
      <View style={styles.withdrawRowRight}>
        <Text style={styles.withdrawAmount}>{formatNaira(item.amount)}</Text>
        <View style={[styles.statusBadge, { borderColor: cfg.color }]}>
          <Text style={[styles.statusBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>
    </View>
  )
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function PayoutsScreen() {
  // ── Data hooks ──────────────────────────────────────────────────────────────
  const {
    data: revenue,
    isLoading: revenueLoading,
    isFetching: revenueFetching,
    isError: revenueError,
    refetch: refetchRevenue,
  } = usePartnerRevenue()

  const {
    data: withdrawals = [],
    isLoading: withdrawalsLoading,
    isFetching: withdrawalsFetching,
    isError: withdrawalsError,
    refetch: refetchWithdrawals,
  } = useWithdrawals()

  const {
    data: banks = [],
    isLoading: banksLoading,
    isFetching: banksFetching,
    isError: banksError,
    refetch: refetchBanks,
  } = useBankAccounts()

  const { mutate: requestPayout, isPending: submitting } = useRequestPayout()

  // ── Form state ──────────────────────────────────────────────────────────────
  const [showForm, setShowForm] = useState(false)
  const [amount, setAmount] = useState('')
  const [formError, setFormError] = useState('')

  // ── Derived ─────────────────────────────────────────────────────────────────
  const isLoading = revenueLoading || withdrawalsLoading || banksLoading
  const isError   = revenueError   || withdrawalsError   || banksError
  const isFetching = revenueFetching || withdrawalsFetching || banksFetching

  const activeBank: BankAccount | null = useMemo(
    () => banks.find((b) => b.isActive) ?? banks[0] ?? null,
    [banks]
  )

  const sentTotal = useMemo(
    () =>
      withdrawals
        .filter((w) => w.status === 'sent')
        .reduce((sum, w) => sum + w.amount, 0),
    [withdrawals]
  )

  // ── Actions ─────────────────────────────────────────────────────────────────
  const handleWithdraw = useCallback((): void => {
    if (!activeBank) return
    const parsed = parseFloat(amount.replace(/,/g, ''))
    if (isNaN(parsed) || parsed <= 0) {
      setFormError('Enter a valid amount.')
      return
    }
    if (revenue && parsed > revenue.availableBalance) {
      setFormError('Amount exceeds available balance.')
      return
    }
    setFormError('')
    requestPayout(
      { amount: parsed, bankId: activeBank._id },
      {
        onSuccess: () => {
          setAmount('')
          setShowForm(false)
        },
        onError: () => setFormError('Submission failed. Try again.'),
      }
    )
  }, [activeBank, amount, revenue, requestPayout])

  const closeForm = useCallback((): void => {
    setShowForm(false)
    setFormError('')
    setAmount('')
  }, [])

  const handleRefresh = useCallback((): void => {
    void refetchRevenue()
    void refetchWithdrawals()
    void refetchBanks()
  }, [refetchRevenue, refetchWithdrawals, refetchBanks])

  // ─── Loading ─────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Payouts</Text>
        </View>
        <SkeletonPulse style={styles.skeletonCard} />
        <View style={styles.skeletonSection}>
          <SkeletonPulse style={styles.skeletonRow} />
          <SkeletonPulse style={styles.skeletonRow} />
          <SkeletonPulse style={styles.skeletonRow} />
        </View>
      </SafeAreaView>
    )
  }

  // ─── Error ───────────────────────────────────────────────────────────────────

  if (isError) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Payouts</Text>
        </View>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Failed to load payouts</Text>
          <AnimatedPressable
            style={styles.retryBtn}
            onPress={handleRefresh}
            hapticStyle="medium"
          >
            <Text style={styles.retryBtnText}>Try Again</Text>
          </AnimatedPressable>
        </View>
      </SafeAreaView>
    )
  }

  // ─── Loaded ───────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isLoading}
              onRefresh={handleRefresh}
              tintColor={colors.brand.DEFAULT}
              colors={[colors.brand.DEFAULT]}
            />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Payouts</Text>
            <Text style={styles.headerSubtitle}>Manage your earnings</Text>
          </View>

          {/* Balance card */}
          <View style={styles.balanceCard}>
            <View style={styles.balanceLabelRow}>
              <Wallet size={16} color={GOLD} strokeWidth={2} />
              <Text style={styles.balanceLabelText}>Available Balance</Text>
            </View>
            <Text style={styles.balanceAmount}>
              {formatNaira(revenue?.availableBalance ?? 0)}
            </Text>

            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: GOLD }]}>
                  {formatNaira(revenue?.totalRevenue ?? 0)}
                </Text>
                <Text style={styles.statLabel}>Total Earned</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: '#F59E0B' }]}>
                  {formatNaira(revenue?.pendingWithdrawals ?? 0)}
                </Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: colors.textPublic.muted }]}>
                  {formatNaira(sentTotal)}
                </Text>
                <Text style={styles.statLabel}>Paid Out</Text>
              </View>
            </View>

            {!showForm && (
              <AnimatedPressable
                style={styles.withdrawBtn}
                onPress={() => setShowForm(true)}
                hapticStyle="medium"
              >
                <ArrowDownToLine size={16} color="#FFFFFF" strokeWidth={2} />
                <Text style={styles.withdrawBtnText}>Request Withdrawal</Text>
              </AnimatedPressable>
            )}
          </View>

          {/* Withdrawal form */}
          {showForm && (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>New Withdrawal Request</Text>

              {activeBank ? (
                <View style={styles.bankChip}>
                  <Text style={styles.bankChipText}>
                    {activeBank.bankName}  ·  {activeBank.acctNumber}
                  </Text>
                </View>
              ) : (
                <Text style={styles.noBankText}>
                  No bank account linked. Go to Account → Bank Account first.
                </Text>
              )}

              <TextInput
                style={styles.formInput}
                value={amount}
                onChangeText={(v) => { setAmount(v); setFormError('') }}
                placeholder="Amount (₦)"
                placeholderTextColor={colors.textPublic.muted}
                keyboardType="decimal-pad"
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
                  style={[
                    styles.submitBtn,
                    (submitting || !activeBank) && { opacity: 0.5 },
                  ]}
                  onPress={handleWithdraw}
                  hapticStyle="medium"
                  disabled={submitting || !activeBank}
                >
                  <Text style={styles.submitBtnText}>
                    {submitting ? 'Submitting…' : 'Submit Request'}
                  </Text>
                </AnimatedPressable>
              </View>
            </View>
          )}

          {/* History */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Withdrawal History</Text>

            {withdrawals.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No withdrawals yet</Text>
                <Text style={styles.emptySubText}>
                  Request a withdrawal once your balance is available.
                </Text>
              </View>
            ) : (
              <View style={styles.historyList}>
                {withdrawals.map((item, i) => (
                  <React.Fragment key={item._id}>
                    <WithdrawRow item={item} />
                    {i < withdrawals.length - 1 && (
                      <View style={styles.rowDivider} />
                    )}
                  </React.Fragment>
                ))}
              </View>
            )}
          </View>
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

  // Header
  header: {
    paddingHorizontal: sp[5],
    paddingTop: sp[4],
    paddingBottom: sp[3],
  },
  headerTitle: {
    fontSize: fs.xl,
    fontWeight: '700',
    color: colors.textPublic.primary,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: fs.sm,
    color: colors.textPublic.muted,
    marginTop: sp[1],
  },

  // Scroll
  scrollContent: {
    paddingBottom: sp[10],
  },

  // Balance card
  balanceCard: {
    marginHorizontal: sp[5],
    marginBottom: sp[4],
    backgroundColor: colors.public.surface,
    borderRadius: rd.xl,
    borderWidth: 1,
    borderColor: colors.public.border,
    padding: sp[5],
  },
  balanceLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp[2],
    marginBottom: sp[2],
  },
  balanceLabelText: {
    fontSize: fs.sm,
    color: colors.textPublic.muted,
  },
  balanceAmount: {
    fontSize: 34,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: -0.5,
    marginBottom: sp[4],
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: sp[4],
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: fs.sm,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: fs.xs,
    color: colors.textPublic.muted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.public.border,
  },
  withdrawBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sp[2],
    backgroundColor: colors.brand.DEFAULT,
    borderRadius: rd.lg,
    paddingVertical: sp[3],
  },
  withdrawBtnText: {
    fontSize: fs.sm,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Withdrawal form
  formCard: {
    marginHorizontal: sp[5],
    marginBottom: sp[4],
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
    marginBottom: sp[3],
  },
  bankChip: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(124,58,237,0.12)',
    borderRadius: rd.full,
    paddingHorizontal: sp[3],
    paddingVertical: sp[1],
    marginBottom: sp[3],
  },
  bankChipText: {
    fontSize: fs.xs,
    fontWeight: '600',
    color: colors.brand.DEFAULT,
  },
  noBankText: {
    fontSize: fs.sm,
    color: '#F59E0B',
    marginBottom: sp[3],
    lineHeight: 18,
  },
  formInput: {
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
  submitBtn: {
    flex: 1,
    backgroundColor: colors.brand.DEFAULT,
    borderRadius: rd.lg,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    fontSize: fs.sm,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // History
  section: {
    marginTop: sp[2],
  },
  sectionTitle: {
    fontSize: fs.sm,
    fontWeight: '700',
    color: colors.textPublic.secondary,
    paddingHorizontal: sp[5],
    marginBottom: sp[3],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  historyList: {
    marginHorizontal: sp[5],
    backgroundColor: colors.public.surface,
    borderRadius: rd.xl,
    borderWidth: 1,
    borderColor: colors.public.border,
    overflow: 'hidden',
  },
  withdrawRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sp[4],
    paddingVertical: sp[3],
  },
  withdrawRowLeft: {
    flex: 1,
    marginRight: sp[3],
  },
  withdrawEventName: {
    fontSize: fs.sm,
    fontWeight: '600',
    color: colors.textPublic.primary,
  },
  withdrawDate: {
    fontSize: fs.xs,
    color: colors.textPublic.muted,
    marginTop: 2,
  },
  withdrawRowRight: {
    alignItems: 'flex-end',
    gap: sp[1],
  },
  withdrawAmount: {
    fontSize: fs.sm,
    fontWeight: '700',
    color: GOLD,
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: rd.full,
    paddingHorizontal: sp[2],
    paddingVertical: 2,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.public.border,
    marginHorizontal: sp[4],
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: sp[8],
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

  // Skeleton
  skeletonCard: {
    height: 220,
    marginHorizontal: sp[5],
    marginBottom: sp[4],
    backgroundColor: colors.public.surface,
    borderRadius: rd.xl,
  },
  skeletonSection: {
    paddingHorizontal: sp[5],
    gap: sp[2],
  },
  skeletonRow: {
    height: 56,
    backgroundColor: colors.public.surface,
    borderRadius: rd.lg,
  },

  // Error state
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
