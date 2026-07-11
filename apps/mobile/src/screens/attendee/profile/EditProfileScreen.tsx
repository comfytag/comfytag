import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { StackScreenProps } from '@react-navigation/stack'
import { ChevronLeft } from 'lucide-react-native'
import { initials } from '@comfytag/utils'
import { colors, sp, rd, fs } from '@comfytag/ui/tokens'
import { AnimatedPressable } from '../../../components/ui/AnimatedPressable'
import { useAuthStore } from '../../../store'
import { useUpdateProfile } from '../../../hooks'
import type { ProfileStackParamList } from '../../../navigation/types'

// ─── Types ───────────────────────────────────────────────────────────────────

type Props = StackScreenProps<ProfileStackParamList, 'EditProfile'>

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function EditProfileScreen({ navigation }: Props): React.ReactElement {
  const storeUser = useAuthStore((state) => state.user)

  const originalName = storeUser?.name ?? ''
  const originalPhone = storeUser?.phone ?? ''

  const [name, setName] = useState<string>(originalName)
  const [phone, setPhone] = useState<string>(originalPhone)
  const [errorMessage, setErrorMessage] = useState<string>('')

  const { mutate: updateProfile, isPending: isSaving } = useUpdateProfile()

  const hasChanges =
    name.trim() !== originalName.trim() || phone.trim() !== originalPhone.trim()
  const saveDisabled = !hasChanges || isSaving

  // ─── Avatar initials ───────────────────────────────────────────────────

  const avatarInitials = initials(name.trim() !== '' ? name : originalName)

  // ─── Change photo placeholder ──────────────────────────────────────────

  const handleChangePhoto = () => {
    Alert.alert('Coming Soon', 'Photo upload coming soon.')
  }

  // ─── Save ──────────────────────────────────────────────────────────────

  const handleSave = (): void => {
    setErrorMessage('')
    updateProfile(
      { name: name.trim(), phone: phone.trim() },
      {
        onSuccess: () => {
          setTimeout(() => navigation.goBack(), 300)
        },
        onError: (err) => {
          setErrorMessage(
            err instanceof Error ? err.message : 'Something went wrong. Please try again.'
          )
        },
      }
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Fixed header */}
      <View style={styles.header}>
        <AnimatedPressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hapticStyle="light"
        >
          <ChevronLeft size={24} color={colors.mobile.textPrimary} strokeWidth={2} />
        </AnimatedPressable>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <AnimatedPressable
          onPress={handleSave}
          style={styles.saveButton}
          hapticStyle="medium"
          disabled={saveDisabled}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={colors.brand.DEFAULT} />
          ) : (
            <Text style={[styles.saveText, saveDisabled && styles.saveTextDisabled]}>
              Save
            </Text>
          )}
        </AnimatedPressable>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitials}>{avatarInitials}</Text>
            </View>
            <AnimatedPressable
              onPress={handleChangePhoto}
              style={styles.changePhotoPressable}
              hapticStyle="light"
            >
              <Text style={styles.changePhotoText}>Change Photo</Text>
            </AnimatedPressable>
          </View>

          {/* Form card */}
          <View style={styles.formCard}>
            {/* Full Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Full Name</Text>
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder="Your full name"
                placeholderTextColor={colors.mobile.textMuted}
                returnKeyType="next"
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>

            <View style={styles.fieldDivider} />

            {/* Phone Number */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Phone Number</Text>
              <TextInput
                style={styles.textInput}
                value={phone}
                onChangeText={setPhone}
                placeholder="+234 000 000 0000"
                placeholderTextColor={colors.mobile.textMuted}
                keyboardType="phone-pad"
                returnKeyType="done"
                autoCorrect={false}
              />
            </View>

            <View style={styles.fieldDivider} />

            {/* Email — disabled */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Email</Text>
              <TextInput
                style={[styles.textInput, styles.textInputDisabled]}
                value={storeUser?.email ?? ''}
                editable={false}
                selectTextOnFocus={false}
              />
              <Text style={styles.fieldNote}>Email cannot be changed</Text>
            </View>
          </View>

          {/* Inline error */}
          {errorMessage !== '' && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Root ─────────────────────────────────────────────────────────────────
  container: {
    flex: 1,
    backgroundColor: colors.mobile.bg,
  },
  keyboardAvoid: {
    flex: 1,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sp[4],
    paddingTop: sp[2],
    paddingBottom: sp[3],
    backgroundColor: colors.mobile.bg,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: fs.base,
    fontWeight: '700',
    color: colors.mobile.textPrimary,
    textAlign: 'center',
  },
  saveButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    fontSize: fs.sm,
    fontWeight: '700',
    color: colors.brand.DEFAULT,
  },
  saveTextDisabled: {
    color: colors.mobile.textMuted,
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
    color: colors.mobile.textPrimary,
    letterSpacing: 1,
  },
  changePhotoPressable: {
    paddingVertical: sp[2],
    paddingHorizontal: sp[4],
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changePhotoText: {
    fontSize: fs.sm,
    fontWeight: '600',
    color: colors.brand.DEFAULT,
  },

  // ── Form card ─────────────────────────────────────────────────────────────
  formCard: {
    backgroundColor: colors.mobile.surface,
    borderRadius: rd.xl,
    paddingHorizontal: sp[4],
    marginBottom: sp[4],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.mobile.border,
  },
  fieldGroup: {
    paddingTop: sp[4],
    paddingBottom: sp[3],
  },
  fieldDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.mobile.border,
  },
  fieldLabel: {
    fontSize: fs.xs,
    fontWeight: '600',
    color: colors.mobile.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: sp[2],
  },
  textInput: {
    fontSize: fs.base,
    color: colors.mobile.textPrimary,
    paddingVertical: sp[2],
    minHeight: 44,
  },
  textInputDisabled: {
    color: colors.mobile.textMuted,
  },
  fieldNote: {
    fontSize: fs.xs,
    color: colors.mobile.textMuted,
    marginTop: 4,
  },

  // ── Error banner ──────────────────────────────────────────────────────────
  errorBanner: {
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderRadius: rd.md,
    padding: sp[4],
    marginBottom: sp[4],
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
  },
  errorBannerText: {
    fontSize: fs.sm,
    color: colors.mobile.error,
    fontWeight: '500',
  },

  // ── Bottom spacer ─────────────────────────────────────────────────────────
  bottomSpacer: {
    height: sp[8],
  },
})
