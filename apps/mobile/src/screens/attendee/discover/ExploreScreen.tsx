import React, { useMemo, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  ScrollView,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  useWindowDimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'
import { Search } from 'lucide-react-native'
import { colors, sp, rd, fs } from '@comfytag/ui/tokens'
import { AnimatedPressable } from '../../../components/ui/AnimatedPressable'
import { SectionHeader } from '../../../components/ui/SectionHeader'
import { FilterPill } from '../../../components/ui/FilterPill'
import { EventHeroCard } from '../../../components/explore/EventHeroCard'
import { EventListCard } from '../../../components/explore/EventListCard'
import { useEvents, useCategories } from '../../../hooks'
import { applyEventFilters, type DateFilter, type PriceFilter } from '../../../lib/eventFilters'
import type { Event } from '@comfytag/types'
import type { SearchStackParamList } from '../../../navigation/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type Nav = StackNavigationProp<SearchStackParamList, 'ExploreMain'>

const ALL_CATEGORY_SLUG = 'all'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function matchesQuery(event: Event, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (q.length === 0) return true
  return (
    event.name.toLowerCase().includes(q) ||
    event.venue.toLowerCase().includes(q) ||
    event.category.toLowerCase().includes(q)
  )
}

// ─── ExploreScreen ────────────────────────────────────────────────────────────

export default function ExploreScreen() {
  const navigation = useNavigation<Nav>()
  const { width } = useWindowDimensions()

  // "Almost full screen width" — deliberately wider than the page's own
  // sp[4] horizontal padding, so the Featured row bleeds closer to the true
  // screen edges while every other section stays inset as normal.
  const heroCardWidth = width - sp[8] * 2

  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>(ALL_CATEGORY_SLUG)
  const [dateFilter, setDateFilter] = useState<DateFilter>(null)
  const [priceFilter, setPriceFilter] = useState<PriceFilter>(null)

  const { data: categories = [] } = useCategories()

  const {
    data: featuredData,
    isLoading: featuredLoading,
  } = useEvents({ featured: true, limit: 6 })

  // A large-enough pool to stand in for "all events" — searched and filtered
  // entirely client-side below, same approach as the Home screen's category
  // filter, so typing/toggling filters here never round-trips to the network.
  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useEvents({ limit: 60 })

  const featuredEvents = featuredData?.data ?? []
  const events = data?.data ?? []

  const filteredEvents = useMemo(() => {
    const matched = events.filter(
      (e) =>
        matchesQuery(e, query) &&
        (selectedCategory === ALL_CATEGORY_SLUG ||
          e.category.toLowerCase() === selectedCategory.toLowerCase())
    )
    return applyEventFilters(matched, dateFilter, priceFilter)
  }, [events, query, selectedCategory, dateFilter, priceFilter])

  const activeFilterCount =
    (selectedCategory !== ALL_CATEGORY_SLUG ? 1 : 0) +
    (dateFilter !== null ? 1 : 0) +
    (priceFilter !== null ? 1 : 0)

  const toggleDateFilter = (f: DateFilter) => {
    setDateFilter((prev) => (prev === f ? null : f))
  }

  const togglePriceFilter = (f: PriceFilter) => {
    setPriceFilter((prev) => (prev === f ? null : f))
  }

  const clearDateAndPriceFilters = () => {
    setDateFilter(null)
    setPriceFilter(null)
  }

  const handleEventPress = (event: Event) => {
    navigation.navigate('EventDetail', { slug: event.slug })
  }

  const showEmpty = !isLoading && !isError && filteredEvents.length === 0

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={filteredEvents}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        // Only visible rows mount/recycle instead of every event rendering at
        // once — search bar, filters, and states live in the header so they
        // scroll with the list instead of pinning it in a nested ScrollView.
        ListHeaderComponent={
          <>
            <Text style={styles.headerTitle}>Explore events</Text>
            <Text style={styles.headerSubtitle}>Find events happening around you</Text>

            <View style={styles.searchBar}>
              <Search size={20} color={colors.textPublic.muted} strokeWidth={2} />
              <TextInput
                style={styles.searchInput}
                value={query}
                onChangeText={setQuery}
                placeholder="Search for events"
                placeholderTextColor={colors.textPublic.muted}
                returnKeyType="search"
              />
            </View>

            {categories.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[styles.filterRow, styles.categoryRow]}
              >
                <FilterPill
                  label="All Categories"
                  active={selectedCategory === ALL_CATEGORY_SLUG}
                  onPress={() => setSelectedCategory(ALL_CATEGORY_SLUG)}
                />
                {categories.map((category) => (
                  <FilterPill
                    key={category}
                    label={category}
                    active={selectedCategory === category}
                    onPress={() => setSelectedCategory(category)}
                  />
                ))}
              </ScrollView>
            )}

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              <FilterPill label="All" active={dateFilter === null && priceFilter === null} onPress={clearDateAndPriceFilters} />
              <FilterPill label="Today" active={dateFilter === 'today'} onPress={() => toggleDateFilter('today')} />
              <FilterPill label="This Week" active={dateFilter === 'week'} onPress={() => toggleDateFilter('week')} />
              <FilterPill label="This Month" active={dateFilter === 'month'} onPress={() => toggleDateFilter('month')} />
              <FilterPill label="Free" active={priceFilter === 'free'} onPress={() => togglePriceFilter('free')} />
            </ScrollView>

            {(isLoading || featuredLoading) && (
              <View style={styles.centeredState}>
                <ActivityIndicator size="large" color={colors.brand.DEFAULT} />
              </View>
            )}

            {!isLoading && isError && (
              <View style={styles.centeredState}>
                <Text style={styles.errorText}>Couldn't load events</Text>
                <AnimatedPressable onPress={() => void refetch()} hapticStyle="light">
                  <Text style={styles.retryText}>Tap to retry</Text>
                </AnimatedPressable>
              </View>
            )}

            {showEmpty && (
              <View style={styles.centeredState}>
                <Text style={styles.errorText}>No events found</Text>
                <Text style={styles.emptySubtext}>
                  {query.trim().length > 0 || activeFilterCount > 0
                    ? 'Try a different search term or clear your filters.'
                    : 'Check back soon for new events.'}
                </Text>
              </View>
            )}

            {filteredEvents.length > 0 && (
              <SectionHeader
                title="Discover Events"
                subtitle={`${filteredEvents.length} event${filteredEvents.length !== 1 ? 's' : ''}`}
                style={styles.sectionHeaderFirst}
              />
            )}
          </>
        }
        ItemSeparatorComponent={() => <View style={styles.eventListGap} />}
        renderItem={({ item }) => (
          <EventListCard
            event={item}
            onPress={() => handleEventPress(item)}
            onGetTicket={() => handleEventPress(item)}
          />
        )}
        // Featured — massive, detail-rich hero cards, not small thumbnails
        ListFooterComponent={
          featuredEvents.length > 0 ? (
            <>
              <SectionHeader title="Featured" style={styles.sectionHeader} />
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={featuredEvents}
                keyExtractor={(item) => item._id}
                style={styles.featuredListBleed}
                contentContainerStyle={styles.featuredListContent}
                renderItem={({ item }) => (
                  <EventHeroCard
                    event={item}
                    organizerName={item.planner}
                    width={heroCardWidth}
                    onPress={() => handleEventPress(item)}
                  />
                )}
              />
              <View style={styles.bottomSpacer} />
            </>
          ) : (
            <View style={styles.bottomSpacer} />
          )
        }
      />
    </SafeAreaView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const SECTION_SPACING = sp[8] // 32px — the "strict vertical rhythm" between major sections

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.public.bg,
  },
  scrollContent: {
    paddingHorizontal: sp[4],
    paddingTop: sp[4],
    paddingBottom: sp[4],
  },

  // Header
  headerTitle: {
    fontSize: fs.xl,
    fontWeight: '800',
    color: colors.textPublic.primary,
  },
  headerSubtitle: {
    fontSize: fs.sm,
    color: colors.textPublic.secondary,
    marginTop: sp[1],
  },

  // Search bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.public.surface,
    borderWidth: 1,
    borderColor: colors.public.border,
    borderRadius: rd.lg,
    paddingHorizontal: sp[4],
    height: 48,
    marginTop: sp[4],
    gap: sp[3],
  },
  searchInput: {
    flex: 1,
    fontSize: fs.base,
    color: colors.textPublic.primary,
    height: '100%',
  },
  // Filter pill row
  filterRow: {
    paddingTop: sp[3],
    gap: sp[2],
  },
  categoryRow: {
    paddingTop: sp[4],
  },

  // Loading / error / empty
  centeredState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: sp[10],
    gap: sp[3],
  },
  errorText: {
    fontSize: fs.base,
    fontWeight: '600',
    color: colors.textPublic.secondary,
    textAlign: 'center',
  },
  retryText: {
    fontSize: fs.sm,
    fontWeight: '600',
    color: colors.brand.DEFAULT,
  },
  emptySubtext: {
    fontSize: fs.sm,
    color: colors.textPublic.muted,
    textAlign: 'center',
  },

  // Section header spacing (strict 32px vertical rhythm between sections)
  sectionHeader: {
    marginTop: SECTION_SPACING,
  },
  sectionHeaderFirst: {
    marginTop: sp[5],
    paddingBottom: sp[3],
  },

  // All events — virtualized FlatList rows; gap lives on the separator so it
  // only appears between cards, plus a bit more before the first one.
  eventListGap: {
    height: sp[3],
  },

  // Featured — bleeds past the page's own horizontal padding so hero cards
  // can read as "almost full screen width" instead of "almost full content width"
  featuredListBleed: {
    marginHorizontal: -sp[4],
  },
  featuredListContent: {
    gap: sp[3],
    paddingTop: sp[3],
    paddingHorizontal: sp[4],
  },

  bottomSpacer: {
    height: sp[8],
  },
})
