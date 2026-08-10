import React, { useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { ChevronUp } from 'lucide-react-native'
import { colors, sp, fs } from '@comfytag/ui/tokens'
import { AnimatedPressable } from '../ui/AnimatedPressable'
import { Sheet } from '../ui/Sheet'
import { DigitalStub } from '../ui/DigitalStub'
import { useMyTickets } from '../../hooks'
import { formatTime, isToday, isUpcoming, timeUntil } from '../../lib/utils'
import type { Ticket } from '@comfytag/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getNextUpcomingTicket(tickets: Ticket[]): Ticket | null {
  const upcoming = tickets
    .filter((t) => t.status === 'active' && isUpcoming(t.eventDate ?? t.date))
    .sort(
      (a, b) =>
        new Date(a.eventDate ?? a.date).getTime() -
        new Date(b.eventDate ?? b.date).getTime()
    )
  return upcoming[0] ?? null
}

function subtitleFor(ticket: Ticket): string {
  const eventDate = ticket.eventDate ?? ticket.date
  const parts: string[] = []
  if (ticket.eventVenue !== undefined) parts.push(ticket.eventVenue)
  parts.push(isToday(eventDate) ? 'Today' : timeUntil(eventDate))
  if (ticket.eventTime !== undefined) parts.push(formatTime(ticket.eventTime))
  return parts.join(' • ')
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function MiniBar() {
  const { data: tickets } = useMyTickets()
  const [expanded, setExpanded] = useState(false)

  const nextTicket = getNextUpcomingTicket(tickets ?? [])

  if (nextTicket === null) return null

  return (
    <>
      <AnimatedPressable
        onPress={() => setExpanded(true)}
        hapticStyle="light"
        style={styles.bar}
      >
        <View style={styles.textGroup}>
          <Text style={styles.eventName} numberOfLines={1}>
            {nextTicket.eventname}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitleFor(nextTicket)}
          </Text>
        </View>
        <ChevronUp size={20} color={colors.textPublic.muted} strokeWidth={2} />
      </AnimatedPressable>

      {/* TODO(gorhom-migration): swap for @gorhom/bottom-sheet's BottomSheetModal
          once react-native-reanimated is installed, for native drag-to-dismiss. */}
      <Sheet
        visible={expanded}
        onClose={() => setExpanded(false)}
        title="Your Ticket"
        snapHeight="lg"
      >
        <DigitalStub ticket={nextTicket} />
        <Text style={styles.hint}>
          Present this at the gate, or check in with your face — no phone required.
        </Text>
      </Sheet>
    </>
  )
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56,
    paddingHorizontal: sp[4],
    paddingVertical: sp[2],
    backgroundColor: colors.public.surface,
    borderTopWidth: 1,
    borderTopColor: colors.public.border,
  },
  textGroup: {
    flex: 1,
    marginRight: sp[3],
  },
  eventName: {
    fontSize: fs.sm,
    fontWeight: '700',
    color: colors.textPublic.primary,
  },
  subtitle: {
    fontSize: fs.xs,
    color: colors.textPublic.muted,
    marginTop: 2,
  },
  hint: {
    fontSize: fs.sm,
    color: colors.textPublic.muted,
    textAlign: 'center',
    marginTop: sp[4],
  },
})
