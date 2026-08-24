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
import { Search, X, ChevronLeft } from 'lucide-react-native'
import type { StackNavigationProp } from '@react-navigation/stack'
import { useNavigation } from '@react-navigation/native'
import { colors, sp, rd, fs } from '@comfytag/ui/tokens'
import { post } from '../../../lib/api'
import { AnimatedPressable } from '../../../components/ui/AnimatedPressable'
import { FilterPill } from '../../../components/ui/FilterPill'
import { EventListCard } from '../../../components/explore/EventListCard'
import { useSearchEvents, useTrendingSearch, useCategories, useRecentSearches } from '../../../hooks'
import { applyEventFilters, type DateFilter, type PriceFilter } from '../../../lib/eventFilters'
import type { SearchStackParamList } from '../../../navigation/types'
import type { Event } from '@comfytag/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type SearchNav = StackNavigationProp<SearchStackParamList, 'SearchMain'>

const SCREEN_WIDTH = Dimensions.get('window').width

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
  category: string
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
      <Text style={styles.categoryCardText}>{category}</Text>
    </AnimatedPressable>
  )
}

function CategoryCardSkeleton() {
  return <View style={[styles.categoryCard, styles.skeletonBg]} />
}

interface RecentSearchChipProps {
  label: string
  onPress: () => void
  onRemove: () => void
}

function RecentSearchChip({ label, onPress, onRemove }: RecentSearchChipProps) {
  return (
    <AnimatedPressable
      onPress={onPress}
      hapticStyle="light"
      scaleDown={0.97}
      style={styles.recentChip}
    >
      <Text style={styles.recentChipText} numberOfLines={1}>{label}</Text>
      <AnimatedPressable
        onPress={onRemove}
        hapticStyle="light"
        scaleDown={0.85}
        style={styles.recentChipRemove}
      >
        <X size={12} color={colors.textPublic.muted} strokeWidth={2.5} />
      </AnimatedPressable>
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

  // ── Recent searches ───────────────────────────────────────────────────────
  const { recentSearches, addRecentSearch, removeRecentSearch, clearRecentSearches } = useRecentSearches()

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

  // ── Record committed searches for the "Recent searches" list ─────────────
  useEffect(() => {
    if (debouncedQuery.trim().length > 0) {
      addRecentSearch(debouncedQuery)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery])

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
  const displayedResults = applyEventFilters(results, dateFilter, priceFilter)

  // Trending chips: server-side terms first, fall back to category names
  const trendingChips =
    trendingTerms.length > 0
      ? trendingTerms.slice(0, 8)
      : categories.slice(0, 8)

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
        <View style={styles.searchTopRow}>
          <AnimatedPressable
            onPress={() => navigation.goBack()}
            hapticStyle="light"
            style={styles.backButton}
          >
            <ChevronLeft size={22} color={colors.textPublic.primary} strokeWidth={2} />
          </AnimatedPressable>
          <View style={[styles.searchBar, styles.searchBarFlex]}>
            <View style={styles.searchIconWrapper}>
              <Search size={18} color={colors.textPublic.muted} />
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder="Search events, venues, artists..."
              placeholderTextColor={colors.textPublic.muted}
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
                <X size={16} color={colors.textPublic.muted} />
              </AnimatedPressable>
            )}
          </View>
        </View>
      </View>

      {/* Idle view */}
      {showIdle && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {recentSearches.length > 0 && (
            <>
              <View style={styles.recentHeader}>
                <Text style={styles.sectionLabelLarge}>Recent searches</Text>
                <AnimatedPressable onPress={clearRecentSearches} hapticStyle="light">
                  <Text style={styles.clearAllText}>Clear all</Text>
                </AnimatedPressable>
              </View>
              <View style={styles.recentChipsWrap}>
                {recentSearches.map((term) => (
                  <RecentSearchChip
                    key={term}
                    label={term}
                    onPress={() => handleTagPress(term)}
                    onRemove={() => removeRecentSearch(term)}
                  />
                ))}
              </View>
            </>
          )}

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
              : categories.map((cat) => (
                  <CategoryCard
                    key={cat}
                    category={cat}
                    onPress={() => handleTagPress(cat)}
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
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.notifyButtonText}>
                      Notify me when events match
                    </Text>
                  )}
                </AnimatedPressable>
              )}

              {/* Category chips below empty message */}
              {categories.length > 0 && (
                <>
                  <View style={[styles.sectionHeader, styles.sectionHeaderSpaced]}>
                    <Text style={styles.sectionLabelLarge}>Browse by Category</Text>
                  </View>
                  <View style={styles.categoryGridInline}>
                    {categories.slice(0, 6).map((cat) => (
                      <CategoryCard
                        key={cat}
                        category={cat}
                        onPress={() => handleTagPress(cat)}
                      />
                    ))}
                  </View>
                </>
              )}
            </View>
          ) : (
            <View style={styles.eventList}>
              {displayedResults.map((event) => (
                <EventListCard
                  key={event._id}
                  event={event}
                  onPress={() => navigation.navigate('EventDetail', { slug: event.slug })}
                  onGetTicket={() => navigation.navigate('EventDetail', { slug: event.slug })}
                />
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
    backgroundColor: colors.public.bg,
  },

  // ── Search bar ─────────────────────────────────────────────────────────────
  searchBarWrapper: {
    paddingHorizontal: sp[4],
    paddingTop: sp[3],
    paddingBottom: sp[3],
  },
  searchTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp[2],
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.public.surface,
    borderRadius: rd.md,
    borderWidth: 1,
    borderColor: colors.public.border,
  },
  searchBarFlex: {
    flex: 1,
  },
  searchIconWrapper: {
    marginLeft: sp[3],
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    color: colors.textPublic.primary,
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
    color: colors.textPublic.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionLabelLarge: {
    fontSize: fs.base,
    fontWeight: '700',
    color: colors.textPublic.primary,
  },

  // ── Trending pills ────────────────────────────────────────────────────────
  trendingRow: {
    paddingHorizontal: sp[4],
    gap: sp[2],
  },
  trendingPill: {
    paddingHorizontal: sp[3],
    paddingVertical: sp[2],
    backgroundColor: colors.public.surfaceAlt,
    borderRadius: rd.full,
    marginRight: sp[2],
    minHeight: 44,
    justifyContent: 'center',
  },
  trendingPillText: {
    fontSize: fs.sm,
    color: colors.textPublic.secondary,
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
    backgroundColor: colors.public.surfaceAlt,
    borderRadius: rd.lg,
    padding: sp[4],
    height: 80,
    justifyContent: 'center',
    width: (SCREEN_WIDTH - sp[4] * 2 - sp[3]) / 2,
  },
  categoryCardText: {
    fontSize: fs.sm,
    fontWeight: '700',
    color: colors.textPublic.primary,
  },

  // ── Searching ─────────────────────────────────────────────────────────────
  searchingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchingText: {
    fontSize: fs.sm,
    color: colors.textPublic.muted,
    marginTop: sp[3],
  },

  // ── Results header ────────────────────────────────────────────────────────
  resultsHeader: {
    paddingHorizontal: sp[4],
    paddingVertical: sp[3],
  },
  resultsHeaderText: {
    fontSize: fs.sm,
    color: colors.textPublic.secondary,
  },

  // ── Filter row ────────────────────────────────────────────────────────────
  filterRow: {
    paddingHorizontal: sp[4],
    gap: sp[2],
    marginBottom: sp[3],
  },
  // ── Empty state ───────────────────────────────────────────────────────────
  emptyContainer: {
    alignItems: 'center',
    padding: sp[8],
  },
  emptyTitle: {
    fontSize: fs.lg,
    fontWeight: '700',
    color: colors.textPublic.primary,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: fs.sm,
    color: colors.textPublic.secondary,
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
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: fs.sm,
  },
  notifySuccessText: {
    fontSize: fs.base,
    color: colors.success.DEFAULT,
    fontWeight: '700',
    marginTop: sp[6],
  },

  // ── Event list ────────────────────────────────────────────────────────────
  eventList: {
    paddingHorizontal: sp[4],
    gap: sp[3],
  },

  // ── Recent searches ───────────────────────────────────────────────────────
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sp[4],
    marginTop: sp[2],
    marginBottom: sp[3],
  },
  clearAllText: {
    fontSize: fs.sm,
    color: colors.brand.DEFAULT,
    fontWeight: '600',
  },
  recentChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: sp[2],
    paddingHorizontal: sp[4],
    marginBottom: sp[2],
  },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp[2],
    backgroundColor: colors.public.surfaceAlt,
    borderRadius: rd.md,
    paddingLeft: sp[3],
    paddingRight: sp[2],
    paddingVertical: sp[2],
    maxWidth: SCREEN_WIDTH - sp[8],
  },
  recentChipText: {
    fontSize: fs.sm,
    color: colors.textPublic.secondary,
    flexShrink: 1,
  },
  recentChipRemove: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Shared ────────────────────────────────────────────────────────────────
  skeletonBg: {
    backgroundColor: colors.public.surfaceAlt,
    opacity: 0.5,
  },
})
