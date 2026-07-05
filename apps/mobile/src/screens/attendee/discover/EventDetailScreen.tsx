import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Image,
  TextInput,
  FlatList,
  Linking,
  Share,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { StackScreenProps } from '@react-navigation/stack'
import { ChevronLeft, Share2, Calendar, MapPin, Tag } from 'lucide-react-native'
import { colors, sp, rd, fs } from '@comfytag/ui/tokens'
import { formatDate, formatTime, formatNaira } from '@comfytag/utils'
import { useEventBySlug, useEventComments, usePostComment } from '../../../hooks'
import { AnimatedPressable } from '../../../components/ui/AnimatedPressable'
import { useAuthStore } from '../../../store'
import type { TicketTier } from '@comfytag/types'
import type { DiscoverStackParamList } from '../../../navigation/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = StackScreenProps<DiscoverStackParamList, 'EventDetail'>

interface HookComment {
  _id: string
  user: { _id: string; name: string; image?: string }
  text: string
  pinned?: boolean
  createdAt: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMinPriceText(tiers: TicketTier[]): string {
  if (tiers.length === 0) return 'Free'
  const min = Math.min(...tiers.map((t) => t.price))
  return min === 0 ? 'Free' : formatNaira(min)
}

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

// ─── Subcomponents ────────────────────────────────────────────────────────────

function Divider() {
  return <View style={sectionStyles.divider} />
}

function SectionHeader({ title }: { title: string }) {
  return <Text style={sectionStyles.sectionHeader}>{title}</Text>
}

function InfoRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <View style={sectionStyles.infoRow}>
      {icon}
      <Text style={sectionStyles.infoText} numberOfLines={2}>
        {text}
      </Text>
    </View>
  )
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

function TicketTierCard({ tier }: { tier: TicketTier }) {
  const available = tier.capacity - tier.sold
  const fillRatio = tier.capacity > 0 ? tier.sold / tier.capacity : 0
  const showBar = fillRatio > 0.5

  return (
    <View style={sectionStyles.tierCard}>
      <View style={sectionStyles.tierRow}>
        <Text style={sectionStyles.tierName}>{tier.name}</Text>
        <Text style={sectionStyles.tierPrice}>
          {tier.price === 0 ? 'Free' : formatNaira(tier.price)}
        </Text>
      </View>
      {showBar && (
        <View style={sectionStyles.capacityBarOuter}>
          <View
            style={[
              sectionStyles.capacityBarInner,
              { width: `${Math.round(fillRatio * 100)}%` as `${number}%` },
            ]}
          />
        </View>
      )}
      <Text style={sectionStyles.availableText}>
        {available > 0 ? `${available} available` : 'Sold out'}
      </Text>
    </View>
  )
}

function CommentItem({ comment }: { comment: HookComment }) {
  return (
    <View style={sectionStyles.commentItem}>
      <AvatarCircle name={comment.user.name} size={28} fontSize={10} />
      <View style={sectionStyles.commentBody}>
        <View style={sectionStyles.commentHeaderRow}>
          <Text style={sectionStyles.commentAuthor}>{comment.user.name}</Text>
          {comment.pinned === true && (
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

const SCREEN_WIDTH = Dimensions.get('window').width

export default function EventDetailScreen({ route, navigation }: Props) {
  const { slug } = route.params
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [commentText, setCommentText] = useState('')

  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)

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

  const { mutate: postComment, isPending: isSubmitting } = usePostComment()

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

  // ── Loading ──────────────────────────────────────────────────────────────────

  if (eventLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centeredFull}>
          <ActivityIndicator size="large" color={colors.brand.DEFAULT} />
        </View>
      </SafeAreaView>
    )
  }

  // ── Error ────────────────────────────────────────────────────────────────────

  if (eventError || event === undefined) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centeredFull}>
          <Text style={styles.errorTitle}>Couldn't load event</Text>
          <AnimatedPressable hapticStyle="light" onPress={() => void refetch()}>
            <Text style={styles.retryText}>Tap to retry</Text>
          </AnimatedPressable>
        </View>
      </SafeAreaView>
    )
  }

  // ── Derived ──────────────────────────────────────────────────────────────────

  const tiers: TicketTier[] = event.ticketType ?? []
  const images = event.images ?? []
  const hasImages = images.length > 0
  const isSoldOut = tiers.length > 0 && tiers.every((t) => t.sold >= t.capacity)
  const minPriceText = getMinPriceText(tiers)
  const displayedComments = (comments as HookComment[]).slice(0, 10)

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Floating nav */}
      <View style={styles.floatingNav}>
        <View style={styles.floatingNavRow}>
          <AnimatedPressable
            onPress={() => navigation.goBack()}
            hapticStyle="light"
            style={styles.navBtn}
          >
            <ChevronLeft size={20} color={colors.mobile.textPrimary} />
          </AnimatedPressable>
          <AnimatedPressable
            onPress={() => void handleShare()}
            hapticStyle="light"
            style={styles.navBtn}
          >
            <Share2 size={20} color={colors.mobile.textPrimary} />
          </AnimatedPressable>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Carousel */}
        <View style={styles.hero}>
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
                    style={styles.heroImage}
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
            <View style={styles.heroPlaceholder} />
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.eventName}>{event.name}</Text>

          {isSoldOut && (
            <View style={styles.soldOutBadge}>
              <Text style={styles.soldOutText}>Sold Out</Text>
            </View>
          )}

          <View style={styles.infoBlock}>
            <InfoRow
              icon={<Calendar size={16} color={colors.mobile.textSecondary} />}
              text={`${formatDate(event.date)} · ${formatTime(event.startTime)} – ${formatTime(event.endTime)}`}
            />
            <InfoRow
              icon={<MapPin size={16} color={colors.mobile.textSecondary} />}
              text={`${event.venue}, ${event.address}`}
            />
            <InfoRow
              icon={<Tag size={16} color={colors.mobile.textSecondary} />}
              text={event.category}
            />
          </View>

          {/* Ticket Tiers */}
          {tiers.length > 0 && (
            <>
              <Divider />
              <SectionHeader title="Tickets" />
              {tiers.map((tier) => (
                <TicketTierCard key={tier._id} tier={tier} />
              ))}
            </>
          )}

          {/* About */}
          {typeof event.description === 'string' && event.description.length > 0 && (
            <>
              <Divider />
              <SectionHeader title="About" />
              <Text style={styles.description}>{event.description}</Text>
            </>
          )}

          {/* Lineup */}
          {Array.isArray(event.performers) && event.performers.length > 0 && (
            <>
              <Divider />
              <SectionHeader title="Lineup" />
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
            </>
          )}

          {/* Location */}
          <Divider />
          <SectionHeader title="Location" />
          <Text style={styles.locationVenue}>{event.venue}</Text>
          <Text style={styles.locationAddress}>{event.address}, {event.state}</Text>
          <AnimatedPressable onPress={handleOpenMaps} hapticStyle="light" style={styles.mapsBtn}>
            <Text style={styles.mapsBtnText}>Open in Maps</Text>
          </AnimatedPressable>

          {/* Organizer */}
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

          {/* Comments */}
          <Divider />
          <SectionHeader title="Comments" />

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
                placeholderTextColor={colors.mobile.textMuted}
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
                  <ActivityIndicator size="small" color={colors.mobile.textPrimary} />
                ) : (
                  <Text style={styles.sendBtnText}>Send</Text>
                )}
              </AnimatedPressable>
            </View>
          ) : (
            <Text style={styles.signInPrompt}>Sign in to comment</Text>
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Fixed bottom CTA */}
      <View style={styles.ctaContainer}>
        <AnimatedPressable
          hapticStyle="light"
          style={styles.buyButton}
          onPress={() => {
            navigation.navigate('Checkout', {
              eventId: event._id,
              eventName: event.name,
              eventDate: event.date,
              eventVenue: event.venue,
              tiers,
            })
          }}
        >
          <Text style={styles.buyButtonText}>{`Get Tickets · ${minPriceText}`}</Text>
        </AnimatedPressable>
      </View>
    </SafeAreaView>
  )
}

// ─── Section Styles ───────────────────────────────────────────────────────────

const sectionStyles = StyleSheet.create({
  divider: {
    height: 1,
    backgroundColor: colors.mobile.border,
    marginVertical: sp[4],
  },
  sectionHeader: {
    fontSize: fs.base,
    fontWeight: '700',
    color: colors.mobile.textPrimary,
    marginBottom: sp[3],
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp[3],
    marginBottom: sp[3],
  },
  infoText: {
    fontSize: fs.sm,
    color: colors.mobile.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  avatarCircle: {
    backgroundColor: colors.brand.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: fs.xs,
    fontWeight: '700',
    color: colors.mobile.textPrimary,
  },
  tierCard: {
    backgroundColor: colors.mobile.surface,
    borderRadius: rd.md,
    padding: sp[4],
    marginBottom: sp[2],
  },
  tierRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: sp[2],
  },
  tierName: {
    fontSize: fs.sm,
    fontWeight: '700',
    color: colors.mobile.textPrimary,
  },
  tierPrice: {
    fontSize: fs.sm,
    fontWeight: '700',
    color: colors.brand.DEFAULT,
  },
  capacityBarOuter: {
    height: 4,
    backgroundColor: colors.mobile.surfaceRaised,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: sp[2],
  },
  capacityBarInner: {
    height: 4,
    backgroundColor: colors.brand.DEFAULT,
    borderRadius: 2,
  },
  availableText: {
    fontSize: fs.xs,
    color: colors.mobile.textMuted,
  },
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
    color: colors.mobile.textPrimary,
  },
  pinnedBadge: {
    backgroundColor: colors.brand.DEFAULT,
    borderRadius: rd.sm,
    paddingHorizontal: sp[2],
    paddingVertical: 2,
  },
  pinnedText: {
    fontSize: fs.xs,
    color: colors.mobile.textPrimary,
    fontWeight: '600',
  },
  commentText: {
    fontSize: fs.sm,
    color: colors.mobile.textSecondary,
    lineHeight: 20,
    marginBottom: 2,
  },
  commentTime: {
    fontSize: fs.xs,
    color: colors.mobile.textMuted,
  },
})

// ─── Screen Styles ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.mobile.bg,
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
    color: colors.mobile.textPrimary,
    textAlign: 'center',
    marginBottom: sp[3],
  },
  retryText: {
    fontSize: fs.sm,
    color: colors.brand.DEFAULT,
    fontWeight: '600',
  },
  floatingNav: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  floatingNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: sp[4],
    paddingTop: sp[2],
  },
  navBtn: {
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(13,13,13,0.6)',
    borderRadius: rd.full,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  hero: {
    height: 280,
    overflow: 'hidden',
  },
  heroImage: {
    width: SCREEN_WIDTH,
    height: 280,
  },
  heroPlaceholder: {
    width: SCREEN_WIDTH,
    height: 280,
    backgroundColor: colors.brand.DEFAULT,
  },
  dotsRow: {
    position: 'absolute',
    bottom: sp[3],
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
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  content: {
    paddingHorizontal: sp[4],
    paddingTop: sp[4],
  },
  eventName: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.mobile.textPrimary,
    marginBottom: sp[2],
    lineHeight: 30,
  },
  soldOutBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.mobile.error,
    borderRadius: rd.sm,
    paddingHorizontal: sp[3],
    paddingVertical: sp[1],
    marginBottom: sp[3],
  },
  soldOutText: {
    fontSize: fs.xs,
    fontWeight: '700',
    color: colors.mobile.textPrimary,
  },
  infoBlock: {
    marginTop: sp[2],
    marginBottom: sp[2],
  },
  description: {
    fontSize: fs.sm,
    color: colors.mobile.textSecondary,
    lineHeight: 22,
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
    backgroundColor: colors.mobile.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  performerInitials: {
    fontSize: fs.lg,
    fontWeight: '700',
    color: colors.mobile.textSecondary,
  },
  performerName: {
    fontSize: fs.xs,
    color: colors.mobile.textSecondary,
    textAlign: 'center',
    marginTop: sp[2],
  },
  locationVenue: {
    fontSize: fs.sm,
    fontWeight: '600',
    color: colors.mobile.textPrimary,
    marginBottom: sp[1],
  },
  locationAddress: {
    fontSize: fs.sm,
    color: colors.mobile.textSecondary,
    marginBottom: sp[3],
  },
  mapsBtn: {
    borderWidth: 1,
    borderColor: colors.mobile.border,
    borderRadius: rd.md,
    paddingVertical: sp[3],
    paddingHorizontal: sp[4],
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  mapsBtnText: {
    fontSize: fs.sm,
    fontWeight: '600',
    color: colors.mobile.textPrimary,
  },
  organizerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp[3],
    backgroundColor: colors.mobile.surface,
    borderRadius: rd.md,
    padding: sp[4],
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
    color: colors.mobile.textPrimary,
  },
  organizerInfo: {
    flex: 1,
  },
  organizerLabel: {
    fontSize: fs.xs,
    color: colors.mobile.textMuted,
    marginBottom: 2,
  },
  organizerName: {
    fontSize: fs.sm,
    fontWeight: '700',
    color: colors.mobile.textPrimary,
  },
  commentsLoader: {
    marginVertical: sp[4],
  },
  commentsEmpty: {
    fontSize: fs.sm,
    color: colors.mobile.textMuted,
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
    backgroundColor: colors.mobile.surface,
    borderRadius: rd.md,
    paddingHorizontal: sp[4],
    fontSize: fs.sm,
    color: colors.mobile.textPrimary,
    borderWidth: 1,
    borderColor: colors.mobile.border,
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
    color: colors.mobile.textPrimary,
  },
  signInPrompt: {
    fontSize: fs.sm,
    color: colors.mobile.textMuted,
    textAlign: 'center',
    marginTop: sp[4],
  },
  bottomSpacer: {
    height: sp[6],
  },
  ctaContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: sp[4],
    paddingBottom: sp[6],
    paddingTop: sp[3],
    backgroundColor: 'rgba(13,13,13,0.97)',
  },
  buyButton: {
    backgroundColor: colors.brand.DEFAULT,
    width: '100%',
    height: 52,
    borderRadius: rd.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyButtonText: {
    fontSize: fs.base,
    fontWeight: '700',
    color: colors.mobile.textPrimary,
  },
})
