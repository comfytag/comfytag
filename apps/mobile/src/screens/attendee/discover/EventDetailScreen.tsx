import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  ActivityIndicator,
  Image,
  TextInput,
  FlatList,
  Linking,
  Share,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { StackScreenProps } from '@react-navigation/stack'
import { LinearGradient } from 'expo-linear-gradient'
import * as Clipboard from 'expo-clipboard'
import {
  ChevronLeft,
  Share2,
  Heart,
  MapPin,
  Copy,
  Calendar,
  Info,
  Plus,
  Check,
  Zap,
  Ticket as TicketIcon,
  User as UserIcon,
} from 'lucide-react-native'
import { colors, sp, rd, fs } from '@comfytag/ui/tokens'
import { formatDate, formatTime, formatNaira } from '@comfytag/utils'
import { useEventBySlug, useEventComments, usePostComment, useLikeEvent, useRelatedEvents } from '../../../hooks'
import { AnimatedPressable } from '../../../components/ui/AnimatedPressable'
import { EventCard } from '../../../components/ui/EventCard'
import { useAuthStore } from '../../../store'
import { navigateUpTo } from '../../../lib/navigation'
import { getEventPriceLabel } from '../../../lib/eventPricing'
import { FEATURES } from '../../../lib/features'
import type { Event, TicketTier } from '@comfytag/types'
import type { DiscoverStackParamList } from '../../../navigation/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = StackScreenProps<DiscoverStackParamList, 'EventDetail'>

// Matches the flattened shape apps/api/controllers/social.js actually
// returns (userName/userAvatar/isPinned) — not a nested `user` object.
interface HookComment {
  _id: string
  userName: string
  userAvatar?: string
  text: string
  isPinned?: boolean
  createdAt: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TOP_BAR_HEIGHT = 56
const HEADER_CARD_OVERLAP = 48
const HERO_HEIGHT_RATIO = 0.45
const BOTTOM_BAR_BUTTON_HEIGHT = 52
const BOTTOM_BAR_PADDING_TOP = sp[3]
// Small cushion added on top of the device's own safe-area inset — not a
// second full padding unit, which was stacking with insets.bottom to leave
// too much empty space below the button on devices with a home indicator.
const BOTTOM_BAR_PADDING_BOTTOM = sp[1]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function formatCommentTime(dateString: string): string {
  const d = new Date(dateString)
  const diffMs = Date.now() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  return `${Math.floor(diffHours / 24)}d ago`
}

function isEventEnded(event: Event): boolean {
  return (
    event.status === 'ended' ||
    event.status === 'cancelled' ||
    new Date(event.date).getTime() < Date.now()
  )
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

function Divider() {
  return <View style={sectionStyles.divider} />
}

function BlockHeading({ title }: { title: string }) {
  return <Text style={sectionStyles.blockHeading}>{title}</Text>
}

function AvatarCircle({ name, size, fontSize }: { name: string; size: number; fontSize?: number }) {
  return (
    <View
      style={[
        sectionStyles.avatarCircle,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text
        style={[
          sectionStyles.avatarText,
          fontSize !== undefined ? { fontSize } : undefined,
        ]}
      >
        {initials(name)}
      </Text>
    </View>
  )
}

function AboutSection({ description, tags }: { description?: string; tags: string[] }) {
  const [expanded, setExpanded] = useState(false)
  const hasDescription = description !== undefined && description.length > 0

  if (!hasDescription && tags.length === 0) return null

  return (
    <View style={sectionStyles.aboutBlock}>
      <BlockHeading title="About the Event" />
      {hasDescription && (
        <>
          <Text style={sectionStyles.aboutText} numberOfLines={expanded ? undefined : 3}>
            {description}
          </Text>
          <AnimatedPressable onPress={() => setExpanded((e) => !e)} hapticStyle="light">
            <Text style={sectionStyles.readMoreText}>{expanded ? 'Show less' : 'Read more'}</Text>
          </AnimatedPressable>
        </>
      )}
      {tags.length > 0 && (
        <View style={sectionStyles.tagsRow}>
          {tags.map((tag) => (
            <View key={tag} style={sectionStyles.tagPill}>
              <Text style={sectionStyles.tagPillText}>#{tag.replace(/\s+/g, '')}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}

function LocationBento({ event, onOpenMaps }: { event: Event; onOpenMaps: () => void }) {
  const arrivalInfo =
    event.gateRules !== undefined && event.gateRules.length > 0
      ? event.gateRules.join(' ')
      : FEATURES.faceVerification
        ? `Gates open at ${formatTime(event.startTime)}. Please arrive early for smooth face check-in.`
        : `Gates open at ${formatTime(event.startTime)}. Please arrive early for smooth entry.`

  return (
    <View style={sectionStyles.bentoStack}>
      <AnimatedPressable onPress={onOpenMaps} hapticStyle="light" style={sectionStyles.mapCard}>
        <View style={sectionStyles.mapGridLineH} />
        <View style={sectionStyles.mapGridLineV} />
        <View style={sectionStyles.mapPinWrap}>
          <MapPin size={28} color={colors.brand.DEFAULT} strokeWidth={2} />
        </View>
        <View style={sectionStyles.mapOpenPill}>
          <Text style={sectionStyles.mapOpenPillText}>Open in Maps</Text>
        </View>
      </AnimatedPressable>

      <View style={sectionStyles.arrivalCard}>
        <Info size={24} color={colors.brand.DEFAULT} strokeWidth={2} />
        <Text style={sectionStyles.arrivalTitle}>Arrival Info</Text>
        <Text style={sectionStyles.arrivalText}>{arrivalInfo}</Text>
      </View>
    </View>
  )
}

function GateAccessCard({ event, onOpenMaps }: { event: Event; onOpenMaps: () => void }) {
  const [copied, setCopied] = useState(false)
  const eventLink = `https://comfytag.com/events/${event.slug}`

  const handleCopyLink = async () => {
    await Clipboard.setStringAsync(eventLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <View style={sectionStyles.gateCard}>
      <Text style={sectionStyles.gateLabel}>GATE ACCESS · BOARDING PASS</Text>

      <View style={sectionStyles.gateTimesRow}>
        <View style={sectionStyles.gateTimeCol}>
          <Text style={sectionStyles.gateTimeLabel}>GATES</Text>
          <Text style={sectionStyles.gateTimeValue}>{formatTime(event.startTime)}</Text>
          <Text style={sectionStyles.gateTimeDate}>{formatDate(event.date)}</Text>
        </View>
        <View style={sectionStyles.gateTimeColRight}>
          <Text style={sectionStyles.gateTimeLabel}>CLOSE</Text>
          <Text style={sectionStyles.gateTimeValue}>{formatTime(event.endTime)}</Text>
        </View>
      </View>

      <View style={sectionStyles.gateDivider} />

      <AnimatedPressable onPress={onOpenMaps} hapticStyle="light" style={sectionStyles.gateVenueRow}>
        <View style={sectionStyles.gateVenueIconWrap}>
          <MapPin size={16} color={colors.brand.DEFAULT} strokeWidth={2} />
        </View>
        <View style={sectionStyles.gateVenueTextGroup}>
          <Text style={sectionStyles.gateVenueLabel}>VENUE · {event.state.toUpperCase()}</Text>
          <Text style={sectionStyles.gateVenueName} numberOfLines={1}>
            {event.venue}
          </Text>
        </View>
      </AnimatedPressable>

      <View style={sectionStyles.gateDivider} />

      <View style={sectionStyles.gateLinkRow}>
        <Text style={sectionStyles.gateLinkText} numberOfLines={1}>
          {eventLink}
        </Text>
        <AnimatedPressable onPress={() => void handleCopyLink()} hapticStyle="light" style={sectionStyles.copyButton}>
          <Copy size={16} color={colors.brand.DEFAULT} strokeWidth={2} />
        </AnimatedPressable>
      </View>
      {copied && <Text style={sectionStyles.copiedHint}>Copied!</Text>}
    </View>
  )
}

// Inline tier row — selecting one highlights it (purple border/tint + check)
// and drives the sticky bottom bar's total; unlike a picker sheet, every tier
// is visible on the page at once.
function TierRow({
  tier,
  selected,
  disabled,
  onPress,
}: {
  tier: TicketTier
  selected: boolean
  disabled: boolean
  onPress: () => void
}) {
  const soldOut = tier.capacity > 0 && tier.sold >= tier.capacity
  const remaining = tier.capacity > 0 ? tier.capacity - tier.sold : null
  const fastSelling = tier.capacity > 0 && !soldOut && tier.sold / tier.capacity >= 0.8
  const hasDescription = tier.description !== undefined && tier.description.length > 0

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled}
      hapticStyle="medium"
      style={[
        sectionStyles.tierRow,
        selected && sectionStyles.tierRowSelected,
        disabled && sectionStyles.tierRowDisabled,
      ]}
    >
      <View style={sectionStyles.tierRowInfo}>
        <Text
          style={[sectionStyles.tierRowName, selected && sectionStyles.tierRowNameSelected]}
          numberOfLines={1}
        >
          {tier.name}
        </Text>
        {hasDescription && (
          <Text style={sectionStyles.tierRowDescription} numberOfLines={2}>
            {tier.description}
          </Text>
        )}
        {disabled ? (
          <Text style={sectionStyles.tierRowStatusMuted}>
            {soldOut ? 'Sold out' : 'Event ended'}
          </Text>
        ) : fastSelling ? (
          <View style={sectionStyles.tierRowStatusRow}>
            <Zap size={14} color={colors.energy.DEFAULT} strokeWidth={2} fill={colors.energy.DEFAULT} />
            <Text style={sectionStyles.tierRowStatusFast}>Fast selling</Text>
          </View>
        ) : remaining !== null ? (
          <View style={sectionStyles.tierRowStatusRow}>
            <TicketIcon size={14} color={colors.brand.DEFAULT} strokeWidth={2} />
            <Text style={sectionStyles.tierRowStatusText}>{remaining} tickets left</Text>
          </View>
        ) : null}
      </View>
      <View style={sectionStyles.tierRowRight}>
        <Text style={[sectionStyles.tierRowPrice, disabled && sectionStyles.tierRowPriceDisabled]}>
          {tier.price === 0 ? 'Free' : formatNaira(tier.price)}
        </Text>
        {!disabled && (
          <View
            style={[
              sectionStyles.tierRowSelector,
              selected && sectionStyles.tierRowSelectorSelected,
            ]}
          >
            {selected ? (
              <Check size={16} color="#FFFFFF" strokeWidth={2.5} />
            ) : (
              <Plus size={16} color={colors.textPublic.secondary} strokeWidth={2.5} />
            )}
          </View>
        )}
      </View>
    </AnimatedPressable>
  )
}

function CommentItem({ comment }: { comment: HookComment }) {
  return (
    <View style={sectionStyles.commentItem}>
      <AvatarCircle name={comment.userName} size={28} fontSize={10} />
      <View style={sectionStyles.commentBody}>
        <View style={sectionStyles.commentHeaderRow}>
          <Text style={sectionStyles.commentAuthor}>{comment.userName}</Text>
          {comment.isPinned === true && (
            <View style={sectionStyles.pinnedBadge}>
              <Text style={sectionStyles.pinnedText}>Pinned</Text>
            </View>
          )}
        </View>
        <Text style={sectionStyles.commentText}>{comment.text}</Text>
        <Text style={sectionStyles.commentTime}>
          {formatCommentTime(comment.createdAt)}
        </Text>
      </View>
    </View>
  )
}

// ─── EventDetailScreen ────────────────────────────────────────────────────────

export default function EventDetailScreen({ route, navigation }: Props) {
  const { slug } = route.params
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [commentText, setCommentText] = useState('')
  const [liked, setLiked] = useState(false)
  const [selectedTierId, setSelectedTierId] = useState('')

  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const user = useAuthStore((s) => s.user)

  const {
    data: event,
    isLoading: eventLoading,
    isError: eventError,
    refetch,
  } = useEventBySlug(slug)

  const {
    data: comments = [],
    isLoading: commentsLoading,
  } = useEventComments(event?._id ?? '')

  const { data: similarEvents = [] } = useRelatedEvents(event?.category ?? '', slug)

  const { mutate: postComment, isPending: isSubmitting } = usePostComment()
  const { mutate: likeEvent } = useLikeEvent()

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleShare = async () => {
    if (event === undefined) return
    try {
      await Share.share({
        message: `Omo, check out ${event.name}! Grab your ticket on ComfyTag.`,
        title: event.name,
      })
    } catch {
      /* silent */
    }
  }

  const handleToggleLike = () => {
    if (event === undefined) return
    setLiked((prev) => !prev)
    likeEvent({ eventId: event._id, slug: event.slug })
  }

  const handleOpenMaps = () => {
    if (event === undefined) return
    const query = encodeURIComponent(`${event.address}, ${event.state}`)
    void Linking.openURL(`https://maps.google.com/?q=${query}`)
  }

  const handleCarouselScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH)
    setActiveImageIndex(idx)
  }

  const handleSubmitComment = () => {
    if (!commentText.trim() || event === undefined || isSubmitting) return
    postComment(
      { eventId: event._id, text: commentText.trim() },
      { onSuccess: () => setCommentText('') }
    )
  }

  const handleSimilarEventPress = (similarEvent: Event) => {
    navigation.push('EventDetail', { slug: similarEvent.slug })
  }

  // ── Loading ──────────────────────────────────────────────────────────────────

  if (eventLoading) {
    return (
      <View style={styles.container}>
        <View style={[styles.centeredFull, { paddingTop: insets.top }]}>
          <ActivityIndicator size="large" color={colors.brand.DEFAULT} />
        </View>
      </View>
    )
  }

  // ── Error ────────────────────────────────────────────────────────────────────

  if (eventError || event === undefined) {
    return (
      <View style={styles.container}>
        <View style={[styles.centeredFull, { paddingTop: insets.top }]}>
          <Text style={styles.errorTitle}>Couldn't load event</Text>
          <AnimatedPressable hapticStyle="light" onPress={() => void refetch()}>
            <Text style={styles.retryText}>Tap to retry</Text>
          </AnimatedPressable>
        </View>
      </View>
    )
  }

  // ── Derived ──────────────────────────────────────────────────────────────────

  const tiers: TicketTier[] = event.ticketType ?? []
  const images = event.images ?? []
  const hasImages = images.length > 0
  const eventEnded = isEventEnded(event)
  const allSoldOut = tiers.length > 0 && tiers.every((t) => t.capacity > 0 && t.sold >= t.capacity)
  const displayedComments = (comments as HookComment[]).slice(0, 10)
  const displayLikes = (event.likes ?? 0) + (liked ? 1 : 0)
  const tags = [event.category, event.secondaryCategory, event.state].filter(
    (t): t is string => typeof t === 'string' && t.length > 0
  )

  const defaultTierId = tiers.find((t) => t.capacity - t.sold > 0)?._id ?? tiers[0]?._id ?? ''
  const resolvedTierId = selectedTierId !== '' ? selectedTierId : defaultTierId
  const selectedTier = tiers.find((t) => t._id === resolvedTierId)

  const ctaDisabled = eventEnded || allSoldOut || (tiers.length > 0 && selectedTier === undefined)
  const ctaLabel = eventEnded ? 'Event ended' : allSoldOut ? 'Sold out' : 'Buy Ticket'
  const totalPriceText =
    selectedTier !== undefined
      ? selectedTier.price === 0
        ? 'Free'
        : formatNaira(selectedTier.price)
      : getEventPriceLabel(tiers)

  const heroHeight = SCREEN_HEIGHT * HERO_HEIGHT_RATIO
  const topBarHeight = TOP_BAR_HEIGHT + insets.top
  const bottomBarHeight =
    BOTTOM_BAR_BUTTON_HEIGHT + BOTTOM_BAR_PADDING_TOP + BOTTOM_BAR_PADDING_BOTTOM + insets.bottom

  const handleSelectTier = (tier: TicketTier) => {
    const soldOut = tier.capacity > 0 && tier.sold >= tier.capacity
    if (eventEnded || soldOut) return
    setSelectedTierId(tier._id)
  }

  const handleBuyTicket = () => {
    if (ctaDisabled) return
    navigation.navigate('Checkout', {
      eventId: event._id,
      eventName: event.name,
      eventDate: event.date,
      eventVenue: event.venue,
      tiers,
      preSelectedTierId: selectedTier?._id,
    })
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  // The top bar is a solid, always-visible header (not overlaid transparently
  // on the hero) — content, including the hero image, scrolls underneath it.

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: topBarHeight, paddingBottom: bottomBarHeight + sp[6] }}
      >
        {/* Hero image */}
        <View style={[styles.hero, { width: SCREEN_WIDTH, height: heroHeight }]}>
          {hasImages ? (
            <>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleCarouselScroll}
              >
                {images.map((img, idx) => (
                  <Image
                    key={idx}
                    source={{ uri: img }}
                    style={{ width: SCREEN_WIDTH, height: heroHeight }}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
              {images.length > 1 && (
                <View style={styles.dotsRow}>
                  {images.map((_, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.dot,
                        idx === activeImageIndex ? styles.dotActive : styles.dotInactive,
                      ]}
                    />
                  ))}
                </View>
              )}
            </>
          ) : (
            <View style={[styles.heroPlaceholder, { width: SCREEN_WIDTH, height: heroHeight }]} />
          )}
          <LinearGradient
            colors={['transparent', colors.public.bg]}
            style={styles.heroFade}
            pointerEvents="none"
          />
        </View>

        {/* Content canvas — header card overlaps the hero */}
        <View style={styles.canvas}>
          <View style={[styles.headerCard, { marginTop: -HEADER_CARD_OVERLAP }]}>
            <View style={sectionStyles.headerTopRow}>
              <View style={sectionStyles.categoryBadge}>
                <Text style={sectionStyles.categoryBadgeText}>{event.category.toUpperCase()}</Text>
              </View>
              <View style={sectionStyles.headerActions}>
                <AnimatedPressable onPress={handleToggleLike} hapticStyle="light" style={sectionStyles.headerActionBtn}>
                  <Heart
                    size={16}
                    color={liked ? colors.brand.DEFAULT : colors.textPublic.secondary}
                    fill={liked ? colors.brand.DEFAULT : 'transparent'}
                    strokeWidth={2}
                  />
                  {displayLikes > 0 && (
                    <Text style={sectionStyles.headerActionCount}>{displayLikes}</Text>
                  )}
                </AnimatedPressable>
                <AnimatedPressable onPress={() => void handleShare()} hapticStyle="light" style={sectionStyles.headerActionBtn}>
                  <Share2 size={16} color={colors.textPublic.secondary} strokeWidth={2} />
                </AnimatedPressable>
              </View>
            </View>

            <Text style={styles.headerTitle}>{event.name}</Text>

            <View style={styles.headerMetaBlock}>
              <View style={styles.headerMetaRow}>
                <Calendar size={16} color={colors.brand.DEFAULT} strokeWidth={2} />
                <Text style={styles.headerMetaText}>
                  {formatDate(event.date)} • {formatTime(event.startTime)}
                </Text>
              </View>
              <AnimatedPressable onPress={handleOpenMaps} hapticStyle="light" style={styles.headerMetaRow}>
                <MapPin size={16} color={colors.brand.DEFAULT} strokeWidth={2} />
                <Text style={[styles.headerMetaText, styles.headerMetaVenue]} numberOfLines={1}>
                  {event.venue}
                </Text>
              </AnimatedPressable>
            </View>
          </View>

          <View style={styles.sectionBlock}>
            <AboutSection description={event.description} tags={tags} />
          </View>

          {Array.isArray(event.performers) && event.performers.length > 0 && (
            <View style={styles.sectionBlock}>
              <Divider />
              <BlockHeading title="Lineup" />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.lineupContent}
              >
                {event.performers.map((performer, idx) => (
                  <View key={idx} style={styles.performerItem}>
                    {typeof performer.photo === 'string' && performer.photo.length > 0 ? (
                      <Image source={{ uri: performer.photo }} style={styles.performerPhoto} />
                    ) : (
                      <View style={styles.performerAvatar}>
                        <Text style={styles.performerInitials}>{initials(performer.name)}</Text>
                      </View>
                    )}
                    <Text style={styles.performerName} numberOfLines={2}>
                      {performer.name}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.sectionBlock}>
            <Divider />
            <LocationBento event={event} onOpenMaps={handleOpenMaps} />
          </View>

          {tiers.length > 0 && (
            <View style={styles.sectionBlock}>
              <Divider />
              <View style={sectionStyles.tierHeaderRow}>
                <Text style={sectionStyles.tierHeaderTitle}>Ticket Tiers</Text>
                <Text style={sectionStyles.tierHeaderHint}>Fees calculated at checkout</Text>
              </View>
              {tiers.map((tier) => (
                <TierRow
                  key={tier._id}
                  tier={tier}
                  selected={tier._id === resolvedTierId}
                  disabled={eventEnded || (tier.capacity > 0 && tier.sold >= tier.capacity)}
                  onPress={() => handleSelectTier(tier)}
                />
              ))}
            </View>
          )}

          <View style={styles.sectionBlock}>
            <Divider />
            <GateAccessCard event={event} onOpenMaps={handleOpenMaps} />
          </View>

          <View style={styles.sectionBlock}>
            <Divider />
            <AnimatedPressable
              hapticStyle="light"
              onPress={() =>
                navigation.navigate('OrganizerProfile', {
                  organizerId: event.planner_id,
                  organizerName: event.planner,
                })
              }
            >
              <View style={styles.organizerCard}>
                <View style={styles.organizerAvatar}>
                  <Text style={styles.organizerInitials}>{initials(event.planner)}</Text>
                </View>
                <View style={styles.organizerInfo}>
                  <Text style={styles.organizerLabel}>Organised by</Text>
                  <Text style={styles.organizerName}>{event.planner}</Text>
                </View>
              </View>
            </AnimatedPressable>
          </View>

          <View style={styles.sectionBlock}>
            <Divider />
            <BlockHeading title="Comments" />

            {commentsLoading && (
              <ActivityIndicator
                size="small"
                color={colors.brand.DEFAULT}
                style={styles.commentsLoader}
              />
            )}

            {!commentsLoading && displayedComments.length === 0 && (
              <Text style={styles.commentsEmpty}>
                Who's going? Be the first to comment.
              </Text>
            )}

            {!commentsLoading && displayedComments.length > 0 && (
              <FlatList
                data={displayedComments}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => <CommentItem comment={item} />}
                scrollEnabled={false}
              />
            )}

            {isLoggedIn ? (
              <View style={styles.commentInputRow}>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Add a comment…"
                  placeholderTextColor={colors.textPublic.muted}
                  value={commentText}
                  onChangeText={setCommentText}
                  onSubmitEditing={handleSubmitComment}
                  returnKeyType="send"
                  editable={!isSubmitting}
                  multiline={false}
                />
                <AnimatedPressable
                  hapticStyle="light"
                  style={[styles.sendBtn, isSubmitting && styles.sendBtnDisabled]}
                  onPress={handleSubmitComment}
                  disabled={isSubmitting || commentText.trim().length === 0}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.sendBtnText}>Send</Text>
                  )}
                </AnimatedPressable>
              </View>
            ) : (
              <Text style={styles.signInPrompt}>Sign in to comment</Text>
            )}
          </View>

          {similarEvents.length > 0 && (
            <View style={styles.sectionBlock}>
              <BlockHeading title="Similar upcoming" />
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={similarEvents}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.similarListContent}
                renderItem={({ item }) => (
                  <EventCard event={item} variant="portrait" onPress={() => handleSimilarEventPress(item)} />
                )}
              />
            </View>
          )}
        </View>
      </ScrollView>

      {/* Fixed top app bar — solid background, always visible */}
      <View style={[styles.topBar, { height: topBarHeight, paddingTop: insets.top }]}>
        <AnimatedPressable onPress={() => navigation.goBack()} hapticStyle="light" style={styles.topBarBtn}>
          <ChevronLeft size={22} color={colors.brand.DEFAULT} strokeWidth={2} />
        </AnimatedPressable>
        <Text style={styles.topBarTitle}>ComfyTag</Text>
        <AnimatedPressable
          onPress={() => navigateUpTo(navigation, 'Profile')}
          hapticStyle="light"
          style={styles.topBarAvatar}
        >
          {user !== null ? (
            <Text style={styles.topBarAvatarText}>{initials(user.name)}</Text>
          ) : (
            <UserIcon size={16} color={colors.brand.DEFAULT} strokeWidth={2} />
          )}
        </AnimatedPressable>
      </View>

      {/* Fixed bottom bar — total price of the selected tier + Buy Ticket */}
      <View style={[styles.bottomBar, { paddingBottom: BOTTOM_BAR_PADDING_BOTTOM }]}>
        <View style={styles.bottomBarRow}>
          <View>
            <Text style={styles.bottomBarPriceLabel}>TOTAL PRICE</Text>
            <Text style={styles.bottomBarPriceValue}>{totalPriceText}</Text>
          </View>
          <AnimatedPressable
            onPress={handleBuyTicket}
            disabled={ctaDisabled}
            hapticStyle="medium"
            style={[styles.bottomBarCta, ctaDisabled && styles.bottomBarCtaDisabled]}
          >
            <Text style={[styles.bottomBarCtaText, ctaDisabled && styles.bottomBarCtaTextDisabled]}>
              {ctaLabel}
            </Text>
          </AnimatedPressable>
        </View>
      </View>
    </View>
  )
}

// ─── Section Styles ───────────────────────────────────────────────────────────

const sectionStyles = StyleSheet.create({
  divider: {
    height: 1,
    backgroundColor: colors.public.border,
    marginBottom: sp[4],
  },
  blockHeading: {
    fontSize: fs.base,
    fontWeight: '700',
    color: colors.textPublic.primary,
    marginBottom: sp[3],
  },
  avatarCircle: {
    backgroundColor: colors.brand.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: fs.xs,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Header card top row (category badge + like/share)
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: sp[3],
  },
  categoryBadge: {
    backgroundColor: colors.energy.bg,
    paddingHorizontal: sp[3],
    paddingVertical: sp[1],
    borderRadius: rd.full,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: colors.energy.DEFAULT,
  },
  headerActions: {
    flexDirection: 'row',
    gap: sp[2],
  },
  headerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp[1],
    minHeight: 32,
    minWidth: 32,
    justifyContent: 'center',
  },
  headerActionCount: {
    fontSize: fs.xs,
    fontWeight: '700',
    color: colors.textPublic.secondary,
  },

  // About section
  aboutBlock: {
    marginBottom: 0,
  },
  aboutText: {
    fontSize: fs.sm,
    color: colors.textPublic.secondary,
    lineHeight: 22,
    marginBottom: sp[2],
  },
  readMoreText: {
    fontSize: fs.sm,
    fontWeight: '700',
    color: colors.brand.DEFAULT,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: sp[2],
    marginTop: sp[3],
  },
  tagPill: {
    backgroundColor: colors.public.surfaceAlt,
    borderRadius: rd.full,
    paddingHorizontal: sp[3],
    paddingVertical: sp[1],
  },
  tagPillText: {
    fontSize: fs.xs,
    fontWeight: '600',
    color: colors.textPublic.secondary,
  },

  // Location bento (map + arrival info)
  bentoStack: {
    gap: sp[4],
  },
  mapCard: {
    height: 160,
    borderRadius: rd.xl,
    backgroundColor: colors.public.surface,
    borderWidth: 1,
    borderColor: colors.public.border,
    overflow: 'hidden',
  },
  mapGridLineH: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.public.border,
  },
  mapGridLineV: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: colors.public.border,
  },
  mapPinWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapOpenPill: {
    position: 'absolute',
    bottom: sp[3],
    left: sp[3],
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: rd.full,
    paddingHorizontal: sp[3],
    paddingVertical: sp[1],
  },
  mapOpenPillText: {
    fontSize: fs.xs,
    fontWeight: '700',
    color: colors.brand.DEFAULT,
  },
  arrivalCard: {
    backgroundColor: colors.brand.light,
    borderRadius: rd.xl,
    padding: sp[5],
  },
  arrivalTitle: {
    fontSize: fs.lg,
    fontWeight: '700',
    color: colors.textPublic.primary,
    marginTop: sp[2],
    marginBottom: sp[1],
  },
  arrivalText: {
    fontSize: fs.sm,
    color: colors.textPublic.secondary,
    lineHeight: 20,
  },

  // Gate access card
  gateCard: {
    backgroundColor: colors.public.surface,
    borderWidth: 1,
    borderColor: colors.public.border,
    borderRadius: rd.lg,
    padding: sp[4],
  },
  gateLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textPublic.muted,
    letterSpacing: 1,
    marginBottom: sp[3],
  },
  gateTimesRow: {
    flexDirection: 'row',
  },
  gateTimeCol: {
    flex: 1,
  },
  gateTimeColRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  gateTimeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textPublic.muted,
    letterSpacing: 0.5,
    marginBottom: sp[1],
  },
  gateTimeValue: {
    fontSize: fs.lg,
    fontWeight: '800',
    color: colors.textPublic.primary,
  },
  gateTimeDate: {
    fontSize: fs.xs,
    color: colors.textPublic.muted,
    marginTop: 2,
  },
  gateDivider: {
    height: 1,
    backgroundColor: colors.public.border,
    marginVertical: sp[3],
  },
  gateVenueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp[3],
  },
  gateVenueIconWrap: {
    width: 32,
    height: 32,
    borderRadius: rd.md,
    backgroundColor: colors.brand.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gateVenueTextGroup: {
    flex: 1,
  },
  gateVenueLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textPublic.muted,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  gateVenueName: {
    fontSize: fs.sm,
    fontWeight: '700',
    color: colors.textPublic.primary,
  },
  gateLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp[2],
  },
  gateLinkText: {
    flex: 1,
    fontSize: fs.xs,
    color: colors.textPublic.secondary,
  },
  copyButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copiedHint: {
    fontSize: fs.xs,
    color: colors.brand.DEFAULT,
    marginTop: sp[1],
    textAlign: 'right',
  },

  // Ticket tiers (inline, matching the reference design)
  tierHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: sp[4],
  },
  tierHeaderTitle: {
    fontSize: fs.base,
    fontWeight: '700',
    color: colors.textPublic.primary,
  },
  tierHeaderHint: {
    fontSize: fs.xs,
    color: colors.textPublic.muted,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.public.surface,
    borderWidth: 1,
    borderColor: colors.public.border,
    borderRadius: rd.xl,
    paddingHorizontal: sp[4],
    paddingVertical: sp[4],
    marginBottom: sp[3],
    gap: sp[3],
  },
  tierRowSelected: {
    borderWidth: 2,
    borderColor: colors.brand.DEFAULT,
    backgroundColor: colors.brand.light,
  },
  tierRowDisabled: {
    opacity: 0.6,
  },
  tierRowInfo: {
    flex: 1,
  },
  tierRowName: {
    fontSize: fs.base,
    fontWeight: '700',
    color: colors.textPublic.primary,
  },
  tierRowNameSelected: {
    color: colors.brand.DEFAULT,
  },
  tierRowDescription: {
    fontSize: fs.sm,
    color: colors.textPublic.secondary,
    marginTop: 2,
  },
  tierRowStatusMuted: {
    fontSize: fs.xs,
    fontWeight: '700',
    color: colors.textPublic.muted,
    marginTop: sp[2],
  },
  tierRowStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp[1],
    marginTop: sp[2],
  },
  tierRowStatusFast: {
    fontSize: fs.xs,
    fontWeight: '700',
    letterSpacing: 0.3,
    color: colors.energy.DEFAULT,
    textTransform: 'uppercase',
  },
  tierRowStatusText: {
    fontSize: fs.xs,
    fontWeight: '700',
    letterSpacing: 0.3,
    color: colors.brand.DEFAULT,
    textTransform: 'uppercase',
  },
  tierRowRight: {
    alignItems: 'flex-end',
    gap: sp[2],
  },
  tierRowPrice: {
    fontSize: fs.lg,
    fontWeight: '800',
    color: colors.textPublic.primary,
  },
  tierRowPriceDisabled: {
    color: colors.textPublic.muted,
  },
  tierRowSelector: {
    width: 32,
    height: 32,
    borderRadius: rd.full,
    backgroundColor: colors.public.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierRowSelectorSelected: {
    backgroundColor: colors.brand.DEFAULT,
  },

  // Comments
  commentItem: {
    flexDirection: 'row',
    gap: sp[3],
    marginBottom: sp[4],
  },
  commentBody: {
    flex: 1,
  },
  commentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp[2],
    marginBottom: 2,
  },
  commentAuthor: {
    fontSize: fs.sm,
    fontWeight: '700',
    color: colors.textPublic.primary,
  },
  pinnedBadge: {
    backgroundColor: colors.brand.DEFAULT,
    borderRadius: rd.sm,
    paddingHorizontal: sp[2],
    paddingVertical: 2,
  },
  pinnedText: {
    fontSize: fs.xs,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  commentText: {
    fontSize: fs.sm,
    color: colors.textPublic.secondary,
    lineHeight: 20,
    marginBottom: 2,
  },
  commentTime: {
    fontSize: fs.xs,
    color: colors.textPublic.muted,
  },
})

// ─── Screen Styles ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.public.bg,
  },
  centeredFull: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: sp[8],
  },
  errorTitle: {
    fontSize: fs.base,
    fontWeight: '700',
    color: colors.textPublic.primary,
    textAlign: 'center',
    marginBottom: sp[3],
  },
  retryText: {
    fontSize: fs.sm,
    color: colors.brand.DEFAULT,
    fontWeight: '600',
  },

  // Hero
  hero: {
    overflow: 'hidden',
    backgroundColor: colors.public.bg,
  },
  heroPlaceholder: {
    backgroundColor: colors.brand.DEFAULT,
  },
  heroFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 64,
  },
  dotsRow: {
    position: 'absolute',
    bottom: sp[4],
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: sp[1],
  },
  dot: {
    borderRadius: rd.full,
  },
  dotActive: {
    width: 8,
    height: 8,
    backgroundColor: colors.brand.DEFAULT,
  },
  dotInactive: {
    width: 6,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },

  // Fixed top app bar
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sp[4],
    backgroundColor: 'rgba(249,249,248,0.92)',
    borderBottomWidth: 1,
    borderBottomColor: colors.public.border,
  },
  topBarBtn: {
    minHeight: 36,
    minWidth: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontSize: fs.lg,
    fontWeight: '800',
    color: colors.brand.DEFAULT,
  },
  topBarAvatar: {
    width: 32,
    height: 32,
    borderRadius: rd.full,
    backgroundColor: colors.brand.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarAvatarText: {
    fontSize: fs.xs,
    fontWeight: '700',
    color: colors.brand.DEFAULT,
  },

  // Content canvas + header card
  canvas: {
    paddingHorizontal: sp[4],
  },
  headerCard: {
    backgroundColor: colors.public.surface,
    borderWidth: 1,
    borderColor: colors.public.border,
    borderRadius: rd.xl,
    padding: sp[5],
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPublic.primary,
    lineHeight: 32,
    marginBottom: sp[3],
    textTransform: 'capitalize',
  },
  headerMetaBlock: {
    gap: sp[2],
  },
  headerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp[2],
  },
  headerMetaText: {
    fontSize: fs.sm,
    color: colors.textPublic.secondary,
    flexShrink: 1,
  },
  headerMetaVenue: {
    fontWeight: '700',
    color: colors.textPublic.primary,
    textDecorationLine: 'underline',
  },

  // Below the fold
  sectionBlock: {
    marginTop: sp[6],
  },
  similarListContent: {
    gap: sp[3],
  },

  lineupContent: {
    gap: sp[4],
    paddingVertical: sp[2],
  },
  performerItem: {
    alignItems: 'center',
    width: 80,
  },
  performerPhoto: {
    width: 80,
    height: 80,
    borderRadius: rd.full,
  },
  performerAvatar: {
    width: 80,
    height: 80,
    borderRadius: rd.full,
    backgroundColor: colors.public.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  performerInitials: {
    fontSize: fs.lg,
    fontWeight: '700',
    color: colors.textPublic.secondary,
  },
  performerName: {
    fontSize: fs.xs,
    color: colors.textPublic.secondary,
    textAlign: 'center',
    marginTop: sp[2],
  },
  organizerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp[3],
    backgroundColor: colors.public.surface,
    borderRadius: rd.md,
    padding: sp[4],
    borderWidth: 1,
    borderColor: colors.public.border,
  },
  organizerAvatar: {
    width: 40,
    height: 40,
    borderRadius: rd.full,
    backgroundColor: colors.brand.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  organizerInitials: {
    fontSize: fs.sm,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  organizerInfo: {
    flex: 1,
  },
  organizerLabel: {
    fontSize: fs.xs,
    color: colors.textPublic.muted,
    marginBottom: 2,
  },
  organizerName: {
    fontSize: fs.sm,
    fontWeight: '700',
    color: colors.textPublic.primary,
  },
  commentsLoader: {
    marginVertical: sp[4],
  },
  commentsEmpty: {
    fontSize: fs.sm,
    color: colors.textPublic.muted,
    textAlign: 'center',
    fontStyle: 'italic',
    marginVertical: sp[4],
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp[3],
    marginTop: sp[4],
  },
  commentInput: {
    flex: 1,
    height: 44,
    backgroundColor: colors.public.surface,
    borderRadius: rd.md,
    paddingHorizontal: sp[4],
    fontSize: fs.sm,
    color: colors.textPublic.primary,
    borderWidth: 1,
    borderColor: colors.public.border,
  },
  sendBtn: {
    height: 44,
    paddingHorizontal: sp[4],
    backgroundColor: colors.brand.DEFAULT,
    borderRadius: rd.md,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 56,
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  sendBtnText: {
    fontSize: fs.sm,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  signInPrompt: {
    fontSize: fs.sm,
    color: colors.textPublic.muted,
    textAlign: 'center',
    marginTop: sp[4],
  },

  // Fixed bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: sp[4],
    paddingTop: BOTTOM_BAR_PADDING_TOP,
    backgroundColor: 'rgba(249,249,248,0.97)',
    borderTopWidth: 1,
    borderTopColor: colors.public.border,
  },
  bottomBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: sp[4],
  },
  bottomBarPriceLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textPublic.muted,
    letterSpacing: 0.5,
  },
  bottomBarPriceValue: {
    fontSize: fs.lg,
    fontWeight: '800',
    color: colors.textPublic.primary,
    marginTop: 2,
  },
  bottomBarCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sp[2],
    minWidth: 160,
    backgroundColor: colors.brand.DEFAULT,
    height: BOTTOM_BAR_BUTTON_HEIGHT,
    borderRadius: rd.xl,
  },
  bottomBarCtaDisabled: {
    backgroundColor: colors.public.surfaceAlt,
  },
  bottomBarCtaText: {
    fontSize: fs.base,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bottomBarCtaTextDisabled: {
    color: colors.textPublic.muted,
  },
})
