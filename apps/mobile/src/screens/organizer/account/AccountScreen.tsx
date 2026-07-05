import React, { useCallback } from 'react'
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { StackScreenProps } from '@react-navigation/stack'
import { ChevronRight, Landmark, ShieldCheck, LogOut, RefreshCw } from 'lucide-react-native'
import { colors, sp, rd, fs } from '@comfytag/ui/tokens'
import { initials } from '@comfytag/utils'
import { AnimatedPressable } from '../../../components/ui/AnimatedPressable'
import { useAuthStore } from '../../../store'
import { useModeStore } from '../../../store/modeStore'
import type { OrganizerAccountStackParamList } from '../../../navigation/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = StackScreenProps<OrganizerAccountStackParamList, 'AccountHome'>

// ─── SettingsRow ──────────────────────────────────────────────────────────────

interface SettingsRowProps {
  icon: React.ReactElement
  label: string
  badge?: string
  badgeColor?: string
  onPress: () => void
  destructive?: boolean
}

function SettingsRow({
  icon,
  label,
  badge,
  badgeColor,
  onPress,
  destructive = false,
}: SettingsRowProps) {
  return (
    <AnimatedPressable style={styles.row} onPress={onPress} hapticStyle="light">
      <View style={styles.rowIconWrap}>{icon}</View>
      <Text style={[styles.rowLabel, destructive && styles.rowLabelDestructive]}>
        {label}
      </Text>
      {badge ? (
        <View style={[styles.rowBadge, { borderColor: badgeColor ?? colors.mobile.textMuted }]}>
          <Text style={[styles.rowBadgeText, { color: badgeColor ?? colors.mobile.textMuted }]}>
            {badge}
          </Text>
        </View>
      ) : null}
      <ChevronRight
        size={18}
        color={destructive ? '#EF4444' : colors.mobile.textMuted}
        strokeWidth={2}
      />
    </AnimatedPressable>
  )
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AccountScreen({ navigation }: Props) {
  const user     = useAuthStore((s) => s.user)
  const logout   = useAuthStore((s) => s.logout)
  const setMode  = useModeStore((s) => s.setMode)

  const kycVerified = user?.isVerify?.idCard === true

  const handleLogout = useCallback(() => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => {
            logout()
          },
        },
      ]
    )
  }, [logout])

  const handleSwitchMode = useCallback(() => {
    Alert.alert(
      'Switch to Attendee Mode',
      "You'll be taken to the attendee view.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Switch',
          onPress: () => setMode('attendee'),
        },
      ]
    )
  }, [setMode])

  const abbr = initials(user?.name ?? '')

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Account</Text>
        </View>

        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{abbr}</Text>
          </View>
          <Text style={styles.profileName}>{user?.name ?? '—'}</Text>
          <Text style={styles.profileEmail}>{user?.email ?? '—'}</Text>
        </View>

        {/* Settings */}
        <View style={styles.sectionLabel}>
          <Text style={styles.sectionLabelText}>Settings</Text>
        </View>
        <View style={styles.card}>
          <SettingsRow
            icon={<Landmark size={18} color={colors.brand.DEFAULT} strokeWidth={2} />}
            label="Bank Account"
            onPress={() => navigation.navigate('Bank')}
          />
          <View style={styles.divider} />
          <SettingsRow
            icon={<ShieldCheck size={18} color={kycVerified ? colors.mobile.success : '#F59E0B'} strokeWidth={2} />}
            label="KYC Verification"
            badge={kycVerified ? 'Verified' : 'Pending'}
            badgeColor={kycVerified ? colors.mobile.success : '#F59E0B'}
            onPress={() => navigation.navigate('Kyc')}
          />
        </View>

        {/* Mode & Auth */}
        <View style={styles.sectionLabel}>
          <Text style={styles.sectionLabelText}>App</Text>
        </View>
        <View style={styles.card}>
          <SettingsRow
            icon={<RefreshCw size={18} color={colors.mobile.textSecondary} strokeWidth={2} />}
            label="Switch to Attendee Mode"
            onPress={handleSwitchMode}
          />
          <View style={styles.divider} />
          <SettingsRow
            icon={<LogOut size={18} color="#EF4444" strokeWidth={2} />}
            label="Log Out"
            onPress={handleLogout}
            destructive
          />
        </View>
      </ScrollView>
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
    paddingHorizontal: sp[5],
    paddingTop: sp[4],
    paddingBottom: sp[2],
  },
  headerTitle: {
    fontSize: fs.xl,
    fontWeight: '700',
    color: colors.mobile.textPrimary,
    letterSpacing: -0.3,
  },

  // Profile card
  profileCard: {
    marginHorizontal: sp[5],
    marginVertical: sp[4],
    backgroundColor: colors.mobile.surface,
    borderRadius: rd.xl,
    borderWidth: 1,
    borderColor: colors.mobile.border,
    paddingVertical: sp[5],
    alignItems: 'center',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.brand.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: sp[3],
  },
  avatarText: {
    fontSize: fs.xl,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  profileName: {
    fontSize: fs.base,
    fontWeight: '700',
    color: colors.mobile.textPrimary,
  },
  profileEmail: {
    fontSize: fs.sm,
    color: colors.mobile.textMuted,
    marginTop: sp[1],
  },

  // Section label
  sectionLabel: {
    paddingHorizontal: sp[5],
    marginBottom: sp[2],
  },
  sectionLabelText: {
    fontSize: fs.xs,
    fontWeight: '700',
    color: colors.mobile.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // Card
  card: {
    marginHorizontal: sp[5],
    marginBottom: sp[4],
    backgroundColor: colors.mobile.surface,
    borderRadius: rd.xl,
    borderWidth: 1,
    borderColor: colors.mobile.border,
    overflow: 'hidden',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.mobile.border,
    marginLeft: sp[4] + 18 + sp[3],
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sp[4],
    paddingVertical: sp[4],
    minHeight: 52,
  },
  rowIconWrap: {
    width: 18,
    marginRight: sp[3],
    alignItems: 'center',
  },
  rowLabel: {
    flex: 1,
    fontSize: fs.sm,
    fontWeight: '500',
    color: colors.mobile.textPrimary,
  },
  rowLabelDestructive: {
    color: '#EF4444',
  },
  rowBadge: {
    borderWidth: 1,
    borderRadius: rd.full,
    paddingHorizontal: sp[2],
    paddingVertical: 2,
    marginRight: sp[2],
  },
  rowBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
})
