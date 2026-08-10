import type { TicketTier } from '@comfytag/types'
import { formatNaira } from '@comfytag/utils'

/**
 * Formats the lowest ticket tier price as a display label ("Free" when the
 * cheapest tier is 0 or there are no tiers). Shared across every card/screen
 * that shows an event's price so the "min price or Free" rule lives in one
 * place instead of being reimplemented per component.
 */
export function getEventPriceLabel(tiers: TicketTier[]): string {
  if (tiers.length === 0) return 'Free'
  const min = Math.min(...tiers.map((t) => t.price))
  return min === 0 ? 'Free' : formatNaira(min)
}
