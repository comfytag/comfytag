import React from 'react'
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { StackScreenProps } from '@react-navigation/stack'
import { Pencil, ChevronRight } from 'lucide-react-native'
import { formatDate, initials } from '@comfytag/utils'
import { colors, sp, rd, fs } from '@comfytag/ui/tokens'
import { AnimatedPressable } from '../../../components/ui/AnimatedPressable'
import { useAuthStore, useModeStore } from '../../../store'
import { useMyProfile, useFollowing } from '../../../hooks'
import { FEATURES } from '../../../lib/features'
import type { ProfileStackParamList } from '../../../navigation/types'

// ─── Types ───────────────────────────────────────────────────────────────────

type Props = StackScreenProps<ProfileStackParamList, 'ProfileMain'>

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function ProfileScreen({ navigation }: Props): React.ReactElement {
  const logout = useAuthStore((state) => state.logout)
  const storeUser = useAuthStore((state) => state.user)
  const setMode = useModeStore((state) => state.setMode)

  const { data: profile, isLoading, isError, refetch } = useMyProfile()
  const { data: following } = useFollowing()

  const followingCount = following?.length ?? 0
  const isPartner = storeUser?.isPartner ?? false

  // ─── Logout ──────────────────────────────────────────────────────────────

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: () => logout() },
      ],
    )
  }

  // ─── Loading ─────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color={colors.brand.DEFAULT} />
        </View>
      </SafeAreaView>
    )
  }

  // ─── Error ───────────────────────────────────────────────────────────────

  if (isError || profile === undefined) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centeredContainer}>
          <Text style={styles.errorText}>Couldn't load profile</Text>
          <AnimatedPressable onPress={() => void refetch()} style={styles.retryPressable}>
            <Text style={styles.retryText}>Tap to retry</Text>
          </AnimatedPressable>
        </View>
      </SafeAreaView>
    )
  }

  // ─── Loaded ──────────────────────────────────────────────────────────────

  const userInitials = initials(profile.name)

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={styles.headerTitle}>Profile</Text>
        <AnimatedPressable
          onPress={() => navigation.navigate('EditProfile')}
          style={styles.editButton}
          hapticStyle="light"
        >
          <Pencil size={20} color={colors.brand.DEFAULT} strokeWidth={2} />
        </AnimatedPressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitials}>{userInitials}</Text>
          </View>
          <Text style={styles.displayName}>{profile.name}</Text>
          <Text style={styles.displayEmail}>{profile.email}</Text>
        </View>

        {/* Stats card */}
        <View style={[styles.card, styles.statsCard]}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Events Attended</Text>
          </View>
          <View style={styles.statDivider} />
          <AnimatedPressable
            style={styles.statItem}
            onPress={() => navigation.navigate('Following')}
            hapticStyle="light"
          >
            <Text style={styles.statNumber}>{followingCount}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </AnimatedPressable>
        </View>

        {/* Info card */}
        <View style={[styles.card, styles.infoCard]}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>
              {profile.phone !== undefined && profile.phone !== '' ? profile.phone : 'Not added'}
            </Text>
          </View>
          <View style={[styles.infoRow, styles.infoRowMiddle]}>
            <Text style={styles.infoLabel}>Member since</Text>
            <Text style={styles.infoValue}>{formatDate(profile.createdAt)}</Text>
          </View>
          <View
            style={[
              styles.infoRow,
              styles.infoRowMiddle,
              !FEATURES.faceVerification && styles.infoRowLast,
            ]}
          >
            <Text style={styles.infoLabel}>Account type</Text>
            <Text style={styles.infoValue}>{isPartner ? 'Organizer' : 'Attendee'}</Text>
          </View>
          {FEATURES.faceVerification && (
            <AnimatedPressable
              style={[styles.infoRow, styles.infoRowLast]}
              onPress={() => navigation.navigate('FaceEnrollmentStatus')}
              hapticStyle="light"
            >
              <Text style={styles.infoLabel}>Face Entry</Text>
              <View style={styles.infoRowRight}>
                <Text style={styles.infoValueBrand}>Manage</Text>
                <ChevronRight size={14} color={colors.brand.DEFAULT} strokeWidth={2} />
              </View>
            </AnimatedPressable>
          )}
        </View>

        {/* Mode switch card */}
        {isPartner ? (
          <View style={[styles.card, styles.modeCard]}>
            <AnimatedPressable
              onPress={() => setMode('organizer')}
              style={styles.modeSwitchRow}
              hapticStyle="medium"
            >
              <Text style={styles.modeSwitchText}>Switch Mode</Text>
              <ChevronRight size={18} color={colors.brand.DEFAULT} strokeWidth={2} />
            </AnimatedPressable>
          </View>
        ) : (
          <View style={[styles.card, styles.modeCard]}>
            <AnimatedPressable
              onPress={() =>
                Alert.alert(
                  'Become an Organizer',
                  'Create and manage events on ComfyTag. Contact support to upgrade your account.'
                )
              }
              style={styles.modeSwitchRow}
              hapticStyle="light"
            >
              <Text style={styles.modeUpgradeText}>Become an Organizer</Text>
              <ChevronRight size={18} color={colors.textPublic.muted} strokeWidth={2} />
            </AnimatedPressable>
          </View>
        )}

        {/* Logout card */}
        <View style={[styles.card, styles.dangerCard]}>
          <AnimatedPressable
            onPress={handleLogout}
            style={styles.logoutRow}
            hapticStyle="medium"
          >
            <Text style={styles.logoutText}>Log Out</Text>
            <ChevronRight size={18} color={colors.error.DEFAULT} strokeWidth={2} />
          </AnimatedPressable>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.public.bg,
  },

  // ── Loading / error ───────────────────────────────────────────────────────
  centeredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: sp[4],
  },
  errorText: {
    fontSize: fs.base,
    fontWeight: '600',
    color: colors.textPublic.primary,
    textAlign: 'center',
  },
  retryPressable: {
    paddingHorizontal: sp[6],
    paddingVertical: sp[3],
  },
  retryText: {
    fontSize: fs.sm,
    fontWeight: '600',
    color: colors.brand.DEFAULT,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sp[4],
    paddingTop: sp[2],
    paddingBottom: sp[3],
    backgroundColor: colors.public.bg,
  },
  headerSpacer: {
    width: 44,
  },
  headerTitle: {
    flex: 1,
    fontSize: fs.base,
    fontWeight: '700',
    color: colors.textPublic.primary,
    textAlign: 'center',
  },
  editButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Scroll ────────────────────────────────────────────────────────────────
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: sp[4],
    paddingTop: sp[4],
  },

  // ── Avatar section ────────────────────────────────────────────────────────
  avatarSection: {
    alignItems: 'center',
    marginBottom: sp[6],
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: rd.full,
    backgroundColor: colors.brand.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: sp[3],
  },
  avatarInitials: {
    fontSize: fs['2xl'],
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  displayName: {
    fontSize: fs.xl,
    fontWeight: '700',
    color: colors.textPublic.primary,
    marginBottom: 4,
  },
  displayEmail: {
    fontSize: fs.sm,
    color: colors.textPublic.muted,
  },

  // ── Shared card ───────────────────────────────────────────────────────────
  card: {
    backgroundColor: colors.public.surface,
    borderRadius: rd.xl,
    marginBottom: sp[4],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.public.border,
  },

  // ── Stats card ────────────────────────────────────────────────────────────
  statsCard: {
    flexDirection: 'row',
    padding: sp[5],
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: fs['2xl'],
    fontWeight: '700',
    color: colors.brand.DEFAULT,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: fs.xs,
    color: colors.textPublic.muted,
    textAlign: 'center',
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.public.border,
    marginVertical: sp[1],
  },

  // ── Info card ─────────────────────────────────────────────────────────────
  infoCard: {
    paddingHorizontal: sp[4],
    paddingVertical: 0,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: sp[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.public.border,
  },
  infoRowMiddle: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.public.border,
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    fontSize: fs.sm,
    color: colors.textPublic.muted,
  },
  infoValue: {
    fontSize: fs.sm,
    fontWeight: '500',
    color: colors.textPublic.primary,
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: sp[3],
  },
  infoRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoValueBrand: {
    fontSize: fs.sm,
    fontWeight: '500',
    color: colors.brand.DEFAULT,
  },

  // ── Mode card ─────────────────────────────────────────────────────────────
  modeCard: {
    paddingHorizontal: sp[4],
    paddingVertical: 0,
  },
  modeSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: sp[4],
    minHeight: 44,
  },
  modeSwitchText: {
    fontSize: fs.base,
    fontWeight: '600',
    color: colors.brand.DEFAULT,
  },
  modeUpgradeText: {
    fontSize: fs.base,
    fontWeight: '600',
    color: colors.textPublic.secondary,
  },

  // ── Danger zone card ──────────────────────────────────────────────────────
  dangerCard: {
    paddingHorizontal: sp[4],
    paddingVertical: 0,
  },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: sp[4],
    minHeight: 44,
  },
  logoutText: {
    fontSize: fs.base,
    fontWeight: '600',
    color: colors.error.DEFAULT,
  },

  // ── Bottom spacer ─────────────────────────────────────────────────────────
  bottomSpacer: {
    height: sp[8],
  },
})
