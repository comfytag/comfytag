import React, { useState } from 'react'
import {
  View,
  Text,
  FlatList,
  StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'
import { Search, LogIn, Ticket } from 'lucide-react-native'
import { colors, sp, rd, fs } from '@comfytag/ui/tokens'
import { useEvents } from '../../hooks/useEvents'
import { EventCard, EventCardSkeleton } from '../../components/ui'
import { Sheet } from '../../components/ui/Sheet'
import { Button } from '../../components/ui/Button'
import { AnimatedPressable } from '../../components/ui/AnimatedPressable'
import type { GuestStackParamList } from '../../navigation/types'
import type { Event } from '@comfytag/types'

// ─── Types ─────────────────────────────────────────────────────────────────────

type GuestBrowseNavProp = StackNavigationProp<GuestStackParamList, 'GuestBrowse'>

// ─── Header ───────────────────────────────────────────────────────────────────

interface HeaderProps {
  onSearchPress: () => void
}

function BrowseHeader({ onSearchPress }: HeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text style={styles.wordmark}>ComfyTag</Text>
        <View style={styles.dot} />
      </View>
      <Text style={styles.headerSub}>Discover events near you</Text>

      <AnimatedPressable
        style={styles.searchBar}
        onPress={onSearchPress}
        hapticStyle="light"
      >
        <Search size={16} color={colors.mobile.textMuted} strokeWidth={2} />
        <Text style={styles.searchPlaceholder}>
          Search events, artists, venues…
        </Text>
      </AnimatedPressable>
    </View>
  )
}

// ─── Auth gate sheet content ───────────────────────────────────────────────────

interface AuthGateProps {
  onSignIn: () => void
  onRegister: () => void
}

function AuthGateContent({ onSignIn, onRegister }: AuthGateProps) {
  return (
    <View style={styles.gateBody}>
      <View style={styles.gateIconCircle}>
        <Ticket size={28} color={colors.brand.DEFAULT} strokeWidth={2} />
      </View>
      <Text style={styles.gateTitle}>Sign in to continue</Text>
      <Text style={styles.gateText}>
        Create an account to view event details, buy tickets, and check in with
        your face.
      </Text>
      <Button
        label="Sign In"
        variant="primary"
        onPress={onSignIn}
        fullWidth
        style={styles.gateBtn}
      />
      <Button
        label="Create Account"
        variant="ghost"
        onPress={onRegister}
        fullWidth
      />
    </View>
  )
}

// ─── Skeleton grid ─────────────────────────────────────────────────────────────

function SkeletonGrid() {
  return (
    <View style={styles.skeletonGrid}>
      {Array(6)
        .fill(null)
        .map((_, i) => (
          <View key={i} style={styles.gridItem}>
            <EventCardSkeleton variant="grid" />
          </View>
        ))}
    </View>
  )
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function GuestBrowseScreen() {
  const navigation = useNavigation<GuestBrowseNavProp>()
  const [authGateOpen, setAuthGateOpen] = useState(false)

  const { data, isLoading, isError, refetch } = useEvents({ limit: 20 })
  const events: Event[] = data?.data ?? []

  const openGate = () => setAuthGateOpen(true)

  const handleSignIn = () => {
    setAuthGateOpen(false)
    navigation.navigate('Login')
  }

  const handleRegister = () => {
    setAuthGateOpen(false)
    navigation.navigate('Register')
  }

  // ── Loading ──────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <BrowseHeader onSearchPress={openGate} />
        <SkeletonGrid />
        <FloatingBar onPress={() => navigation.navigate('Login')} />
      </SafeAreaView>
    )
  }

  // ── Error ────────────────────────────────────────────────────────────────────

  if (isError) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <BrowseHeader onSearchPress={openGate} />
        <View style={styles.center}>
          <Text style={styles.errorText}>Couldn't load events</Text>
          <AnimatedPressable onPress={() => void refetch()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Try again</Text>
          </AnimatedPressable>
        </View>
        <FloatingBar onPress={() => navigation.navigate('Login')} />
      </SafeAreaView>
    )
  }

  // ── Success ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={events}
        keyExtractor={(item) => item._id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={<BrowseHeader onSearchPress={openGate} />}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>No events yet. Check back soon!</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.gridItem}>
            <EventCard event={item} variant="grid" onPress={openGate} />
          </View>
        )}
      />

      <FloatingBar onPress={() => navigation.navigate('Login')} />

      <Sheet
        visible={authGateOpen}
        onClose={() => setAuthGateOpen(false)}
        snapHeight="sm"
      >
        <AuthGateContent onSignIn={handleSignIn} onRegister={handleRegister} />
      </Sheet>
    </SafeAreaView>
  )
}

// ─── Floating bar ─────────────────────────────────────────────────────────────

function FloatingBar({ onPress }: { onPress: () => void }) {
  return (
    <View style={styles.floatingBar}>
      <AnimatedPressable
        style={styles.floatingButton}
        onPress={onPress}
        hapticStyle="medium"
      >
        <LogIn size={18} color={colors.mobile.btnPrimaryText} strokeWidth={2} />
        <Text style={styles.floatingButtonText}>Sign in to buy tickets</Text>
      </AnimatedPressable>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.mobile.bg,
  },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    paddingHorizontal: sp[6],
    paddingTop: sp[4],
    paddingBottom: sp[5],
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: sp[1],
  },
  wordmark: {
    fontSize: fs['2xl'],
    fontWeight: '800',
    color: colors.mobile.textPrimary,
    marginRight: sp[1],
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: rd.full,
    backgroundColor: colors.brand.DEFAULT,
    marginTop: 2,
  },
  headerSub: {
    fontSize: fs.sm,
    color: colors.mobile.textSecondary,
    marginBottom: sp[4],
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp[3],
    backgroundColor: colors.mobile.surface,
    borderWidth: 1,
    borderColor: colors.mobile.border,
    borderRadius: rd.full,
    paddingHorizontal: sp[4],
    paddingVertical: sp[3],
  },
  searchPlaceholder: {
    fontSize: fs.sm,
    color: colors.mobile.textMuted,
  },

  // ── List ────────────────────────────────────────────────────────────────────
  listContent: {
    paddingBottom: 100,
  },
  row: {
    paddingHorizontal: sp[6],
    gap: sp[3],
    marginBottom: sp[3],
  },
  gridItem: {
    flex: 1,
  },

  // ── Skeleton ─────────────────────────────────────────────────────────────────
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: sp[6],
    gap: sp[3],
  },

  // ── States ──────────────────────────────────────────────────────────────────
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: sp[6],
    paddingVertical: sp[10],
  },
  errorText: {
    fontSize: fs.base,
    color: colors.mobile.textSecondary,
    marginBottom: sp[4],
  },
  retryBtn: {
    paddingHorizontal: sp[5],
    paddingVertical: sp[2],
  },
  retryText: {
    fontSize: fs.sm,
    color: colors.brand.DEFAULT,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: fs.base,
    color: colors.mobile.textMuted,
    textAlign: 'center',
  },

  // ── Floating bar ─────────────────────────────────────────────────────────────
  floatingBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: sp[6],
    paddingBottom: sp[8],
    paddingTop: sp[3],
    backgroundColor: colors.mobile.bg,
    borderTopWidth: 1,
    borderTopColor: colors.mobile.border,
  },
  floatingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sp[2],
    backgroundColor: colors.mobile.btnPrimaryBg,
    paddingVertical: sp[3],
    borderRadius: rd.full,
  },
  floatingButtonText: {
    color: colors.mobile.btnPrimaryText,
    fontWeight: '700',
    fontSize: fs.base,
  },

  // ── Auth gate sheet ──────────────────────────────────────────────────────────
  gateBody: {
    paddingHorizontal: sp[2],
    alignItems: 'center',
  },
  gateIconCircle: {
    width: 56,
    height: 56,
    borderRadius: rd.full,
    backgroundColor: colors.brand.light,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: sp[4],
  },
  gateTitle: {
    fontSize: fs.xl,
    fontWeight: '700',
    color: colors.mobile.textPrimary,
    marginBottom: sp[2],
    textAlign: 'center',
  },
  gateText: {
    fontSize: fs.sm,
    color: colors.mobile.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: sp[6],
    paddingHorizontal: sp[2],
  },
  gateBtn: {
    marginBottom: sp[3],
  },
})
