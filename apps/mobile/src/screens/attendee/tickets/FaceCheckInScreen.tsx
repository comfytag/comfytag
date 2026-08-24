import React, { useState } from 'react'
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { StackScreenProps } from '@react-navigation/stack'
import { Check, X } from 'lucide-react-native'
import { colors, sp, rd, fs } from '@comfytag/ui/tokens'
import { AnimatedPressable } from '../../../components/ui/AnimatedPressable'
import { enrollFace, checkLiveness } from '../../../lib/faceSDK'
import { post } from '../../../lib/api'
import { useTicketDetail } from '../../../hooks'
import type { TicketsStackParamList } from '../../../navigation/types'

type Props = StackScreenProps<TicketsStackParamList, 'FaceCheckIn'>

// Real shape of POST /face/verify (apps/api/controllers/face.js) — this is the
// same 1:N endpoint the venue's staff scanner calls. Calling it here genuinely
// checks the ticket in server-side (status → 'used'), it is not a preview.
interface VerifyFaceResponse {
  success: boolean
  message: string
  attendeeName?: string
  ticketType?: string
}

export default function FaceCheckInScreen({ route, navigation }: Props) {
  const { ticketId } = route.params
  const { data: ticket, isLoading: loadingTicket } = useTicketDetail(ticketId)
  const [state, setState] = useState<'idle'|'liveness'|'capturing'|'verifying'|'matched'|'noMatch'|'error'>('idle')
  const [hint, setHint] = useState<string>('')

  const handleStart = async () => {
    if (!ticket) return
    try {
      setState('liveness')
      setHint('Checking liveness...')
      const live = await checkLiveness()
      if (!live.isLive) {
        setState('noMatch')
        setHint('Liveness failed. Try again.')
        return
      }

      setState('capturing')
      setHint('Capturing face...')
      const capture = await enrollFace()
      if (!capture.success || !capture.faceTemplate) {
        setState('error')
        setHint(capture.error ?? 'Could not capture face. Try again.')
        return
      }

      setState('verifying')
      setHint('Verifying...')
      const res = await post<VerifyFaceResponse>('/face/verify', {
        faceTemplate: capture.faceTemplate,
        eventId: ticket.event_id,
      })

      if (res.data.success) {
        setState('matched')
        setHint(
          res.data.attendeeName
            ? `Verified — welcome, ${res.data.attendeeName.split(' ')[0]}!`
            : 'Verified — enjoy the event!'
        )
      } else {
        setState('noMatch')
        setHint(res.data.message || 'Face not recognized. Try again or visit support.')
      }
    } catch (err: unknown) {
      setState('error')
      setHint(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Face Check-in</Text>
        <Text style={styles.subtitle}>{ticket?.eventname ?? `Ticket · ${ticketId}`}</Text>
      </View>

      <View style={styles.body}>
        {state === 'idle' && (
          <View style={styles.center}>
            <Text style={styles.instruction}>Place your face inside the frame and tap Start.</Text>
            <Text style={styles.warning}>
              This checks you in for entry — only do this once you've arrived at the venue.
            </Text>
            <AnimatedPressable
              style={[styles.primaryBtn, (loadingTicket || !ticket) && styles.primaryBtnDisabled]}
              onPress={() => void handleStart()}
              hapticStyle="medium"
              disabled={loadingTicket || !ticket}
            >
              <Text style={styles.primaryBtnText}>
                {loadingTicket ? 'Loading ticket…' : 'Start face check-in'}
              </Text>
            </AnimatedPressable>
          </View>
        )}

        {state === 'liveness' || state === 'capturing' || state === 'verifying' ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.brand.DEFAULT} />
            <Text style={styles.hint}>{hint}</Text>
          </View>
        ) : null}

        {state === 'matched' && (
          <View style={styles.center}>
            <Check size={64} color={colors.success.DEFAULT} />
            <Text style={styles.successText}>{hint}</Text>
            <AnimatedPressable style={styles.primaryBtn} onPress={() => navigation.pop()} hapticStyle="light">
              <Text style={styles.primaryBtnText}>Done</Text>
            </AnimatedPressable>
          </View>
        )}

        {state === 'noMatch' && (
          <View style={styles.center}>
            <X size={64} color={colors.error.DEFAULT} />
            <Text style={styles.errorText}>{hint}</Text>
            <AnimatedPressable style={styles.secondaryBtn} onPress={() => setState('idle')} hapticStyle="light">
              <Text style={styles.secondaryBtnText}>Try again</Text>
            </AnimatedPressable>
          </View>
        )}

        {state === 'error' && (
          <View style={styles.center}>
            <Text style={styles.errorText}>{hint}</Text>
            <AnimatedPressable style={styles.secondaryBtn} onPress={() => setState('idle')} hapticStyle="light">
              <Text style={styles.secondaryBtnText}>Back</Text>
            </AnimatedPressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.public.bg },
  header: { paddingHorizontal: sp[5], paddingTop: sp[4], paddingBottom: sp[3] },
  title: { fontSize: fs.xl, fontWeight: '700', color: colors.textPublic.primary },
  subtitle: { fontSize: fs.sm, color: colors.textPublic.muted, marginTop: 4 },
  body: { flex: 1, paddingHorizontal: sp[5], justifyContent: 'center' },
  center: { alignItems: 'center', gap: sp[4] },
  instruction: { fontSize: fs.base, color: colors.textPublic.secondary, textAlign: 'center' },
  warning: { fontSize: fs.xs, color: colors.textPublic.muted, textAlign: 'center', marginTop: -sp[2] },
  hint: { marginTop: sp[3], color: colors.textPublic.muted },
  successText: { marginTop: sp[3], color: colors.success.DEFAULT, fontWeight: '700' },
  errorText: { marginTop: sp[3], color: colors.error.DEFAULT, fontWeight: '600', textAlign: 'center' },
  primaryBtn: { marginTop: sp[3], backgroundColor: colors.brand.DEFAULT, paddingVertical: 12, paddingHorizontal: 20, borderRadius: rd.lg },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
  secondaryBtn: { marginTop: sp[2], borderWidth: 1, borderColor: colors.public.border, paddingVertical: 10, paddingHorizontal: 18, borderRadius: rd.lg },
  secondaryBtnText: { color: colors.textPublic.primary, fontWeight: '600' },
})
