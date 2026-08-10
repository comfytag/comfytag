import React, { useMemo, useState } from 'react'
import {
  View,
  Text,
  Image,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'
import { colors, sp, rd, fs } from '@comfytag/ui/tokens'
import type { Event } from '@comfytag/types'
import { formatDate } from '@comfytag/utils'
import { AnimatedPressable } from '../../../components/ui/AnimatedPressable'
import { getEventPriceLabel } from '../../../lib/eventPricing'
import { navigateToTabOrLogin, navigateUpTo } from '../../../lib/navigation'
import { useEvents, useCategories, useFollowing } from '../../../hooks'
import { useAuthStore } from '../../../store'
import type { DiscoverStackParamList } from '../../../navigation/types'
import { ArrowRight, Heart, MapPin, Search } from 'lucide-react-native'

type Nav = StackNavigationProp<DiscoverStackParamList, 'HomeMain'>

const ALL_CATEGORY_SLUG = 'all'

// Built and wired up, just not ready for users yet — no follow-suggestion
// flow exists to grow anyone's following list, so the section would be empty
// for ~everyone. Flip to true once that's in place.
const SHOW_FOLLOWING_SECTION = false

function eventImage(event: Event): string | undefined {
  return event.images[0] ?? event.coverImage
}

function isNewEvent(event: Event): boolean {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  return new Date(event.createdAt).getTime() >= sevenDaysAgo
}

// Sell-through — the closest read we have on "how fast people are buying".
function getSoldPct(event: Event): number {
  const totalCap = event.ticketType.reduce((s, t) => s + t.capacity, 0)
  return totalCap > 0 ? event.sold / totalCap : 0
}

// Weighted random pick without replacement — events selling faster are more
// likely to land in the reel, but it's never the same static top-N list.
// A weight floor keeps zero-sales events from being permanently excluded.
function weightedSample<T>(items: T[], weightOf: (item: T) => number, count: number): T[] {
  const pool = items.map((item) => ({ item, weight: Math.max(weightOf(item), 0.01) }))
  const picked: T[] = []
  while (picked.length < count && pool.length > 0) {
    const total = pool.reduce((sum, p) => sum + p.weight, 0)
    let r = Math.random() * total
    let idx = pool.length - 1
    for (let i = 0; i < pool.length; i++) {
      r -= pool[i].weight
      if (r <= 0) {
        idx = i
        break
      }
    }
    picked.push(pool[idx].item)
    pool.splice(idx, 1)
  }
  return picked
}

const STORY_GRADIENT = ['#FEDA75', '#FA7E1E', '#D62976', '#962FBF', '#4F5BD5'] as const

function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default function HomeScreen() {
  const navigation = useNavigation<Nav>()
  const [selectedCategory, setSelectedCategory] = useState<string>(ALL_CATEGORY_SLUG)

  const user = useAuthStore((s) => s.user)
  const avatarUri = user?.image ?? user?.avatar

  const { data: categories = [] } = useCategories()

  // Unfiltered — the category chips only narrow Trending Now below; Hero,
  // New Releases, and Nearby stay constant regardless of selected category.
  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useEvents({ limit: 24 })

  const events = data?.data ?? []

  // Instagram-style story reel — random 10, weighted by sell-through rate.
  // Recomputed only when the event list itself changes, not on every
  // re-render (e.g. category taps), so it doesn't reshuffle under the user.
  const storyEvents = useMemo(() => weightedSample(events, getSoldPct, 10), [events])

  const featuredEvent = events.find((e) => e.featured) ?? events[0]

  const trendingEvents = useMemo(() => {
    return events
      .filter((e) => e._id !== featuredEvent?._id)
      .filter(
        (e) =>
          selectedCategory === ALL_CATEGORY_SLUG ||
          e.category.toLowerCase() === selectedCategory.toLowerCase()
      )
      .slice()
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 3)
  }, [events, featuredEvent, selectedCategory])

  const newEvents = useMemo(() => {
    return events
      .filter((e) => e._id !== featuredEvent?._id && isNewEvent(e))
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8)
  }, [events, featuredEvent])

  // Personalized "Because You Follow" — gated behind SHOW_FOLLOWING_SECTION.
  const { data: followedOrganizers = [] } = useFollowing()
  const followingEvents = useMemo(() => {
    if (followedOrganizers.length === 0) return []
    const followedIds = new Set(followedOrganizers.map((o) => o._id))
    return events
      .filter((e) => e._id !== featuredEvent?._id && followedIds.has(e.planner_id))
      .slice(0, 8)
  }, [events, featuredEvent, followedOrganizers])

  const moreEvents = useMemo(() => {
    const shown = new Set([featuredEvent?._id, ...trendingEvents.map((e) => e._id)])
    const exclusive = events.filter((e) => !shown.has(e._id))
    if (exclusive.length > 0) return exclusive.slice(0, 3)
    // Small catalogs get fully consumed by Featured + Trending, which would
    // otherwise hide "Nearby Events" entirely. Fall back to overlapping with
    // Trending (excluding only the hero) so the section still shows something.
    return events.filter((e) => e._id !== featuredEvent?._id).slice(0, 3)
  }, [events, featuredEvent, trendingEvents])

  const handleEventPress = (slug: string) => {
    navigation.navigate('EventDetail', { slug })
  }

  const handleSeeAll = () => {
    navigateToTabOrLogin(navigation, 'Search')
  }

  const handleAvatarPress = () => {
    if (useAuthStore.getState().isLoggedIn) {
      navigateUpTo(navigation, 'Profile')
    } else {
      navigateUpTo(navigation, 'Login')
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Text style={styles.topBarBrand}>ComfyTag</Text>
          <View style={styles.topBarActions}>
            <AnimatedPressable style={styles.topBarIconBtn} hapticStyle="light" onPress={handleSeeAll}>
              <Search size={20} color={colors.textPublic.secondary} strokeWidth={2} />
            </AnimatedPressable>
            <AnimatedPressable style={styles.topBarAvatar} hapticStyle="light" onPress={handleAvatarPress}>
              {avatarUri !== undefined ? (
                <Image source={{ uri: avatarUri }} style={styles.topBarAvatarImage} />
              ) : (
                <Text style={styles.topBarAvatarText}>
                  {user !== null ? initials(user.name) : ''}
                </Text>
              )}
            </AnimatedPressable>
          </View>
        </View>

        {storyEvents.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storyRow}>
            {storyEvents.map((event) => (
              <AnimatedPressable
                key={event._id}
                style={styles.storyItem}
                onPress={() => handleEventPress(event.slug)}
                hapticStyle="light"
              >
                <LinearGradient
                  colors={STORY_GRADIENT}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.storyRing}
                >
                  <View style={[styles.storyRingInner, { backgroundColor: colors.public.bg }]}>
                    {eventImage(event) !== undefined ? (
                      <Image source={{ uri: eventImage(event) }} style={styles.storyAvatar} />
                    ) : (
                      <View style={[styles.storyAvatar, styles.imageFallback]} />
                    )}
                  </View>
                </LinearGradient>
                <Text style={styles.storyLabel} numberOfLines={1}>{event.name}</Text>
              </AnimatedPressable>
            ))}
          </ScrollView>
        )}

        {isLoading && (
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

        {!isLoading && !isError && events.length === 0 && (
          <View style={styles.centeredState}>
            <Text style={styles.errorText}>No events found</Text>
            <Text style={styles.emptySubtext}>Check back soon for new events.</Text>
          </View>
        )}

        {!isLoading && !isError && featuredEvent !== undefined && (
          <>
            <View style={styles.heroCardShadow}>
            <AnimatedPressable
              style={styles.heroCard}
              onPress={() => handleEventPress(featuredEvent.slug)}
              hapticStyle="medium"
            >
              {eventImage(featuredEvent) !== undefined ? (
                <Image source={{ uri: eventImage(featuredEvent) }} style={styles.heroImage} />
              ) : (
                <View style={[styles.heroImage, styles.imageFallback]} />
              )}
              <View style={styles.heroOverlay} />
              <View style={styles.heroContent}>
                <View style={styles.heroHeader}>
                  <View style={styles.featuredBadge}>
                    <Text style={styles.featuredBadgeText}>
                      {featuredEvent.featured ? 'Featured' : featuredEvent.category}
                    </Text>
                  </View>
                  <Text style={styles.heroMeta}>• {formatDate(featuredEvent.date)}</Text>
                </View>
                <Text style={styles.heroTitle} numberOfLines={2}>{featuredEvent.name}</Text>
                <Text style={styles.heroSubtitle} numberOfLines={2}>{featuredEvent.venue}</Text>
                <AnimatedPressable
                  style={styles.heroCta}
                  onPress={() => handleEventPress(featuredEvent.slug)}
                  hapticStyle="medium"
                >
                  <Text style={styles.heroCtaText}>Get Tickets</Text>
                  <ArrowRight size={16} color={colors.textPublic.onBrand} strokeWidth={2} />
                </AnimatedPressable>
              </View>
            </AnimatedPressable>
            </View>

            {newEvents.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <View>
                    <Text style={styles.sectionTitle}>New Releases</Text>
                    <Text style={styles.sectionSubtitle}>Freshly added this week</Text>
                  </View>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trendingRow}>
                  {newEvents.map((event) => (
                    <AnimatedPressable
                      key={event._id}
                      style={styles.trendingCard}
                      onPress={() => handleEventPress(event.slug)}
                      hapticStyle="light"
                    >
                      <View style={styles.trendingImageWrap}>
                        {eventImage(event) !== undefined ? (
                          <Image source={{ uri: eventImage(event) }} style={styles.trendingImage} />
                        ) : (
                          <View style={[styles.trendingImage, styles.imageFallback]} />
                        )}
                        <View style={styles.newBadge}>
                          <Text style={styles.newBadgeText}>New</Text>
                        </View>
                      </View>
                      <View style={styles.trendingBody}>
                        <Text style={styles.trendingMeta}>{getEventPriceLabel(event.ticketType)}</Text>
                        <Text style={styles.trendingTitle} numberOfLines={2}>{event.name}</Text>
                        <View style={styles.trendingLocationRow}>
                          <MapPin size={14} color={colors.textPublic.secondary} strokeWidth={2} />
                          <Text style={styles.trendingSubtitle} numberOfLines={1}>{event.venue}</Text>
                        </View>
                      </View>
                    </AnimatedPressable>
                  ))}
                </ScrollView>
              </>
            )}

            {/* Category chips — filters Trending Now only */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              <AnimatedPressable
                style={[styles.categoryChip, selectedCategory === ALL_CATEGORY_SLUG && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(ALL_CATEGORY_SLUG)}
                hapticStyle="light"
              >
                <Text style={[styles.categoryText, selectedCategory === ALL_CATEGORY_SLUG && styles.categoryTextActive]}>
                  All Events
                </Text>
              </AnimatedPressable>
              {categories.map((category) => {
                const active = category === selectedCategory
                return (
                  <AnimatedPressable
                    key={category}
                    style={[styles.categoryChip, active && styles.categoryChipActive]}
                    onPress={() => setSelectedCategory(category)}
                    hapticStyle="light"
                  >
                    <Text style={[styles.categoryText, active && styles.categoryTextActive]}>{category}</Text>
                  </AnimatedPressable>
                )
              })}
            </ScrollView>

            {trendingEvents.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <View>
                    <Text style={styles.sectionTitle}>Trending Now</Text>
                    <Text style={styles.sectionSubtitle}>What's hot this week</Text>
                  </View>
                  <AnimatedPressable style={styles.viewAllButton} hapticStyle="light" onPress={handleSeeAll}>
                    <Text style={styles.viewAllText}>View All</Text>
                  </AnimatedPressable>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trendingRow}>
                  {trendingEvents.map((event) => (
                    <AnimatedPressable
                      key={event._id}
                      style={styles.trendingCard}
                      onPress={() => handleEventPress(event.slug)}
                      hapticStyle="light"
                    >
                      <View style={styles.trendingImageWrap}>
                        {eventImage(event) !== undefined ? (
                          <Image source={{ uri: eventImage(event) }} style={styles.trendingImage} />
                        ) : (
                          <View style={[styles.trendingImage, styles.imageFallback]} />
                        )}
                        <View style={styles.trendingHeart}>
                          <Heart size={14} color={colors.brand.DEFAULT} strokeWidth={2} />
                        </View>
                      </View>
                      <View style={styles.trendingBody}>
                        <Text style={styles.trendingMeta}>{getEventPriceLabel(event.ticketType)}</Text>
                        <Text style={styles.trendingTitle} numberOfLines={2}>{event.name}</Text>
                        <View style={styles.trendingLocationRow}>
                          <MapPin size={14} color={colors.textPublic.secondary} strokeWidth={2} />
                          <Text style={styles.trendingSubtitle} numberOfLines={1}>{event.venue}</Text>
                        </View>
                      </View>
                    </AnimatedPressable>
                  ))}
                </ScrollView>
              </>
            )}

            {SHOW_FOLLOWING_SECTION && followingEvents.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <View>
                    <Text style={styles.sectionTitle}>Because You Follow</Text>
                    <Text style={styles.sectionSubtitle}>New from organisers you follow</Text>
                  </View>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trendingRow}>
                  {followingEvents.map((event) => (
                    <AnimatedPressable
                      key={event._id}
                      style={styles.trendingCard}
                      onPress={() => handleEventPress(event.slug)}
                      hapticStyle="light"
                    >
                      <View style={styles.trendingImageWrap}>
                        {eventImage(event) !== undefined ? (
                          <Image source={{ uri: eventImage(event) }} style={styles.trendingImage} />
                        ) : (
                          <View style={[styles.trendingImage, styles.imageFallback]} />
                        )}
                      </View>
                      <View style={styles.trendingBody}>
                        <Text style={styles.trendingMeta}>{event.planner}</Text>
                        <Text style={styles.trendingTitle} numberOfLines={2}>{event.name}</Text>
                        <View style={styles.trendingLocationRow}>
                          <MapPin size={14} color={colors.textPublic.secondary} strokeWidth={2} />
                          <Text style={styles.trendingSubtitle} numberOfLines={1}>{event.venue}</Text>
                        </View>
                      </View>
                    </AnimatedPressable>
                  ))}
                </ScrollView>
              </>
            )}

            {moreEvents.length > 0 && (
              <>
                <View style={styles.sectionHeaderLarge}>
                  <View>
                    <Text style={styles.sectionTitle}>Nearby Events</Text>
                    <Text style={styles.sectionSubtitle}>Happening around you</Text>
                  </View>
                </View>

                <View style={styles.nearbyLargeCardShadow}>
                <AnimatedPressable
                  style={styles.nearbyLargeCard}
                  onPress={() => handleEventPress(moreEvents[0].slug)}
                  hapticStyle="light"
                >
                  {eventImage(moreEvents[0]) !== undefined ? (
                    <Image source={{ uri: eventImage(moreEvents[0]) }} style={styles.nearbyLargeImage} />
                  ) : (
                    <View style={[styles.nearbyLargeImage, styles.imageFallback]} />
                  )}
                  <View style={styles.nearbyLargeOverlay} />
                  <View style={styles.nearbyLargeContent}>
                    <Text style={styles.nearbyLargeTitle} numberOfLines={2}>{moreEvents[0].name}</Text>
                    <Text style={styles.nearbyLargeSubtitle} numberOfLines={1}>{moreEvents[0].venue}</Text>
                    <View style={styles.nearbyTagRow}>
                      <View style={styles.tagBadgeSmall}>
                        <Text style={styles.tagBadgeText}>{moreEvents[0].category}</Text>
                      </View>
                      <Text style={styles.nearbyLargeMeta}>{getEventPriceLabel(moreEvents[0].ticketType)}</Text>
                    </View>
                  </View>
                </AnimatedPressable>
                </View>

                <View style={styles.nearbySmallRow}>
                  {moreEvents.slice(1).map((event) => (
                    <AnimatedPressable
                      key={event._id}
                      style={styles.nearbySmallCard}
                      onPress={() => handleEventPress(event.slug)}
                      hapticStyle="light"
                    >
                      {eventImage(event) !== undefined ? (
                        <Image source={{ uri: eventImage(event) }} style={styles.nearbySmallImage} />
                      ) : (
                        <View style={[styles.nearbySmallImage, styles.imageFallback]} />
                      )}
                      <View style={styles.nearbySmallBody}>
                        <Text style={styles.nearbySmallTitle} numberOfLines={2}>{event.name}</Text>
                        <Text style={styles.nearbySmallSubtitle} numberOfLines={1}>{event.venue}</Text>
                        <Text style={styles.nearbySmallMeta}>{getEventPriceLabel(event.ticketType)}</Text>
                      </View>
                    </AnimatedPressable>
                  ))}
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

// Depth via shadow (not just borders) — matches the Comfytag_Designs mockups,
// which supersede the old borders-only v2.0 rule for this screen.
const shadowSm = {
  shadowColor: '#1A1C1C',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.06,
  shadowRadius: 4,
  elevation: 2,
}
const shadowLg = {
  shadowColor: '#1A1C1C',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.14,
  shadowRadius: 20,
  elevation: 8,
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.public.bg,
  },
  content: {
    paddingBottom: sp[12],
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: sp[5],
    paddingTop: sp[4],
    paddingBottom: sp[4],
  },
  topBarBrand: {
    fontSize: fs['2xl'],
    fontWeight: '800',
    color: colors.brand.DEFAULT,
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp[3],
  },
  topBarIconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarAvatar: {
    width: 32,
    height: 32,
    borderRadius: rd.full,
    backgroundColor: colors.brand.light,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  topBarAvatarImage: {
    width: '100%',
    height: '100%',
  },
  topBarAvatarText: {
    fontSize: fs.xs,
    fontWeight: '700',
    color: colors.brand.DEFAULT,
  },

  // ── Story reel ───────────────────────────────────────────────────────────
  storyRow: {
    paddingLeft: sp[5],
    paddingBottom: sp[4],
    gap: sp[3],
  },
  storyItem: {
    width: 68,
    alignItems: 'center',
    gap: sp[1],
  },
  storyRing: {
    width: 66,
    height: 66,
    borderRadius: rd.full,
    padding: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyRingInner: {
    width: '100%',
    height: '100%',
    borderRadius: rd.full,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: rd.full,
  },
  storyLabel: {
    fontSize: fs.xs,
    fontWeight: '600',
    color: colors.textPublic.secondary,
    width: 68,
    textAlign: 'center',
    textTransform: 'capitalize',
  },

  // ── Loading / error / empty ──────────────────────────────────────────────
  centeredState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: sp[10],
    paddingHorizontal: sp[6],
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

  imageFallback: {
    backgroundColor: colors.brand.DEFAULT,
  },

  // Shadow lives on this outer wrapper — `overflow: hidden` (needed to clip the
  // image + gradient overlay to the rounded corners) would also clip the shadow
  // itself if it were on the same view.
  heroCardShadow: {
    marginBottom: sp[5],
    ...shadowLg,
  },
  heroCard: {
    overflow: 'hidden',
    minHeight: 480,
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  heroContent: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: sp[6],
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: sp[4],
  },
  featuredBadge: {
    backgroundColor: colors.energy.bg,
    paddingHorizontal: sp[4],
    paddingVertical: sp[2],
    borderRadius: rd.full,
  },
  featuredBadgeText: {
    color: colors.energy.DEFAULT,
    fontSize: fs.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  tagBadgeSmall: {
    backgroundColor: colors.brand.DEFAULT,
    paddingHorizontal: sp[3],
    paddingVertical: sp[2],
    borderRadius: rd.full,
  },
  tagBadgeText: {
    color: colors.textPublic.onBrand,
    fontSize: fs.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  heroMeta: {
    color: '#FFFFFF',
    fontSize: fs.sm,
    fontWeight: '600',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: fs['2xl'],
    fontWeight: '800',
    marginBottom: sp[3],
    maxWidth: '85%',
    textTransform: 'capitalize',
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: fs.base,
    lineHeight: 22,
    marginBottom: sp[4],
    maxWidth: '90%',
  },
  heroCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp[2],
    backgroundColor: colors.brand.DEFAULT,
    alignSelf: 'flex-start',
    paddingHorizontal: sp[5],
    paddingVertical: sp[3],
    borderRadius: rd.xl,
  },
  heroCtaText: {
    color: colors.textPublic.onBrand,
    fontSize: fs.sm,
    fontWeight: '700',
  },
  chipRow: {
    paddingLeft: sp[5],
    paddingBottom: sp[4],
  },
  categoryChip: {
    paddingHorizontal: sp[5],
    paddingVertical: sp[3],
    borderRadius: rd.full,
    backgroundColor: colors.public.surfaceAlt,
    marginRight: sp[3],
  },
  categoryChipActive: {
    backgroundColor: colors.brand.DEFAULT,
  },
  categoryText: {
    color: colors.textPublic.secondary,
    fontSize: fs.sm,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: colors.textPublic.onBrand,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: sp[5],
    marginBottom: sp[4],
  },
  sectionHeaderLarge: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: sp[5],
    marginBottom: sp[4],
  },
  sectionTitle: {
    fontSize: fs.xl,
    fontWeight: '800',
    color: colors.textPublic.primary,
  },
  sectionSubtitle: {
    marginTop: sp[1],
    color: colors.textPublic.secondary,
    fontSize: fs.sm,
  },
  viewAllButton: {
    paddingVertical: sp[2],
  },
  viewAllText: {
    color: colors.brand.DEFAULT,
    fontSize: fs.sm,
    fontWeight: '700',
  },
  trendingRow: {
    paddingLeft: sp[5],
    paddingBottom: sp[5],
  },
  trendingCard: {
    width: 220,
    marginRight: sp[4],
    borderRadius: rd.xl,
    backgroundColor: colors.public.surface,
    ...shadowSm,
  },
  trendingImageWrap: {
    position: 'relative',
  },
  trendingImage: {
    width: '100%',
    height: 150,
    borderTopLeftRadius: rd.xl,
    borderTopRightRadius: rd.xl,
  },
  trendingHeart: {
    position: 'absolute',
    top: sp[2],
    right: sp[2],
    width: 28,
    height: 28,
    borderRadius: rd.full,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newBadge: {
    position: 'absolute',
    top: sp[2],
    left: sp[2],
    backgroundColor: colors.brand.DEFAULT,
    paddingHorizontal: sp[3],
    paddingVertical: sp[1],
    borderRadius: rd.full,
  },
  newBadgeText: {
    color: colors.textPublic.onBrand,
    fontSize: fs.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  trendingBody: {
    padding: sp[4],
  },
  trendingMeta: {
    color: colors.energy.DEFAULT,
    fontSize: fs.sm,
    fontWeight: '700',
    marginBottom: sp[2],
  },
  trendingTitle: {
    color: colors.textPublic.primary,
    fontSize: fs.lg,
    fontWeight: '800',
    marginBottom: sp[2],
    textTransform: 'capitalize',
  },
  trendingLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp[1],
  },
  trendingSubtitle: {
    color: colors.textPublic.secondary,
    fontSize: fs.sm,
  },
  // Same shadow-vs-clip split as heroCardShadow/heroCard above.
  nearbyLargeCardShadow: {
    marginHorizontal: sp[5],
    marginBottom: sp[4],
    borderRadius: rd.xl,
    ...shadowSm,
  },
  nearbyLargeCard: {
    borderRadius: rd.xl,
    overflow: 'hidden',
    minHeight: 240,
  },
  nearbyLargeImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  nearbyLargeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  nearbyLargeContent: {
    position: 'absolute',
    left: sp[5],
    right: sp[5],
    bottom: sp[5],
  },
  nearbyTagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: sp[3],
  },
  nearbyLargeMeta: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: fs.sm,
  },
  nearbyLargeTitle: {
    color: '#FFFFFF',
    fontSize: fs['2xl'],
    fontWeight: '800',
    marginBottom: sp[2],
    textTransform: 'capitalize',
  },
  nearbyLargeSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: fs.sm,
    lineHeight: 20,
  },
  nearbySmallRow: {
    flexDirection: 'row',
    paddingHorizontal: sp[5],
    gap: sp[3],
  },
  nearbySmallCard: {
    flex: 1,
    backgroundColor: colors.public.surface,
    borderRadius: rd.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.public.border,
    ...shadowSm,
  },
  nearbySmallImage: {
    width: '100%',
    height: 110,
  },
  nearbySmallBody: {
    padding: sp[3],
  },
  nearbySmallTitle: {
    color: colors.textPublic.primary,
    fontSize: fs.sm,
    fontWeight: '800',
    marginBottom: sp[1],
    textTransform: 'capitalize',
  },
  nearbySmallSubtitle: {
    color: colors.textPublic.secondary,
    fontSize: fs.xs,
    marginBottom: sp[2],
  },
  nearbySmallMeta: {
    color: colors.brand.DEFAULT,
    fontSize: fs.sm,
    fontWeight: '700',
  },
})
