import React, { useRef, useEffect, useState } from 'react'
import {
  View,
  Text,
  Image,
  FlatList,
  Animated,
  StyleSheet,
  RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import {
  Ticket as TicketIcon,
  Calendar,
  MapPin,
  ArrowRight,
  History,
} from 'lucide-react-native'
import { colors, sp, rd, fs } from '@comfytag/ui/tokens'
import { formatDate, formatTime } from '@comfytag/utils'
import { useMyTickets } from '../../../hooks'
import { AnimatedPressable } from '../../../components/ui/AnimatedPressable'
import type { Ticket } from '@comfytag/types'
import type { TicketsStackParamList, AttendeeTabParamList } from '../../../navigation/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type Nav = StackNavigationProp<TicketsStackParamList, 'TicketsList'>
type TabNav = BottomTabNavigationProp<AttendeeTabParamList>

type TabType = 'upcoming' | 'past'

interface StatusBadgeConfig {
  label: string
  bg: string
  dot: string
  text: string
  pulse: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Tabs split on attendance, not event date — a ticket only moves to "Past"
// once it's actually been used at check-in.
function isAttended(t: Ticket): boolean {
  return t.checkedIn === true || t.status === 'used'
}

function getStatusBadge(ticket: Ticket): StatusBadgeConfig {
  if (ticket.status === 'active' && !ticket.checkedIn) {
    return { label: 'Ready for Entry', bg: colors.brand.light, dot: colors.brand.DEFAULT, text: colors.brand.dark, pulse: true }
  }
  if (ticket.checkedIn || ticket.status === 'used') {
    return { label: 'Attended', bg: colors.public.surfaceAlt, dot: colors.textPublic.muted, text: colors.textPublic.secondary, pulse: false }
  }
  if (ticket.status === 'refunded') {
    return { label: 'Refunded', bg: colors.error.bg, dot: colors.error.DEFAULT, text: colors.error.DEFAULT, pulse: false }
  }
  if (ticket.status === 'transferred') {
    return { label: 'Transferred', bg: colors.public.surfaceAlt, dot: colors.textPublic.muted, text: colors.textPublic.secondary, pulse: false }
  }
  return { label: 'Ended', bg: colors.public.surfaceAlt, dot: colors.textPublic.muted, text: colors.textPublic.secondary, pulse: false }
}

function ticketLabel(ticket: Ticket): string {
  const tier = ticket.type.toUpperCase()
  return ticket.numOfTicket > 1 ? `${tier} • ${ticket.numOfTicket} TICKETS` : tier
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

function SkeletonCard() {
  const opacity = useRef(new Animated.Value(0.4)).current
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 600, useNativeDriver: true }),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [opacity])
  return <Animated.View style={[styles.skeletonCard, { opacity }]} />
}

function PulseDot({ color }: { color: string }) {
  const opacity = useRef(new Animated.Value(1)).current
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.3, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [opacity])
  return <Animated.View style={[styles.pulseDot, { backgroundColor: color, opacity }]} />
}

interface TicketCardProps {
  ticket: Ticket
  onPress: () => void
}

function TicketCard({ ticket, onPress }: TicketCardProps) {
  const [imageError, setImageError] = useState(false)
  const badge = getStatusBadge(ticket)
  const isVip = ticket.type.toLowerCase().includes('vip')
  const showImage = !!ticket.eventImage && !imageError
  const dateLabel = [formatDate(ticket.eventDate ?? ticket.date), formatTime(ticket.eventTime)]
    .filter(Boolean)
    .join(' • ')

  return (
    <AnimatedPressable onPress={onPress} hapticStyle="light" scaleDown={0.98} style={styles.card}>
      {/* Image */}
      <View style={styles.imageWrap}>
        {showImage ? (
          <Image
            source={{ uri: ticket.eventImage as string }}
            style={styles.image}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={[styles.image, styles.imageFallback]}>
            <TicketIcon size={28} color="rgba(255,255,255,0.6)" strokeWidth={1.5} />
          </View>
        )}
        {isVip && (
          <View style={styles.vipBadge}>
            <Text style={styles.vipBadgeText}>VIP</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.eventName} numberOfLines={2}>
            {ticket.eventname}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
            {badge.pulse && <PulseDot color={badge.dot} />}
            <Text style={[styles.statusBadgeText, { color: badge.text }]}>{badge.label}</Text>
          </View>
        </View>

        {dateLabel.length > 0 && (
          <View style={styles.metaRow}>
            <Calendar size={16} color={colors.textPublic.secondary} strokeWidth={2} />
            <Text style={styles.metaText}>{dateLabel}</Text>
          </View>
        )}
        {ticket.eventVenue !== undefined && ticket.eventVenue.length > 0 && (
          <View style={styles.metaRow}>
            <MapPin size={16} color={colors.textPublic.secondary} strokeWidth={2} />
            <Text style={styles.metaText} numberOfLines={1}>
              {ticket.eventVenue}
            </Text>
          </View>
        )}

        <View style={styles.footerRow}>
          <Text style={styles.footerLabel}>{ticketLabel(ticket)}</Text>
          <View style={styles.footerCta}>
            <Text style={styles.footerCtaText}>View Ticket</Text>
            <ArrowRight size={16} color={colors.brand.DEFAULT} strokeWidth={2.5} />
          </View>
        </View>
      </View>
    </AnimatedPressable>
  )
}

function PastTabHint() {
  return (
    <View style={styles.hintBox}>
      <History size={32} color={colors.textPublic.muted} strokeWidth={1.5} />
      <Text style={styles.hintText}>Your past tickets will appear in the 'Past' tab.</Text>
    </View>
  )
}

function MemberPromoBanner() {
  return (
    <View style={styles.promoCard}>
      <LinearGradient
        colors={[colors.brand.light, '#F5F0FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.promoIconWrap}>
        <TicketIcon size={96} color={colors.brand.DEFAULT} strokeWidth={1} style={{ opacity: 0.12 }} />
      </View>
      <View style={styles.promoContent}>
        <Text style={styles.promoEyebrow}>MEMBER EXCLUSIVE</Text>
        <Text style={styles.promoTitle}>Get 20% off your next booking</Text>
        <Text style={styles.promoSubtext}>
          Use code COMFY20 at checkout for any upcoming concert this season.
        </Text>
        <AnimatedPressable hapticStyle="medium" style={styles.promoButton}>
          <Text style={styles.promoButtonText}>Claim Offer</Text>
        </AnimatedPressable>
      </View>
    </View>
  )
}

// ─── MyTicketsScreen ──────────────────────────────────────────────────────────

export default function MyTicketsScreen() {
  const navigation = useNavigation<Nav>()
  const [activeTab, setActiveTab] = useState<TabType>('upcoming')

  const { data, isLoading, isFetching, isError, refetch } = useMyTickets()
  const tickets: Ticket[] = data ?? []

  const upcomingTickets = tickets.filter((t) => !isAttended(t))
  const pastTickets = tickets.filter(isAttended)
  const displayed = activeTab === 'upcoming' ? upcomingTickets : pastTickets

  // ── Render helpers ────────────────────────────────────────────────────────

  const renderItem = ({ item }: { item: Ticket }) => (
    <TicketCard
      ticket={item}
      onPress={() => navigation.navigate('TicketDetail', { ticketId: item._id })}
    />
  )

  const ListHeader = () => (
    <View>
      {/* Title */}
      <Text style={styles.screenTitle}>My Tickets</Text>
      <Text style={styles.screenSubtitle}>Manage your upcoming event experiences</Text>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <AnimatedPressable
          hapticStyle="light"
          onPress={() => setActiveTab('upcoming')}
          style={[styles.tabPill, activeTab === 'upcoming' ? styles.tabPillActive : styles.tabPillInactive]}
        >
          <Text style={activeTab === 'upcoming' ? styles.tabPillTextActive : styles.tabPillTextInactive}>
            Upcoming
          </Text>
        </AnimatedPressable>

        <AnimatedPressable
          hapticStyle="light"
          onPress={() => setActiveTab('past')}
          style={[styles.tabPill, activeTab === 'past' ? styles.tabPillActive : styles.tabPillInactive]}
        >
          <Text style={activeTab === 'past' ? styles.tabPillTextActive : styles.tabPillTextInactive}>
            Past
          </Text>
        </AnimatedPressable>
      </View>
    </View>
  )

  const ListFooter = () => (
    <View>
      {activeTab === 'upcoming' && upcomingTickets.length > 0 && pastTickets.length === 0 && (
        <PastTabHint />
      )}
      <MemberPromoBanner />
    </View>
  )

  const ListEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <TicketIcon size={28} color={colors.textPublic.muted} strokeWidth={1.5} />
      </View>
      <Text style={styles.emptyHeading}>
        {activeTab === 'upcoming' ? 'No upcoming tickets' : 'No past tickets'}
      </Text>
      <Text style={styles.emptySubtext}>
        {activeTab === 'upcoming'
          ? 'Events you buy tickets for will appear here.'
          : 'Tickets for events you have attended will appear here.'}
      </Text>
      {activeTab === 'upcoming' && (
        <AnimatedPressable
          hapticStyle="medium"
          style={styles.exploreButton}
          onPress={() => navigation.getParent<TabNav>()?.navigate('Discover')}
        >
          <Text style={styles.exploreButtonText}>Explore Events</Text>
        </AnimatedPressable>
      )}
    </View>
  )

  // ── Loading skeleton ───────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Text style={styles.screenTitle}>My Tickets</Text>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </SafeAreaView>
    )
  }

  // ── Error ─────────────────────────────────────────────────────────────────

  if (isError) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Text style={styles.screenTitle}>My Tickets</Text>
        <View style={styles.centeredState}>
          <Text style={styles.errorText}>Couldn't load tickets</Text>
          <AnimatedPressable hapticStyle="light" onPress={() => void refetch()}>
            <Text style={styles.retryText}>Tap to retry</Text>
          </AnimatedPressable>
        </View>
      </SafeAreaView>
    )
  }

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList<Ticket>
        data={displayed}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        ListHeaderComponent={<ListHeader />}
        ListEmptyComponent={<ListEmpty />}
        ListFooterComponent={displayed.length > 0 ? <ListFooter /> : undefined}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={() => void refetch()}
            tintColor={colors.brand.DEFAULT}
            colors={[colors.brand.DEFAULT]}
          />
        }
      />
    </SafeAreaView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.public.bg,
  },
  listContent: {
    paddingHorizontal: sp[4],
    paddingBottom: sp[12],
    flexGrow: 1,
  },

  // ── Screen title ─────────────────────────────────────────────────────────
  screenTitle: {
    fontSize: fs.xl,
    fontWeight: '800',
    color: colors.textPublic.primary,
    paddingHorizontal: sp[4],
    paddingTop: sp[4],
  },
  screenSubtitle: {
    fontSize: fs.sm,
    color: colors.textPublic.secondary,
    paddingHorizontal: sp[4],
    paddingTop: sp[1],
    paddingBottom: sp[5],
  },

  // ── Tabs (pill style) ───────────────────────────────────────────────────
  tabRow: {
    flexDirection: 'row',
    gap: sp[3],
    marginBottom: sp[5],
  },
  tabPill: {
    paddingHorizontal: sp[5],
    paddingVertical: sp[2],
    borderRadius: rd.full,
  },
  tabPillActive: {
    backgroundColor: colors.brand.DEFAULT,
  },
  tabPillInactive: {
    backgroundColor: colors.public.surfaceAlt,
  },
  tabPillTextActive: {
    fontSize: fs.sm,
    fontWeight: '700',
    color: colors.textPublic.onBrand,
  },
  tabPillTextInactive: {
    fontSize: fs.sm,
    fontWeight: '700',
    color: colors.textPublic.secondary,
  },

  // ── Ticket card ───────────────────────────────────────────────────────────
  card: {
    backgroundColor: colors.public.surface,
    borderRadius: rd.xl,
    marginBottom: sp[5],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.public.border,
    overflow: 'hidden',
  },
  imageWrap: {
    height: 140,
    width: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    backgroundColor: colors.brand.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vipBadge: {
    position: 'absolute',
    top: sp[2],
    left: sp[2],
    backgroundColor: colors.brand.dark,
    borderRadius: rd.sm,
    paddingHorizontal: sp[2],
    paddingVertical: 2,
  },
  vipBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textPublic.onBrand,
    letterSpacing: 0.5,
  },
  content: {
    padding: sp[4],
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: sp[2],
    marginBottom: sp[3],
  },
  eventName: {
    flex: 1,
    fontSize: fs.lg,
    fontWeight: '700',
    color: colors.textPublic.primary,
    lineHeight: 23,
    textTransform: 'capitalize',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp[1],
    borderRadius: rd.full,
    paddingVertical: 4,
    paddingHorizontal: sp[3],
    flexShrink: 0,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp[2],
    marginBottom: sp[2],
  },
  metaText: {
    fontSize: fs.sm,
    color: colors.textPublic.secondary,
    flexShrink: 1,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: sp[2],
    paddingTop: sp[4],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.public.border,
  },
  footerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPublic.muted,
    letterSpacing: 0.3,
  },
  footerCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp[1],
  },
  footerCtaText: {
    fontSize: fs.sm,
    fontWeight: '700',
    color: colors.brand.DEFAULT,
  },

  // ── Past-tab hint ────────────────────────────────────────────────────────
  hintBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.public.border,
    borderRadius: rd.xl,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: sp[6],
    paddingHorizontal: sp[5],
    gap: sp[2],
    marginBottom: sp[6],
  },
  hintText: {
    fontSize: fs.sm,
    color: colors.textPublic.muted,
    fontStyle: 'italic',
    textAlign: 'center',
  },

  // ── Member promo banner ──────────────────────────────────────────────────
  promoCard: {
    borderRadius: rd.xl,
    overflow: 'hidden',
    marginBottom: sp[6],
  },
  promoIconWrap: {
    position: 'absolute',
    right: sp[2],
    top: '50%',
    transform: [{ translateY: -48 }],
  },
  promoContent: {
    padding: sp[6],
    maxWidth: '75%',
  },
  promoEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.brand.dark,
    marginBottom: sp[2],
    textTransform: 'uppercase',
  },
  promoTitle: {
    fontSize: fs.xl,
    fontWeight: '800',
    color: colors.textPublic.primary,
    marginBottom: sp[2],
  },
  promoSubtext: {
    fontSize: fs.sm,
    color: colors.textPublic.secondary,
    lineHeight: 20,
    marginBottom: sp[4],
  },
  promoButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.brand.DEFAULT,
    borderRadius: rd.full,
    paddingHorizontal: sp[5],
    paddingVertical: sp[2],
  },
  promoButtonText: {
    fontSize: fs.sm,
    fontWeight: '700',
    color: colors.textPublic.onBrand,
  },

  // ── Skeleton ─────────────────────────────────────────────────────────────
  skeletonCard: {
    height: 220,
    backgroundColor: colors.public.surfaceAlt,
    borderRadius: rd.xl,
    marginHorizontal: sp[4],
    marginBottom: sp[4],
  },

  // ── States ───────────────────────────────────────────────────────────────
  centeredState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: sp[12],
  },
  errorText: {
    fontSize: fs.base,
    fontWeight: '700',
    color: colors.textPublic.primary,
    marginBottom: sp[3],
  },
  retryText: {
    fontSize: fs.sm,
    color: colors.brand.DEFAULT,
    fontWeight: '600',
  },

  // ── Empty ─────────────────────────────────────────────────────────────────
  emptyContainer: {
    alignItems: 'center',
    paddingTop: sp[12],
    paddingHorizontal: sp[6],
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.public.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: sp[5],
  },
  emptyHeading: {
    fontSize: fs.lg,
    fontWeight: '700',
    color: colors.textPublic.primary,
    textAlign: 'center',
    marginBottom: sp[2],
  },
  emptySubtext: {
    fontSize: fs.sm,
    color: colors.textPublic.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: sp[8],
  },
  exploreButton: {
    height: 52,
    backgroundColor: colors.brand.DEFAULT,
    borderRadius: rd.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: sp[8],
  },
  exploreButtonText: {
    fontSize: fs.base,
    fontWeight: '700',
    color: '#FFFFFF',
  },
})
