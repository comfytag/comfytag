import React, { useRef, useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  Image,
  Animated,
  ActivityIndicator,
  StyleSheet,
  Share,
  Linking,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import type { StackScreenProps } from '@react-navigation/stack'
import {
  ChevronLeft,
  CheckCircle2,
  ScanFace,
  QrCode,
  ShieldCheck,
  Share2,
  Send,
  MapPin,
} from 'lucide-react-native'
import { colors, sp, rd, fs } from '@comfytag/ui/tokens'
import { formatDate, formatTime, getVenueCoords } from '@comfytag/utils'
import { AnimatedPressable } from '../../../components/ui/AnimatedPressable'
import { Avatar } from '../../../components/ui/Avatar'
import { useTicketDetail, useTicketStatus } from '../../../hooks'
import { useAuthStore } from '../../../store'
import { FEATURES } from '../../../lib/features'
import type { Ticket } from '@comfytag/types'
import type { TicketsStackParamList } from '../../../navigation/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = StackScreenProps<TicketsStackParamList, 'TicketDetail'>

interface StatusMeta {
  pillLabel: string
  pillColor: string
  pillBg: string
  headline: string
  subtitle: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStatusMeta(status: Ticket['status'], checkedIn: boolean): StatusMeta {
  if (checkedIn || status === 'used') {
    return {
      pillLabel: 'Checked In',
      pillColor: colors.success.DEFAULT,
      pillBg: colors.success.bg,
      headline: 'Entry Complete',
      subtitle: "You've successfully checked in to this event.",
    }
  }
  if (status === 'active') {
    return {
      pillLabel: 'Verified Status',
      pillColor: colors.success.DEFAULT,
      pillBg: colors.success.bg,
      headline: 'Confirmed & Ready',
      subtitle: 'Your digital entry identity is active for the upcoming event.',
    }
  }
  if (status === 'transferred') {
    return {
      pillLabel: 'Transferred',
      pillColor: colors.textPublic.secondary,
      pillBg: colors.public.surfaceAlt,
      headline: 'Ticket Transferred',
      subtitle: 'This ticket has been transferred to another attendee.',
    }
  }
  if (status === 'refunded') {
    return {
      pillLabel: 'Refunded',
      pillColor: colors.error.DEFAULT,
      pillBg: colors.error.bg,
      headline: 'Ticket Refunded',
      subtitle: 'This ticket has been refunded and is no longer valid.',
    }
  }
  return {
    pillLabel: 'Ended',
    pillColor: colors.textPublic.secondary,
    pillBg: colors.public.surfaceAlt,
    headline: 'Event Ended',
    subtitle: 'This event has ended.',
  }
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

function PulseRing() {
  const scale = useRef(new Animated.Value(1)).current
  const opacity = useRef(new Animated.Value(0.5)).current
  useEffect(() => {
    const loop = Animated.loop(
      Animated.parallel([
        Animated.timing(scale, { toValue: 1.25, duration: 1600, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 1600, useNativeDriver: true }),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [scale, opacity])

  return (
    <Animated.View
      style={[styles.pulseRing, { opacity, transform: [{ scale }] }]}
    />
  )
}

function TicketNotches() {
  return (
    <View style={styles.notchRow}>
      <View style={[styles.notchCircle, { left: -12 }]} />
      <View style={[styles.notchCircle, { right: -12 }]} />
    </View>
  )
}

// ─── TicketDetailScreen ───────────────────────────────────────────────────────

export default function TicketDetailScreen({ route, navigation }: Props) {
  const { ticketId } = route.params
  const user = useAuthStore((s) => s.user)
  const [imageError, setImageError] = useState(false)
  const [mapImageError, setMapImageError] = useState(false)

  const {
    data: ticket,
    isLoading,
    isError,
    refetch,
  } = useTicketDetail(ticketId)

  const { data: statusData } = useTicketStatus(ticketId)

  // ── Loading ───────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <AnimatedPressable
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hapticStyle="light"
          >
            <ChevronLeft size={24} color={colors.brand.DEFAULT} strokeWidth={2} />
          </AnimatedPressable>
          <Text style={styles.headerBrand}>ComfyTag</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color={colors.brand.DEFAULT} />
        </View>
      </SafeAreaView>
    )
  }

  // ── Error ─────────────────────────────────────────────────────────────────

  if (isError || ticket === undefined) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <AnimatedPressable
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hapticStyle="light"
          >
            <ChevronLeft size={24} color={colors.brand.DEFAULT} strokeWidth={2} />
          </AnimatedPressable>
          <Text style={styles.headerBrand}>ComfyTag</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.centeredContainer}>
          <Text style={styles.errorText}>Couldn't load ticket</Text>
          <AnimatedPressable onPress={() => void refetch()} style={styles.retryPressable}>
            <Text style={styles.retryText}>Tap to retry</Text>
          </AnimatedPressable>
        </View>
      </SafeAreaView>
    )
  }

  // ── Derived ───────────────────────────────────────────────────────────────

  // Real-time status wins when available
  const currentStatus = statusData?.status ?? ticket.status
  const isCheckedIn = statusData?.checkedIn === true
  const meta = getStatusMeta(currentStatus, isCheckedIn)
  const isFaceLinked = typeof ticket.faceOwner === 'string' && ticket.faceOwner.length > 0
  const showFaceEntry = FEATURES.faceVerification && isFaceLinked
  const hasQr = typeof ticket.qrCode === 'string' && ticket.qrCode.length > 0
  const hasVenue = typeof ticket.eventVenue === 'string' && ticket.eventVenue.length > 0
  const canTransfer = ticket.status === 'active' && !isCheckedIn
  const showImage = !!ticket.eventImage && !imageError
  const biometricPhoto = user?.verify?.photo ?? user?.avatar ?? user?.image ?? null

  const dateLabel = formatDate(ticket.eventDate ?? ticket.date)
  const timeLabel = formatTime(ticket.eventTime) || formatTime(ticket.date)

  const [mapLng, mapLat] = getVenueCoords(ticket.eventVenue, ticket.eventLocation, ticket.eventState)
  const mapImageUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${mapLat},${mapLng}&zoom=15&size=640x280&maptype=mapnik`

  const handleShare = () => {
    void Share.share({
      message: `My ticket for ${ticket.eventname} — Ref: ${ticket.reference.toUpperCase()}`,
    })
  }

  const handleGetDirections = () => {
    if (!hasVenue) return
    const query = encodeURIComponent(ticket.eventVenue ?? '')
    void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`)
  }

  // ── Loaded ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <AnimatedPressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hapticStyle="light"
        >
          <ChevronLeft size={24} color={colors.brand.DEFAULT} strokeWidth={2} />
        </AnimatedPressable>
        <Text style={styles.headerBrand}>ComfyTag</Text>
        <Avatar uri={biometricPhoto} name={user?.name} size="sm" />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status headline */}
        <View style={styles.statusSection}>
          <View style={[styles.statusPill, { backgroundColor: meta.pillBg }]}>
            <CheckCircle2 size={14} color={meta.pillColor} strokeWidth={2.5} />
            <Text style={[styles.statusPillText, { color: meta.pillColor }]}>{meta.pillLabel}</Text>
          </View>
          <Text style={styles.statusHeadline}>{meta.headline}</Text>
          <Text style={styles.statusSubtitle}>{meta.subtitle}</Text>
        </View>

        {/* Ticket card */}
        <View style={styles.ticketCard}>
          {/* Image + event info */}
          <View style={styles.imageSection}>
            {showImage ? (
              <Image
                source={{ uri: ticket.eventImage as string }}
                style={styles.image}
                resizeMode="cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <View style={[styles.image, styles.imageFallback]} />
            )}
            <LinearGradient
              colors={['transparent', 'rgba(28,25,23,0.85)']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.imageTextWrap}>
              <Text style={styles.eventEyebrow}>Main Event</Text>
              <Text style={styles.eventName} numberOfLines={2}>
                {ticket.eventname}
              </Text>
            </View>
            {(showFaceEntry || hasQr) && (
              <View style={styles.entryBadge}>
                {showFaceEntry ? (
                  <ScanFace size={18} color={colors.brand.DEFAULT} strokeWidth={2} />
                ) : (
                  <QrCode size={18} color={colors.brand.DEFAULT} strokeWidth={2} />
                )}
                <Text style={styles.entryBadgeText}>{showFaceEntry ? 'Face Only' : 'QR Entry'}</Text>
              </View>
            )}
          </View>

          {/* Date / Time / Venue / Ticket type grid */}
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <View>
                <Text style={styles.infoLabel}>Date</Text>
                <Text style={styles.infoValueLg}>{dateLabel}</Text>
              </View>
              <View style={styles.infoRight}>
                <Text style={styles.infoLabel}>Time</Text>
                <Text style={styles.infoValueLg}>{timeLabel}</Text>
              </View>
            </View>
            <View style={[styles.infoRow, styles.infoRowLast]}>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Venue</Text>
                <Text style={styles.infoValue} numberOfLines={1}>
                  {ticket.eventVenue ?? '—'}
                </Text>
              </View>
              <View style={[styles.infoCol, styles.infoRight]}>
                <Text style={styles.infoLabel}>Ticket Type</Text>
                <Text style={styles.infoValue} numberOfLines={1}>
                  {ticket.type}
                </Text>
              </View>
            </View>
          </View>

          <TicketNotches />

          {/* Biometric identity or QR fallback */}
          {showFaceEntry ? (
            <View style={styles.biometricSection}>
              <View style={styles.avatarWrap}>
                <PulseRing />
                <Avatar uri={biometricPhoto} name={user?.name} size="xl" style={styles.avatarRing} />
              </View>
              <Text style={styles.biometricTitle}>Biometric Identity Linked</Text>
              <Text style={styles.biometricSubtitle}>
                No barcode needed. Simply walk to the scanner.
              </Text>
            </View>
          ) : (
            <View style={styles.biometricSection}>
              {hasQr ? (
                <Image source={{ uri: ticket.qrCode }} style={styles.qrImage} resizeMode="contain" />
              ) : (
                <View style={styles.qrPlaceholder}>
                  <QrCode size={40} color={colors.textPublic.muted} strokeWidth={1.5} />
                </View>
              )}
              <Text style={styles.qrRef}>{ticket.reference.slice(-8).toUpperCase()}</Text>
            </View>
          )}
        </View>

        {/* Trust / privacy card */}
        {FEATURES.faceVerification && (
          <View style={styles.trustCard}>
            <ShieldCheck size={22} color={colors.brand.DEFAULT} strokeWidth={2} />
            <View style={styles.trustTextWrap}>
              <Text style={styles.trustTitle}>Zero-Contact Face Entry</Text>
              <Text style={styles.trustBody}>
                ComfyTag uses secure, encrypted facial mapping to grant you entry. Your
                data never leaves the local scanner device and is purged 24 hours after
                the event.{' '}
                <Text style={styles.trustEmphasis}>100% Privacy Guaranteed.</Text>
              </Text>
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsWrap}>
          {ticket.status === 'active' && !isCheckedIn && FEATURES.faceVerification && (
            <AnimatedPressable
              onPress={() => navigation.navigate('FaceCheckIn', { ticketId: ticket._id })}
              style={styles.primaryAction}
              hapticStyle="medium"
            >
              <ScanFace size={20} color={colors.textPublic.onBrand} strokeWidth={2} />
              <Text style={styles.primaryActionText}>Use Face Check-in</Text>
            </AnimatedPressable>
          )}

          <View style={styles.secondaryActionsRow}>
            {canTransfer && (
              <AnimatedPressable
                onPress={() =>
                  navigation.navigate('TransferTicket', {
                    ticketId: ticket._id,
                    eventName: ticket.eventname,
                    ticketType: ticket.type,
                  })
                }
                style={styles.secondaryAction}
                hapticStyle="light"
              >
                <Send size={18} color={colors.textPublic.primary} strokeWidth={2} />
                <Text style={styles.secondaryActionText}>Transfer</Text>
              </AnimatedPressable>
            )}
            <AnimatedPressable onPress={handleShare} style={styles.secondaryAction} hapticStyle="light">
              <Share2 size={18} color={colors.textPublic.primary} strokeWidth={2} />
              <Text style={styles.secondaryActionText}>Share</Text>
            </AnimatedPressable>
          </View>
        </View>

        {/* Arrival directions */}
        {hasVenue && (
          <View style={styles.directionsSection}>
            <View style={styles.directionsHeaderRow}>
              <Text style={styles.directionsHeading}>Arrival Directions</Text>
              <AnimatedPressable onPress={handleGetDirections} hapticStyle="light">
                <Text style={styles.openMapsText}>Open Maps</Text>
              </AnimatedPressable>
            </View>
            <AnimatedPressable
              onPress={handleGetDirections}
              style={styles.mapPlaceholder}
              hapticStyle="light"
              scaleDown={0.98}
            >
              {!mapImageError && (
                <Image
                  source={{ uri: mapImageUrl }}
                  style={styles.mapImage}
                  resizeMode="cover"
                  onError={() => setMapImageError(true)}
                />
              )}
              <View style={styles.mapPin}>
                <MapPin size={22} color="#FFFFFF" strokeWidth={2} />
              </View>
            </AnimatedPressable>
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

  // ── Loading / error ───────────────────────────────────────────────────────
  centeredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: sp[4],
  },
  errorText: {
    fontSize: fs.base,
    fontWeight: '600',
    color: colors.textPublic.primary,
    textAlign: 'center',
  },
  retryPressable: {
    paddingHorizontal: sp[6],
    paddingVertical: sp[3],
  },
  retryText: {
    fontSize: fs.sm,
    fontWeight: '600',
    color: colors.brand.DEFAULT,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sp[4],
    paddingTop: sp[2],
    paddingBottom: sp[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.public.border,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -sp[2],
  },
  headerBrand: {
    fontSize: fs.lg,
    fontWeight: '800',
    color: colors.brand.DEFAULT,
    letterSpacing: -0.3,
  },
  headerSpacer: {
    width: 44,
  },

  // ── Scroll ────────────────────────────────────────────────────────────────
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: sp[4],
    paddingTop: sp[6],
  },

  // ── Status section ───────────────────────────────────────────────────────
  statusSection: {
    alignItems: 'center',
    marginBottom: sp[6],
    gap: sp[2],
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp[1],
    borderRadius: rd.full,
    paddingVertical: sp[2],
    paddingHorizontal: sp[4],
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  statusHeadline: {
    fontSize: fs['2xl'],
    fontWeight: '800',
    color: colors.textPublic.primary,
  },
  statusSubtitle: {
    fontSize: fs.sm,
    color: colors.textPublic.secondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },

  // ── Ticket card ───────────────────────────────────────────────────────────
  ticketCard: {
    backgroundColor: colors.public.surface,
    borderRadius: rd.xl,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.public.border,
    marginBottom: sp[5],
  },
  imageSection: {
    height: 190,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  imageFallback: {
    backgroundColor: colors.brand.DEFAULT,
  },
  imageTextWrap: {
    position: 'absolute',
    left: sp[4],
    bottom: sp[4],
    right: sp[12] + sp[8],
  },
  eventEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.brand.light,
    marginBottom: sp[1],
  },
  eventName: {
    fontSize: fs.lg,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  entryBadge: {
    position: 'absolute',
    top: sp[3],
    right: sp[3],
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: rd.lg,
    paddingVertical: sp[2],
    paddingHorizontal: sp[3],
    alignItems: 'center',
    gap: 2,
  },
  entryBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.brand.DEFAULT,
    letterSpacing: 0.3,
  },

  // ── Info grid ─────────────────────────────────────────────────────────────
  infoSection: {
    padding: sp[5],
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: sp[4],
    marginBottom: sp[4],
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderBottomColor: colors.public.border,
  },
  infoRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
    marginBottom: 0,
  },
  infoCol: {
    flexShrink: 1,
    maxWidth: '60%',
  },
  infoRight: {
    alignItems: 'flex-end',
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPublic.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: sp[1],
  },
  infoValueLg: {
    fontSize: fs.lg,
    fontWeight: '700',
    color: colors.textPublic.primary,
  },
  infoValue: {
    fontSize: fs.base,
    fontWeight: '600',
    color: colors.textPublic.primary,
    textAlign: 'right',
  },

  // ── Ticket-tear notch ────────────────────────────────────────────────────
  notchRow: {
    height: 0,
  },
  notchCircle: {
    position: 'absolute',
    top: -12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.public.bg,
  },

  // ── Biometric / QR section ───────────────────────────────────────────────
  biometricSection: {
    backgroundColor: colors.public.surfaceAlt,
    paddingTop: sp[6],
    paddingBottom: sp[5],
    paddingHorizontal: sp[5],
    alignItems: 'center',
  },
  avatarWrap: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: sp[3],
  },
  pulseRing: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: colors.brand.DEFAULT,
  },
  avatarRing: {
    borderWidth: 3,
    borderColor: colors.brand.light,
  },
  biometricTitle: {
    fontSize: fs.sm,
    fontWeight: '700',
    color: colors.brand.DEFAULT,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  biometricSubtitle: {
    fontSize: fs.sm,
    color: colors.textPublic.muted,
    textAlign: 'center',
    marginTop: sp[1],
  },
  qrImage: {
    width: 160,
    height: 160,
  },
  qrPlaceholder: {
    width: 160,
    height: 160,
    borderRadius: rd.lg,
    backgroundColor: colors.public.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrRef: {
    fontSize: fs.xs,
    color: colors.textPublic.muted,
    textAlign: 'center',
    marginTop: sp[3],
    letterSpacing: 2,
    fontFamily: 'monospace',
  },

  // ── Trust card ────────────────────────────────────────────────────────────
  trustCard: {
    flexDirection: 'row',
    gap: sp[3],
    backgroundColor: colors.brand.light,
    borderRadius: rd.xl,
    padding: sp[4],
    marginBottom: sp[5],
  },
  trustTextWrap: {
    flex: 1,
    gap: sp[1],
  },
  trustTitle: {
    fontSize: fs.sm,
    fontWeight: '700',
    color: colors.textPublic.primary,
  },
  trustBody: {
    fontSize: fs.xs,
    color: colors.textPublic.secondary,
    lineHeight: 18,
  },
  trustEmphasis: {
    color: colors.brand.DEFAULT,
    fontWeight: '700',
  },

  // ── Actions ───────────────────────────────────────────────────────────────
  actionsWrap: {
    gap: sp[3],
    marginBottom: sp[6],
  },
  primaryAction: {
    flexDirection: 'row',
    height: 56,
    borderRadius: rd.lg,
    backgroundColor: colors.brand.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: sp[5],
    gap: sp[2],
  },
  primaryActionText: {
    fontSize: fs.base,
    fontWeight: '700',
    color: colors.textPublic.onBrand,
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    gap: sp[3],
  },
  secondaryAction: {
    flex: 1,
    flexDirection: 'row',
    height: 52,
    borderRadius: rd.lg,
    backgroundColor: colors.public.surface,
    borderWidth: 1,
    borderColor: colors.public.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: sp[4],
    gap: sp[2],
  },
  secondaryActionText: {
    fontSize: fs.sm,
    fontWeight: '700',
    color: colors.textPublic.primary,
  },

  // ── Arrival directions ───────────────────────────────────────────────────
  directionsSection: {
    gap: sp[3],
  },
  directionsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  directionsHeading: {
    fontSize: fs.lg,
    fontWeight: '700',
    color: colors.textPublic.primary,
  },
  openMapsText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.brand.DEFAULT,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mapPlaceholder: {
    height: 140,
    borderRadius: rd.xl,
    backgroundColor: colors.brand.light,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.public.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  mapImage: {
    ...StyleSheet.absoluteFillObject,
  },
  mapPin: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.brand.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Bottom spacer ─────────────────────────────────────────────────────────
  bottomSpacer: {
    height: sp[8],
  },
})
