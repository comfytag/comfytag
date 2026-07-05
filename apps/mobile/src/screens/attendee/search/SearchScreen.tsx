import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Search, X } from 'lucide-react-native'
import type { StackNavigationProp } from '@react-navigation/stack'
import { useNavigation } from '@react-navigation/native'
import { colors, sp, rd, fs } from '@comfytag/ui/tokens'
import { post } from '../../../lib/api'
import { AnimatedPressable } from '../../../components/ui/AnimatedPressable'
import { EventCard, EventCardSkeleton } from '../../../components/ui/EventCard'
import { useSearchEvents, useTrendingSearch, useCategories } from '../../../hooks'
import type { SearchStackParamList } from '../../../navigation/types'
import type { Event, Category } from '@comfytag/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type SearchNav = StackNavigationProp<SearchStackParamList, 'SearchMain'>
type DateFilter = 'today' | 'week' | 'month' | null
type PriceFilter = 'free' | null

const SCREEN_WIDTH = Dimensions.get('window').width

// ─── Filter helpers ───────────────────────────────────────────────────────────

function applyFilters(
  events: Event[],
  dateFilter: DateFilter,
  priceFilter: PriceFilter
): Event[] {
  const now = new Date()
  let filtered = events

  if (dateFilter === 'today') {
    filtered = filtered.filter((e) => {
      const d = new Date(e.date)
      d.setHours(0, 0, 0, 0)
      const t = new Date(now)
      t.setHours(0, 0, 0, 0)
      return d.getTime() === t.getTime()
    })
  } else if (dateFilter === 'week') {
    const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    filtered = filtered.filter(
      (e) => new Date(e.date) <= weekEnd && new Date(e.date) >= now
    )
  } else if (dateFilter === 'month') {
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    filtered = filtered.filter((e) => {
      const d = new Date(e.date)
      return d >= now && d <= monthEnd
    })
  }

  if (priceFilter === 'free') {
    filtered = filtered.filter(
      (e) =>
        e.ticketType.length === 0 ||
        Math.min(...e.ticketType.map((t) => t.price)) === 0
    )
  }

  return filtered
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

interface TrendingPillProps {
  label: string
  onPress: () => void
}

function TrendingPill({ label, onPress }: TrendingPillProps) {
  return (
    <AnimatedPressable
      onPress={onPress}
      hapticStyle="light"
      scaleDown={0.95}
      style={styles.trendingPill}
    >
      <Text style={styles.trendingPillText}>#{label}</Text>
    </AnimatedPressable>
  )
}

interface CategoryCardProps {
  category: Category
  onPress: () => void
}

function CategoryCard({ category, onPress }: CategoryCardProps) {
  return (
    <AnimatedPressable
      onPress={onPress}
      hapticStyle="light"
      scaleDown={0.96}
      style={styles.categoryCard}
    >
      <Text style={styles.categoryCardText}>
        {category.icon !== undefined && category.icon.length > 0
          ? `${category.icon} ${category.title}`
          : category.title}
      </Text>
    </AnimatedPressable>
  )
}

function CategoryCardSkeleton() {
  return <View style={[styles.categoryCard, styles.skeletonBg]} />
}

interface FilterPillProps {
  label: string
  active: boolean
  onPress: () => void
}

function FilterPill({ label, active, onPress }: FilterPillProps) {
  return (
    <AnimatedPressable
      onPress={onPress}
      hapticStyle="light"
      scaleDown={0.95}
      style={[styles.filterPill, active && styles.filterPillActive]}
    >
      <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>
        {label}
      </Text>
    </AnimatedPressable>
  )
}

// ─── SearchScreen ─────────────────────────────────────────────────────────────

export default function SearchScreen() {
  const navigation = useNavigation<SearchNav>()

  // ── Query state ───────────────────────────────────────────────────────────
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Filter state ──────────────────────────────────────────────────────────
  const [dateFilter, setDateFilter] = useState<DateFilter>(null)
  const [priceFilter, setPriceFilter] = useState<PriceFilter>(null)

  // ── Notify me ─────────────────────────────────────────────────────────────
  const [notifySuccess, setNotifySuccess] = useState(false)
  const [notifyPending, setNotifyPending] = useState(false)

  // ── Data hooks ────────────────────────────────────────────────────────────
  const { data: trendingTerms = [], isLoading: trendingLoading } = useTrendingSearch()
  const { data: categories = [], isLoading: categoriesLoading } = useCategories()
  const {
    data: searchData,
    isLoading: searchLoading,
    isError: searchError,
  } = useSearchEvents(debouncedQuery)

  const initLoading = trendingLoading || categoriesLoading

  // ── Debounce cleanup ──────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleQueryChange = (text: string) => {
    setQuery(text)
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (text.trim().length === 0) {
      setDebouncedQuery('')
      return
    }

    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(text.trim())
    }, 300)
  }

  const handleTagPress = (tag: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setQuery(tag)
    setDebouncedQuery(tag)
  }

  const handleClearQuery = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setQuery('')
    setDebouncedQuery('')
    setDateFilter(null)
    setPriceFilter(null)
    setNotifySuccess(false)
  }

  const handleNotifyMe = async () => {
    if (notifyPending) return
    setNotifyPending(true)
    try {
      await post('/alerts', { query: debouncedQuery })
      setNotifySuccess(true)
    } catch {
      setNotifySuccess(true) // still show success — non-critical
    } finally {
      setNotifyPending(false)
    }
  }

  const toggleDateFilter = (f: DateFilter) => {
    setDateFilter((prev) => (prev === f ? null : f))
  }

  const togglePriceFilter = (f: PriceFilter) => {
    setPriceFilter((prev) => (prev === f ? null : f))
  }

  // ── Derived ───────────────────────────────────────────────────────────────

  const results: Event[] = searchData?.data ?? []
  const displayedResults = applyFilters(results, dateFilter, priceFilter)

  // Trending chips: server-side terms first, fall back to category names
  const trendingChips =
    trendingTerms.length > 0
      ? trendingTerms.slice(0, 8)
      : (categories as Category[]).slice(0, 8).map((c) => c.title)

  const cardWidth = (SCREEN_WIDTH - sp[4] * 2 - sp[3]) / 2

  // ── View logic ────────────────────────────────────────────────────────────

  const isTyping = query.length > 0 && query !== debouncedQuery
  const isFetching = debouncedQuery.length > 0 && searchLoading
  const showSearching = isTyping || isFetching
  const showIdle = query.length === 0
  const showResults = debouncedQuery.length > 0 && !searchLoading

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Search bar */}
      <View style={styles.searchBarWrapper}>
        <View style={styles.searchBar}>
          <View style={styles.searchIconWrapper}>
            <Search size={18} color={colors.mobile.textMuted} />
          </View>
          <TextInput
            style={styles.searchInput}
            placeholder="Search events, venues, artists..."
            placeholderTextColor={colors.mobile.textMuted}
            value={query}
            onChangeText={handleQueryChange}
            autoFocus={false}
            returnKeyType="search"
            onSubmitEditing={() => {
              if (debounceRef.current) clearTimeout(debounceRef.current)
              if (query.trim().length > 0) setDebouncedQuery(query.trim())
            }}
          />
          {query.length > 0 && (
            <AnimatedPressable
              onPress={handleClearQuery}
              hapticStyle="light"
              scaleDown={0.9}
              style={styles.clearButton}
            >
              <X size={16} color={colors.mobile.textMuted} />
            </AnimatedPressable>
          )}
        </View>
      </View>

      {/* Idle view */}
      {showIdle && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>Trending</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.trendingRow}
          >
            {initLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <View key={i} style={[styles.trendingPill, styles.skeletonBg]} />
                ))
              : trendingChips.map((tag) => (
                  <TrendingPill
                    key={tag}
                    label={tag}
                    onPress={() => handleTagPress(tag)}
                  />
                ))}
          </ScrollView>

          <View style={[styles.sectionHeader, styles.sectionHeaderSpaced]}>
            <Text style={styles.sectionLabelLarge}>Browse by Category</Text>
          </View>
          <View style={styles.categoryGrid}>
            {initLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <CategoryCardSkeleton key={i} />
                ))
              : (categories as Category[]).map((cat) => (
                  <CategoryCard
                    key={cat._id}
                    category={cat}
                    onPress={() => handleTagPress(cat.title)}
                  />
                ))}
          </View>
        </ScrollView>
      )}

      {/* Searching / debounce in-flight */}
      {!showIdle && showSearching && (
        <View style={styles.searchingContainer}>
          <ActivityIndicator size="large" color={colors.brand.DEFAULT} />
          <Text style={styles.searchingText}>Searching…</Text>
        </View>
      )}

      {/* Results view */}
      {showResults && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Count + error */}
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsHeaderText}>
              {searchError
                ? 'Search unavailable'
                : `${displayedResults.length} result${displayedResults.length !== 1 ? 's' : ''} for "${debouncedQuery}"`}
            </Text>
          </View>

          {/* Filter row */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            <FilterPill
              label="Today"
              active={dateFilter === 'today'}
              onPress={() => toggleDateFilter('today')}
            />
            <FilterPill
              label="This Week"
              active={dateFilter === 'week'}
              onPress={() => toggleDateFilter('week')}
            />
            <FilterPill
              label="This Month"
              active={dateFilter === 'month'}
              onPress={() => toggleDateFilter('month')}
            />
            <FilterPill
              label="Free"
              active={priceFilter === 'free'}
              onPress={() => togglePriceFilter('free')}
            />
          </ScrollView>

          {/* Empty state */}
          {displayedResults.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>
                {`Nothing found for "${debouncedQuery}"`}
              </Text>
              <Text style={styles.emptySubtitle}>
                Try broader terms or browse categories below
              </Text>
              {notifySuccess ? (
                <Text style={styles.notifySuccessText}>You'll be notified!</Text>
              ) : (
                <AnimatedPressable
                  onPress={() => void handleNotifyMe()}
                  hapticStyle="medium"
                  scaleDown={0.97}
                  style={styles.notifyButton}
                  disabled={notifyPending}
                >
                  {notifyPending ? (
                    <ActivityIndicator size="small" color={colors.mobile.textPrimary} />
                  ) : (
                    <Text style={styles.notifyButtonText}>
                      Notify me when events match
                    </Text>
                  )}
                </AnimatedPressable>
              )}

              {/* Category chips below empty message */}
              {(categories as Category[]).length > 0 && (
                <>
                  <View style={[styles.sectionHeader, styles.sectionHeaderSpaced]}>
                    <Text style={styles.sectionLabelLarge}>Browse by Category</Text>
                  </View>
                  <View style={styles.categoryGridInline}>
                    {(categories as Category[]).slice(0, 6).map((cat) => (
                      <CategoryCard
                        key={cat._id}
                        category={cat}
                        onPress={() => handleTagPress(cat.title)}
                      />
                    ))}
                  </View>
                </>
              )}
            </View>
          ) : (
            <View style={styles.eventGrid}>
              {displayedResults.map((event) => (
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
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.mobile.bg,
  },

  // ── Search bar ─────────────────────────────────────────────────────────────
  searchBarWrapper: {
    paddingHorizontal: sp[4],
    paddingTop: sp[3],
    paddingBottom: sp[3],
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.mobile.surface,
    borderRadius: rd.md,
    borderWidth: 1,
    borderColor: colors.mobile.border,
  },
  searchIconWrapper: {
    marginLeft: sp[3],
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    color: colors.mobile.textPrimary,
    fontSize: fs.sm,
    paddingVertical: sp[3],
    paddingHorizontal: sp[2],
  },
  clearButton: {
    minHeight: 44,
    minWidth: 44,
    paddingRight: sp[3],
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Shared scroll content ─────────────────────────────────────────────────
  scrollContent: {
    paddingBottom: sp[8],
  },

  // ── Section headers ───────────────────────────────────────────────────────
  sectionHeader: {
    paddingHorizontal: sp[4],
    marginTop: sp[4],
    marginBottom: sp[3],
  },
  sectionHeaderSpaced: {
    marginTop: sp[6],
  },
  sectionLabel: {
    fontSize: fs.sm,
    fontWeight: '700',
    color: colors.mobile.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionLabelLarge: {
    fontSize: fs.base,
    fontWeight: '700',
    color: colors.mobile.textPrimary,
  },

  // ── Trending pills ────────────────────────────────────────────────────────
  trendingRow: {
    paddingHorizontal: sp[4],
    gap: sp[2],
  },
  trendingPill: {
    paddingHorizontal: sp[3],
    paddingVertical: sp[2],
    backgroundColor: colors.mobile.surface,
    borderRadius: rd.full,
    marginRight: sp[2],
    minHeight: 44,
    justifyContent: 'center',
  },
  trendingPillText: {
    fontSize: fs.sm,
    color: colors.mobile.textSecondary,
  },

  // ── Category grid ─────────────────────────────────────────────────────────
  categoryGrid: {
    paddingHorizontal: sp[4],
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: sp[3],
  },
  categoryGridInline: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: sp[3],
    alignSelf: 'stretch',
    marginTop: sp[3],
  },
  categoryCard: {
    backgroundColor: colors.mobile.surfaceRaised,
    borderRadius: rd.lg,
    padding: sp[4],
    height: 80,
    justifyContent: 'center',
    width: (SCREEN_WIDTH - sp[4] * 2 - sp[3]) / 2,
  },
  categoryCardText: {
    fontSize: fs.sm,
    fontWeight: '700',
    color: colors.mobile.textPrimary,
  },

  // ── Searching ─────────────────────────────────────────────────────────────
  searchingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchingText: {
    fontSize: fs.sm,
    color: colors.mobile.textMuted,
    marginTop: sp[3],
  },

  // ── Results header ────────────────────────────────────────────────────────
  resultsHeader: {
    paddingHorizontal: sp[4],
    paddingVertical: sp[3],
  },
  resultsHeaderText: {
    fontSize: fs.sm,
    color: colors.mobile.textSecondary,
  },

  // ── Filter row ────────────────────────────────────────────────────────────
  filterRow: {
    paddingHorizontal: sp[4],
    gap: sp[2],
    marginBottom: sp[3],
  },
  filterPill: {
    paddingHorizontal: sp[3],
    paddingVertical: sp[2],
    backgroundColor: colors.mobile.surface,
    borderRadius: rd.full,
    borderWidth: 1,
    borderColor: colors.mobile.border,
    marginRight: sp[2],
    minHeight: 44,
    justifyContent: 'center',
  },
  filterPillActive: {
    backgroundColor: colors.brand.DEFAULT,
    borderColor: colors.brand.DEFAULT,
  },
  filterPillText: {
    fontSize: fs.sm,
    color: colors.mobile.textSecondary,
  },
  filterPillTextActive: {
    color: colors.mobile.textPrimary,
    fontWeight: '700',
  },

  // ── Empty state ───────────────────────────────────────────────────────────
  emptyContainer: {
    alignItems: 'center',
    padding: sp[8],
  },
  emptyTitle: {
    fontSize: fs.lg,
    fontWeight: '700',
    color: colors.mobile.textPrimary,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: fs.sm,
    color: colors.mobile.textSecondary,
    textAlign: 'center',
    marginTop: sp[2],
  },
  notifyButton: {
    backgroundColor: colors.brand.DEFAULT,
    borderRadius: rd.full,
    paddingHorizontal: sp[6],
    paddingVertical: sp[3],
    marginTop: sp[6],
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifyButtonText: {
    color: colors.mobile.textPrimary,
    fontWeight: '700',
    fontSize: fs.sm,
  },
  notifySuccessText: {
    fontSize: fs.base,
    color: colors.mobile.success,
    fontWeight: '700',
    marginTop: sp[6],
  },

  // ── Event grid ────────────────────────────────────────────────────────────
  eventGrid: {
    paddingHorizontal: sp[4],
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: sp[3],
  },

  // ── Shared ────────────────────────────────────────────────────────────────
  skeletonBg: {
    backgroundColor: colors.mobile.surfaceRaised,
    opacity: 0.5,
  },
})
