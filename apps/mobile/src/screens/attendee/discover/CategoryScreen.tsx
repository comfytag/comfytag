import React from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { StackScreenProps } from '@react-navigation/stack'
import { ChevronLeft } from 'lucide-react-native'
import { colors, sp, rd, fs } from '@comfytag/ui/tokens'
import { useEvents } from '../../../hooks'
import { EventCard, EventCardSkeleton } from '../../../components/ui/EventCard'
import { AnimatedPressable } from '../../../components/ui/AnimatedPressable'
import type { DiscoverStackParamList } from '../../../navigation/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = StackScreenProps<DiscoverStackParamList, 'Category'>

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractFirstColor(gradient?: string): string {
  if (gradient === undefined || gradient.length === 0) return colors.brand.DEFAULT
  const match = gradient.match(/#[0-9a-fA-F]{6}/)
  return match !== null ? match[0] : colors.brand.DEFAULT
}

// ─── Header ───────────────────────────────────────────────────────────────────

interface HeaderProps {
  name: string
  headerColor: string
  onBack: () => void
}

function Header({ name, headerColor, onBack }: HeaderProps) {
  return (
    <View style={[styles.header, { backgroundColor: headerColor }]}>
      <View style={styles.headerOverlay} />
      <View style={styles.headerContent}>
        <AnimatedPressable
          onPress={onBack}
          hapticStyle="light"
          style={styles.backButton}
        >
          <ChevronLeft size={20} color="#FFFFFF" />
        </AnimatedPressable>
        <Text style={styles.categoryName}>{name}</Text>
      </View>
    </View>
  )
}

// ─── CategoryScreen ───────────────────────────────────────────────────────────

const SCREEN_WIDTH = Dimensions.get('window').width

export default function CategoryScreen({ route, navigation }: Props) {
  const { slug, name, gradient } = route.params
  const headerColor = extractFirstColor(gradient)
  const cardWidth = (SCREEN_WIDTH - sp[4] * 2 - sp[3]) / 2

  const { data, isLoading, isError, refetch } = useEvents({
    category: slug,
    limit: 30,
  })

  const events = data?.data ?? []

  // ── Error ────────────────────────────────────────────────────────────────────

  if (isError) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header name={name} headerColor={headerColor} onBack={() => navigation.goBack()} />
        <View style={styles.centeredState}>
          <Text style={styles.stateTitle}>Couldn't load events</Text>
          <AnimatedPressable onPress={() => void refetch()} hapticStyle="light">
            <Text style={styles.retryText}>Tap to retry</Text>
          </AnimatedPressable>
        </View>
      </SafeAreaView>
    )
  }

  // ── Success ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header name={name} headerColor={headerColor} onBack={() => navigation.goBack()} />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {isLoading ? (
          <View style={styles.grid}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <View key={i} style={{ width: cardWidth }}>
                <EventCardSkeleton variant="grid" />
              </View>
            ))}
          </View>
        ) : events.length === 0 ? (
          <View style={styles.centeredState}>
            <Text style={styles.stateTitle}>No events in this category yet</Text>
            <Text style={styles.stateSubtitle}>Check back soon</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {events.map((event) => (
              <View key={event._id} style={{ width: cardWidth }}>
                <EventCard
                  event={event}
                  variant="grid"
                  onPress={() =>
                    navigation.navigate('EventDetail', { slug: event.slug })
                  }
                />
              </View>
            ))}
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.public.bg,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    height: 120,
    overflow: 'hidden',
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  headerContent: {
    flex: 1,
    padding: sp[4],
    justifyContent: 'flex-end',
  },
  backButton: {
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  categoryName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: sp[2],
  },

  // ── Scroll ────────────────────────────────────────────────────────────────
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: sp[4],
    paddingBottom: sp[4],
  },

  // ── Grid ──────────────────────────────────────────────────────────────────
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: sp[4],
    gap: sp[3],
  },

  // ── States ────────────────────────────────────────────────────────────────
  centeredState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: sp[8],
    paddingTop: sp[12],
  },
  stateTitle: {
    fontSize: fs.base,
    fontWeight: '700',
    color: colors.textPublic.primary,
    textAlign: 'center',
    marginBottom: sp[2],
  },
  stateSubtitle: {
    fontSize: fs.sm,
    color: colors.textPublic.secondary,
    textAlign: 'center',
  },
  retryText: {
    fontSize: fs.sm,
    color: colors.brand.DEFAULT,
    fontWeight: '600',
  },

  bottomSpacer: {
    height: sp[8],
  },
})
