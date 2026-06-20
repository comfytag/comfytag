'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import { useCheckin, useEventCheckinStats, useEventById } from '@/hooks'
import { attendeeKeys } from '@/hooks/queryKeys'
import { api } from '@/lib/api'
import { CameraScanner } from './CameraScanner'

interface GateAttendee {
  _id: string
  name: string
  email: string
  reference: string
  type: string
  numOfTicket: number
  checkedIn?: boolean
  checkedInAt?: string
  checkedInMethod?: 'face' | 'qr' | 'manual' | null
}

interface ToastState {
  type: 'success' | 'error'
  message: string
}

interface GateConsoleClientProps {
  eventId: string
}

export function GateConsoleClient({ eventId }: GateConsoleClientProps) {
  const { data: session } = useSession()
  const token = session?.user?.token as string | undefined

  const { data: event } = useEventById(eventId)
  const { data: stats } = useEventCheckinStats(eventId, token)
  const checkin = useCheckin()

  const [activeMode, setActiveMode] = useState<'roster' | 'qr' | 'face'>('roster')
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState<ToastState | null>(null)

  const { data: attendees = [] } = useQuery<GateAttendee[]>({
    queryKey: attendeeKeys.list(eventId),
    queryFn: () =>
      api.get(`/audience/event/${eventId}?limit=500`).then((r) => {
        const body = r.data
        return Array.isArray(body) ? body : (body?.data ?? [])
      }),
    refetchInterval: 15_000,
    enabled: !!token && !!eventId,
  })

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  const totalSold = stats ? (stats.checkedIn ?? 0) + (stats.remaining ?? 0) : 0
  const checkedInCount = stats?.checkedIn ?? 0
  const occupancy = totalSold > 0 ? Math.round((checkedInCount / totalSold) * 100) : 0

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return attendees
    return attendees.filter(
      (a) =>
        a.name?.toLowerCase().includes(q) ||
        a.email?.toLowerCase().includes(q) ||
        a.reference?.toLowerCase().includes(q),
    )
  }, [attendees, search])

  function handleQrScan(reference: string) {
    const attendee = attendees.find(
      (a) => a.reference?.toUpperCase() === reference,
    )
    if (!attendee) {
      setToast({ type: 'error', message: 'Ticket not found' })
      return
    }
    if (attendee.checkedIn) {
      setToast({ type: 'error', message: `${attendee.name} already checked in` })
      return
    }
    handleCheckin(attendee._id)
  }

  function handleCheckin(attendeeId: string) {
    checkin.mutate(
      { attendeeId, eventId, payload: { checkedIn: true } },
      {
        onSuccess: () => setToast({ type: 'success', message: 'Check-in confirmed' }),
        onError: () => setToast({ type: 'error', message: 'Check-in failed — retry' }),
      },
    )
  }

  const pendingCheckinId =
    checkin.isPending ? (checkin.variables as { attendeeId: string } | undefined)?.attendeeId : null

  return (
    <div className="w-full min-h-screen bg-slate-50 text-zinc-900 font-sans pt-4 pb-24 px-4 sm:px-6 md:px-8">

      {/* Toast HUD — fixed outside the console frame */}
      {toast && (
        toast.type === 'success' ? (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-emerald-500 text-zinc-950 border-2 border-emerald-300 rounded-2xl px-8 py-4 shadow-2xl z-50 text-center font-bold animate-in fade-in slide-in-from-top-4 duration-200">
            ✓ {toast.message}
          </div>
        ) : (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-red-500 text-white border-2 border-red-400 rounded-2xl px-8 py-4 shadow-2xl z-50 text-center font-bold animate-in fade-in slide-in-from-top-4 duration-200">
            ✗ {toast.message}
          </div>
        )
      )}

      {/* ── Light Document Console Frame ── */}
      <div className="max-w-5xl mx-auto bg-white border border-zinc-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-4xl p-6 sm:p-8 space-y-8 mt-6">

        {/* Page header */}
        <div>
          <p className="text-zinc-400 text-xs font-mono tracking-widest uppercase mb-1">
            Gate Console · Live
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            {event?.name ?? '—'}
          </h1>
        </div>

        {/* Stats strip + progress bar — grouped so space-y-8 treats them as one block */}
        <div className="space-y-4">

          {/* Live Attendance Strip */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-zinc-50/60 border border-zinc-100 rounded-3xl p-5 text-center flex flex-col justify-center items-center transition-all hover:border-zinc-200">
              <p className="text-4xl font-bold tracking-tight text-emerald-500 tabular-nums">{checkedInCount}</p>
              <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-semibold mt-2">Checked In</p>
            </div>
            <div className="bg-zinc-50/60 border border-zinc-100 rounded-3xl p-5 text-center flex flex-col justify-center items-center transition-all hover:border-zinc-200">
              <p className="text-4xl font-bold tracking-tight text-zinc-900 tabular-nums">{totalSold}</p>
              <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-semibold mt-2">Total Sold</p>
            </div>
            <div className="bg-zinc-50/60 border border-zinc-100 rounded-3xl p-5 text-center flex flex-col justify-center items-center transition-all hover:border-zinc-200">
              <p className="text-4xl font-bold tracking-tight text-zinc-900 tabular-nums">{occupancy}%</p>
              <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-semibold mt-2">Occupancy</p>
            </div>
          </div>

          {/* Progress bar */}
          <div>
            <div className="h-3 w-full bg-zinc-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${occupancy > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-300'}`}
                style={{ width: `${Math.min(occupancy, 100)}%` }}
              />
            </div>
            <p className="text-zinc-400 text-xs mt-2 font-mono">
              {checkedInCount} of {totalSold} attendees checked in
            </p>
          </div>

        </div>

        {/* ── Verification Mode Switcher — pill segmented control ── */}
        <div className="flex bg-zinc-100 p-1.5 border border-zinc-200/60 rounded-full max-w-md mx-auto my-8 gap-1 shadow-xs">
          <button
            onClick={() => setActiveMode('qr')}
            className={`rounded-full transition-all duration-200 font-semibold py-2.5 px-4 flex items-center justify-center gap-2 flex-1 min-w-0 ${
              activeMode === 'qr'
                ? 'bg-white border border-zinc-200/40 text-zinc-900 font-bold shadow-xs'
                : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200/40'
            }`}
          >
            <span className="whitespace-nowrap text-[11px] sm:text-xs tracking-tight overflow-hidden text-ellipsis">
              📷 QR Scan
            </span>
          </button>

          <button
            onClick={() => setActiveMode('roster')}
            className={`rounded-full transition-all duration-200 font-semibold py-2.5 px-4 flex items-center justify-center gap-2 flex-1 min-w-0 ${
              activeMode === 'roster'
                ? 'bg-white border border-zinc-200/40 text-zinc-900 font-bold shadow-xs'
                : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200/40'
            }`}
          >
            <span className="whitespace-nowrap text-[11px] sm:text-xs tracking-tight overflow-hidden text-ellipsis">
              📋 Roster / ID
            </span>
          </button>

          <button
            onClick={() => setActiveMode('face')}
            className={`rounded-full transition-all duration-200 font-semibold py-2.5 px-4 flex items-center justify-center gap-1.5 flex-1 min-w-0 ${
              activeMode === 'face'
                ? 'bg-white border border-zinc-200/40 text-zinc-900 font-bold shadow-xs'
                : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200/40'
            }`}
          >
            <span className="whitespace-nowrap text-[11px] sm:text-xs tracking-tight overflow-hidden text-ellipsis">
              ✨ Face ID
            </span>
            <span className="shrink-0 text-[9px] px-1 py-0.5 rounded bg-violet-500/20 text-violet-500 font-medium uppercase tracking-wider">
              Soon
            </span>
          </button>
        </div>

        {/* ── QR Scan mode — camera housing ── */}
        {activeMode === 'qr' && (
          <div className="w-full max-w-xl mx-auto overflow-hidden rounded-4xl border-[6px] border-zinc-100 shadow-inner bg-zinc-950 relative aspect-3/4 sm:aspect-square">
            <CameraScanner
              onScan={handleQrScan}
              isProcessing={checkin.isPending}
            />
          </div>
        )}

        {/* ── Roster / ID mode — search + attendee list ── */}
        {activeMode === 'roster' && (
          <div className="space-y-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, or ticket ref…"
              className="w-full bg-zinc-50 border border-zinc-200 rounded-3xl px-6 py-4 text-zinc-900 font-mono focus:bg-white focus:border-violet-500 transition-all placeholder:text-zinc-400 focus:outline-none focus-visible:outline-none"
              autoComplete="off"
              spellCheck={false}
            />

            <p className="text-zinc-400 text-xs font-mono">
              {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
              {search.trim() ? ` for "${search.trim()}"` : ''}
            </p>

            <div className="flex flex-col gap-2 max-h-[58vh] overflow-y-auto pr-1">
              {filtered.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-zinc-400 font-mono text-sm">
                    {search.trim() ? 'No matches found' : 'No attendees loaded'}
                  </p>
                </div>
              ) : (
                filtered.map((attendee) => (
                  <div
                    key={attendee._id}
                    className="bg-white border border-zinc-100 rounded-3xl p-5 flex items-center justify-between shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:border-zinc-200 hover:bg-zinc-50/40 group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-zinc-900 font-bold tracking-tight text-sm truncate">{attendee.name}</p>
                      <p className="text-xs font-medium text-zinc-500 truncate mt-1">
                        {attendee.email}
                      </p>
                      <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-semibold mt-0.5">
                        {attendee.reference}
                      </p>
                      {attendee.type && (
                        <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-semibold mt-0.5">
                          {attendee.type}
                        </p>
                      )}
                    </div>

                    <div className="shrink-0 ml-4">
                      {attendee.checkedIn ? (
                        <span className="bg-zinc-100 text-zinc-500 font-bold py-2 px-5 rounded-full text-xs">
                          ✓ IN
                        </span>
                      ) : (
                        <button
                          onClick={() => handleCheckin(attendee._id)}
                          disabled={pendingCheckinId === attendee._id}
                          className="bg-emerald-500 text-white font-bold py-2 px-6 rounded-full shadow-sm active:scale-95 transition-all text-xs disabled:opacity-50 disabled:active:scale-100"
                        >
                          {pendingCheckinId === attendee._id ? '…' : 'Check In'}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── Face ID mode — coming soon teaser ── */}
        {activeMode === 'face' && (
          <div className="w-full border border-violet-200/60 bg-linear-to-br from-violet-50/40 to-white rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-3 shadow-sm">
            <p className="text-5xl">✨</p>
            <p className="text-zinc-900 font-bold text-xl tracking-tight">
              Your face is your ticket.™
            </p>
            <p className="text-zinc-400 text-sm leading-relaxed max-w-xs">
              ComfyTag biometric instant verification is currently being optimized for high-throughput gate lines.
            </p>
          </div>
        )}

      </div>
    </div>
  )
}
