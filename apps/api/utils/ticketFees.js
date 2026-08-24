// Mirrors packages/utils's calculateTicketCharge — apps/api is plain JS with
// no build step for that TS package, so the formula is duplicated here. Keep
// these in sync; there are matching tests on both sides.
//
// Fee model: the buyer pays the entire fee — 4.5% of the order subtotal,
// always, plus ₦100 more if the subtotal is >= ₦2,500. No cap. The organizer
// pays nothing; they receive the full ticket price.
export const calculateTicketCharge = (tierPrice, quantity) => {
  const subtotal = tierPrice * quantity
  if (subtotal === 0) {
    return { subtotal: 0, buyerFee: 0, organizerFee: 0, totalCharge: 0, organizerNet: 0 }
  }

  const flatFeeApplies = subtotal >= 2500
  const buyerFee = Math.round(subtotal * 0.045) + (flatFeeApplies ? 100 : 0)
  const organizerFee = 0

  return {
    subtotal,
    buyerFee,
    organizerFee,
    totalCharge: subtotal + buyerFee,
    organizerNet: subtotal - organizerFee,
  }
}
