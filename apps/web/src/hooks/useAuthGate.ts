import { useState } from 'react'

export type GateTrigger = 'like' | 'comment' | 'hype-link' | 'checkout'

export function useAuthGate() {
  const [gateOpen, setGateOpen] = useState(false)
  const [gateTrigger, setGateTrigger] = useState<GateTrigger>('like')

  const openGate = (trigger: GateTrigger = 'like') => {
    setGateTrigger(trigger)
    setGateOpen(true)
  }

  const closeGate = () => {
    setGateOpen(false)
  }

  return {
    gateOpen,
    gateTrigger,
    openGate,
    closeGate,
  }
}
