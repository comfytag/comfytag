import React from 'react'
import { View, Text, StyleSheet, ViewStyle, Image } from 'react-native'
import { colors, sp, rd, fs } from '@comfytag/ui/tokens'
import { formatDate, formatTime } from '../../lib/utils'
import type { Ticket } from '@comfytag/types'

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface DigitalStubProps {
  ticket: Ticket
  showBarcode?: boolean
  style?: ViewStyle
}

// ─── Barcode strip (decorative) ───────────────────────────────────────────────

function BarcodeStrip({ code }: { code: string }) {
  return (
    <View style={styles.barcodeContainer}>
      <Text style={styles.barcodeText} numberOfLines={1}>
        {code.replace(/-/g, ' ')}
      </Text>
      <View style={styles.barcodeLine} />
    </View>
  )
}

// ─── Divider with circles ─────────────────────────────────────────────────────

function TearLine() {
  return (
    <View style={styles.tearRow}>
      <View style={styles.tearCircleLeft} />
      <View style={styles.tearDash} />
      <View style={styles.tearCircleRight} />
    </View>
  )
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function DigitalStub({ ticket, showBarcode = true, style }: DigitalStubProps) {
  const eventDate = ticket.eventDate ?? ticket.date
  const eventTime = ticket.eventTime
  const venue = ticket.eventVenue

  return (
    <View style={[styles.stub, style]}>
      {/* Top section: event info */}
      <View style={styles.topSection}>
        <Text style={styles.eventName} numberOfLines={2}>
          {ticket.eventname}
        </Text>

        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>{formatDate(eventDate)}</Text>
          </View>
          {eventTime !== undefined && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Time</Text>
              <Text style={styles.detailValue}>{formatTime(eventTime)}</Text>
            </View>
          )}
          {venue !== undefined && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Venue</Text>
              <Text style={styles.detailValue} numberOfLines={1}>
                {venue}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.tierRow}>
          <View style={styles.tierBadge}>
            <Text style={styles.tierText}>{ticket.type}</Text>
          </View>
          <Text style={styles.ticketName}>{ticket.name}</Text>
        </View>
      </View>

      {/* Tear line */}
      <TearLine />

      {/* Bottom section: QR or barcode */}
      {showBarcode && (
        <View style={styles.bottomSection}>
          <Text style={styles.refLabel}>Ticket Reference</Text>
          <BarcodeStrip code={ticket.reference} />
          <Text style={styles.refCode}>{ticket.reference}</Text>
        </View>
      )}
    </View>
  )
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  stub: {
    backgroundColor: colors.public.surface,
    borderRadius: rd.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.public.border,
  },

  // ── Top ──────────────────────────────────────────────────────────────────
  topSection: {
    padding: sp[5],
  },
  eventName: {
    fontSize: fs['2xl'],
    fontWeight: '800',
    color: colors.textPublic.primary,
    marginBottom: sp[4],
    lineHeight: 30,
    textTransform: 'capitalize',
  },
  detailRow: {
    flexDirection: 'row',
    gap: sp[4],
    marginBottom: sp[4],
    flexWrap: 'wrap',
  },
  detailItem: {
    minWidth: 80,
  },
  detailLabel: {
    fontSize: fs.xs,
    color: colors.textPublic.muted,
    fontWeight: '500',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: fs.sm,
    color: colors.textPublic.primary,
    fontWeight: '600',
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp[3],
  },
  tierBadge: {
    backgroundColor: colors.brand.light,
    borderRadius: rd.full,
    paddingHorizontal: sp[3],
    paddingVertical: 4,
  },
  tierText: {
    fontSize: fs.xs,
    color: colors.brand.DEFAULT,
    fontWeight: '700',
  },
  ticketName: {
    fontSize: fs.sm,
    color: colors.textPublic.secondary,
  },

  // ── Tear line ─────────────────────────────────────────────────────────────
  tearRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tearCircleLeft: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.public.bg,
    marginLeft: -12,
  },
  tearCircleRight: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.public.bg,
    marginRight: -12,
  },
  tearDash: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderColor: colors.public.border,
    borderStyle: 'dashed',
    marginHorizontal: sp[2],
  },

  // ── Bottom ────────────────────────────────────────────────────────────────
  bottomSection: {
    padding: sp[5],
    alignItems: 'center',
  },
  refLabel: {
    fontSize: fs.xs,
    color: colors.textPublic.muted,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: sp[3],
  },
  barcodeContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: sp[2],
  },
  barcodeText: {
    fontSize: 11,
    color: colors.textPublic.muted,
    letterSpacing: 4,
    fontFamily: 'monospace',
  },
  barcodeLine: {
    width: '90%',
    height: 48,
    backgroundColor: colors.public.surfaceAlt,
    borderRadius: rd.sm,
    marginTop: sp[2],
  },
  refCode: {
    fontSize: fs.xs,
    color: colors.textPublic.muted,
    fontFamily: 'monospace',
    letterSpacing: 2,
  },
})
