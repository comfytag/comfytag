import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  FlatList,
  StyleSheet,
  Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import { Search, Bell } from 'lucide-react-native'
import { colors, sp, rd, fs } from '@comfytag/ui/tokens'
import { useEvents, useCategories } from '../../../hooks'
import { EventCard, EventCardSkeleton } from '../../../components/ui/EventCard'
import { AnimatedPressable } from '../../../components/ui/AnimatedPressable'
import type { Event, Category } from '@comfytag/types'
import type { DiscoverStackParamList, AttendeeTabParamList } from '../../../navigation/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type Nav = StackNavigationProp<DiscoverStackParamList, 'HomeMain'>
type TabNav = BottomTabNavigationProp<AttendeeTabParamList>

interface DateGroup {
  label: string
  events: Event[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function groupByDate(events: Event[]): DateGroup[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)

  const map = new Map<string, Event[]>()

  for (const e of events) {
    const d = new Date(e.date)
    d.setHours(0, 0, 0, 0)
    let label: string
    if (d.getTime() === today.getTime()) {
      label = 'Today'
    } else if (d.getTime() === tomorrow.getTime()) {
      label = 'Tomorrow'
    } else {
      label = d.toLocaleDateString('en-NG', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
      })
    }
    if (!map.has(label)) map.set(label, [])
    map.get(label)!.push(e)
  }

  return Array.from(map.entries()).map(([label, evts]) => ({
    label,
    events: evts,
  }))
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

interface TopNavProps {
  onSearchPress: () => void
  onBellPress: () => void
}

function TopNav({ onSearchPress, onBellPress }: TopNavProps) {
  return (
    <View style={styles.topNav}>
      <Text style={styles.topNavTitle}>ComfyTag</Text>
      <View style={styles.topNavActions}>
        <AnimatedPressable
          onPress={onSearchPress}
          hapticStyle="light"
          style={styles.iconBtn}
        >
          <Search size={22} color={colors.mobile.textSecondary} />
        </AnimatedPressable>
        <AnimatedPressable
          onPress={onBellPress}
          hapticStyle="light"
          style={styles.iconBtn}
        >
          <Bell size={22} color={colors.mobile.textSecondary} />
        </AnimatedPressable>
      </View>
    </View>
  )
}

function HeroBanner() {
  return (
    <View style={styles.heroBanner}>
      <View style={styles.heroOverlay} />
      <View style={styles.heroContent}>
        <Text style={styles.heroHeadline}>Don't hear about it, be there.</Text>
        <Text style={styles.heroSubtitle}>Find your next vibe in Lagos</Text>
      </View>
    </View>
  )
}

interface CategoryPillsProps {
  categories: Category[]
  selected: string
  onSelect: (slug: string) => void
  onCategoryNavigate: (cat: Category) => void
}

function CategoryPillsRow({
  categories,
  selected,
  onSelect,
  onCategoryNavigate,
}: CategoryPillsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.pillsScroll}
      contentContainerStyle={styles.pillsContent}
    >
      <AnimatedPressable
        onPress={() => onSelect('all')}
        hapticStyle="light"
        style={[
          styles.pill,
          selected === 'all' ? styles.pillActive : styles.pillInactive,
        ]}
      >
        <Text
          style={[
            styles.pillText,
            selected === 'all' ? styles.pillTextActive : styles.pillTextInactive,
          ]}
        >
          All
        </Text>
      </AnimatedPressable>

      {categories.map((cat) => {
        const slug = cat.slug ?? cat._id
        const isActive = selected === slug
        return (
          <AnimatedPressable
            key={cat._id}
            onPress={() => {
              if (!isActive) onSelect(slug)
              onCategoryNavigate(cat)
            }}
            hapticStyle="light"
            style={[
              styles.pill,
              isActive ? styles.pillActive : styles.pillInactive,
            ]}
          >
            <Text
              style={[
                styles.pillText,
                isActive ? styles.pillTextActive : styles.pillTextInactive,
              ]}
            >
              {cat.title}
            </Text>
          </AnimatedPressable>
        )
      })}
    </ScrollView>
  )
}

interface TrendingSectionProps {
  events: Event[]
  isLoading: boolean
  onEventPress: (event: Event) => void
}

function TrendingSection({ events, isLoading, onEventPress }: TrendingSectionProps) {
  const featured = events.filter((e) => e.featured).slice(0, 10)
  const display = featured.length > 0 ? featured : events.slice(0, 10)

  return (
    <View style={styles.trendingSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Trending</Text>
      </View>

      {isLoading ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.trendingListContent}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <EventCardSkeleton key={i} variant="trending" />
          ))}
        </ScrollView>
      ) : (
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={display}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.trendingListContent}
          renderItem={({ item }) => (
            <EventCard
              event={item}
              variant="trending"
              onPress={() => onEventPress(item)}
            />
          )}
        />
      )}
    </View>
  )
}

interface FeedSectionProps {
  groups: DateGroup[]
  isLoading: boolean
  onEventPress: (event: Event) => void
}

const SCREEN_WIDTH = Dimensions.get('window').width

function FeedSection({ groups, isLoading, onEventPress }: FeedSectionProps) {
  const cardWidth = (SCREEN_WIDTH - sp[4] * 2 - sp[3]) / 2

  if (isLoading) {
    return (
      <View style={styles.feedSection}>
        <View style={styles.groupHeader}>
          <Text style={styles.groupLabel}>Upcoming</Text>
        </View>
        <View style={styles.gridRow}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={{ width: cardWidth }}>
              <EventCardSkeleton variant="grid" />
            </View>
          ))}
        </View>
      </View>
    )
  }

  if (groups.length === 0) {
    return (
      <View style={styles.emptyFeed}>
        <Text style={styles.emptyTitle}>No events near you yet</Text>
        <Text style={styles.emptySubtitle}>Check back soon</Text>
      </View>
    )
  }

  return (
    <>
      {groups.map((group) => (
        <View key={group.label} style={styles.feedSection}>
          <View style={styles.groupHeader}>
            <Text style={styles.groupLabel}>{group.label}</Text>
          </View>
          <View style={styles.gridRow}>
            {group.events.map((event) => (
              <View key={event._id} style={{ width: cardWidth }}>
                <EventCard
                  event={event}
                  variant="grid"
                  onPress={() => onEventPress(event)}
                />
              </View>
            ))}
          </View>
        </View>
      ))}
    </>
  )
}

// ─── HomeScreen ───────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const navigation = useNavigation<Nav>()
  const tabNavigation = useNavigation<TabNav>()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const { data: eventsData, isLoading, isError, refetch } = useEvents({ limit: 30 })
  const { data: categories } = useCategories()

  const events = eventsData?.data ?? []
  const cats: Category[] = categories ?? []

  const filteredEvents =
    selectedCategory === 'all'
      ? events
      : events.filter((e) => e.category === selectedCategory)

  const dateGroups = groupByDate(filteredEvents)

  const handleCategoryNavigate = (cat: Category) => {
    navigation.navigate('Category', {
      slug: cat.slug ?? cat._id,
      name: cat.title,
      gradient: cat.gradient,
    })
  }

  const handleEventPress = (event: Event) => {
    navigation.navigate('EventDetail', { slug: event.slug })
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Couldn't load events</Text>
          <AnimatedPressable onPress={() => void refetch()} hapticStyle="light">
            <Text style={styles.retryText}>Tap to retry</Text>
          </AnimatedPressable>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <TopNav
        onSearchPress={() => tabNavigation.navigate('Search')}
        onBellPress={() => tabNavigation.navigate('Inbox')}
      />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <HeroBanner />

        <CategoryPillsRow
          categories={isLoading ? [] : cats}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
          onCategoryNavigate={handleCategoryNavigate}
        />

        <TrendingSection
          events={events}
          isLoading={isLoading}
          onEventPress={handleEventPress}
        />

        <FeedSection
          groups={isLoading ? [] : dateGroups}
          isLoading={isLoading}
          onEventPress={handleEventPress}
        />

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.mobile.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: sp[4],
  },

  // ── TopNav ────────────────────────────────────────────────────────────────
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sp[4],
    paddingVertical: sp[3],
  },
  topNavTitle: {
    fontSize: fs.lg,
    fontWeight: '800',
    color: colors.brand.DEFAULT,
  },
  topNavActions: {
    flexDirection: 'row',
    gap: sp[4],
  },
  iconBtn: {
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Hero Banner ───────────────────────────────────────────────────────────
  heroBanner: {
    marginHorizontal: sp[4],
    marginTop: sp[4],
    borderRadius: rd.xl,
    overflow: 'hidden',
    backgroundColor: colors.brand.DEFAULT,
    height: 180,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  heroContent: {
    flex: 1,
    padding: sp[5],
    justifyContent: 'flex-end',
  },
  heroHeadline: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.mobile.textPrimary,
    lineHeight: 28,
  },
  heroSubtitle: {
    fontSize: fs.sm,
    color: 'rgba(255,255,255,0.7)',
    marginTop: sp[1],
  },

  // ── Category Pills ────────────────────────────────────────────────────────
  pillsScroll: {
    marginTop: sp[4],
  },
  pillsContent: {
    paddingHorizontal: sp[4],
    paddingVertical: sp[4],
    gap: sp[2],
  },
  pill: {
    paddingHorizontal: sp[4],
    paddingVertical: sp[2],
    borderRadius: rd.full,
    minHeight: 44,
    justifyContent: 'center',
  },
  pillActive: {
    backgroundColor: colors.brand.DEFAULT,
  },
  pillInactive: {
    backgroundColor: colors.mobile.surface,
    borderWidth: 1,
    borderColor: colors.mobile.border,
  },
  pillText: {
    fontSize: fs.sm,
    fontWeight: '600',
  },
  pillTextActive: {
    color: colors.mobile.textPrimary,
  },
  pillTextInactive: {
    color: colors.mobile.textSecondary,
  },

  // ── Trending Section ──────────────────────────────────────────────────────
  trendingSection: {
    marginTop: sp[6],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sp[4],
    marginBottom: sp[3],
  },
  sectionTitle: {
    fontSize: fs.base,
    fontWeight: '700',
    color: colors.mobile.textPrimary,
  },
  trendingListContent: {
    paddingHorizontal: sp[4],
    gap: sp[3],
  },

  // ── Feed Section ──────────────────────────────────────────────────────────
  feedSection: {
    marginTop: sp[6],
  },
  groupHeader: {
    paddingHorizontal: sp[4],
    marginBottom: sp[3],
  },
  groupLabel: {
    fontSize: fs.sm,
    fontWeight: '700',
    color: colors.mobile.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: sp[4],
    gap: sp[3],
  },

  // ── Empty / Error ─────────────────────────────────────────────────────────
  emptyFeed: {
    marginTop: sp[12],
    alignItems: 'center',
    paddingHorizontal: sp[8],
  },
  emptyTitle: {
    fontSize: fs.base,
    fontWeight: '700',
    color: colors.mobile.textPrimary,
    textAlign: 'center',
    marginBottom: sp[2],
  },
  emptySubtitle: {
    fontSize: fs.sm,
    color: colors.mobile.textSecondary,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: sp[8],
  },
  errorTitle: {
    fontSize: fs.base,
    fontWeight: '700',
    color: colors.mobile.textPrimary,
    textAlign: 'center',
    marginBottom: sp[3],
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
