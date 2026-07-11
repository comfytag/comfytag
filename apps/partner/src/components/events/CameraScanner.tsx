'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Camera, AlertCircle, Loader2 } from 'lucide-react'
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library'

interface CameraScannerProps {
  onScan: (reference: string) => void
  isProcessing: boolean
}

type CameraState = 'idle' | 'starting' | 'scanning' | 'error'

// 720p rear-camera — prevents mobile threads from choking on 4K frame conversions
const CAMERA_CONSTRAINTS: MediaStreamConstraints = {
  video: {
    facingMode: { ideal: 'environment' },
    width: { ideal: 1280 },
    height: { ideal: 720 },
  },
}

export function CameraScanner({ onScan, isProcessing }: CameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)
  // We own the camera stream lifecycle — not ZXing
  const streamRef = useRef<MediaStream | null>(null)
  const lastScannedRef = useRef<{ value: string; at: number }>({ value: '', at: 0 })

  const [cameraState, setCameraState] = useState<CameraState>('idle')
  const [error, setError] = useState<string>('')
  // Scan lock: blocks re-entry for 2.5 s after every successful decode
  const [isLocked, setIsLocked] = useState(false)

  // Full teardown on unmount
  useEffect(() => {
    return () => {
      readerRef.current?.reset()
      readerRef.current = null
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
      if (videoRef.current) videoRef.current.srcObject = null
    }
  }, [])

  const onDecoded = useCallback(
    (rawText: string) => {
      // Scan lock gate — blocks duplicate API calls during the processing window
      if (isLocked || isProcessing) return

      // Deduplicate same reference within 3 s
      const now = Date.now()
      if (rawText === lastScannedRef.current.value && now - lastScannedRef.current.at < 3000) return
      lastScannedRef.current = { value: rawText, at: now }

      // Haptic pulse — physical confirmation through the bouncer's hands
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([100, 50, 100])
      }

      // Lock immediately; unlock 2.5 s post-decode regardless of API latency
      setIsLocked(true)
      onScan(rawText.trim().toUpperCase())
      setTimeout(() => setIsLocked(false), 2500)
    },
    [isLocked, isProcessing, onScan],
  )

  function handleError(err: unknown) {
    const msg = (err instanceof Error ? err.message : String(err)).toLowerCase()

    if (/notallowed|permission|denied|not allowed/.test(msg)) {
      setError('Camera access denied. Enable camera permission in browser settings.')
    } else if (/notfound|no camera|no device|overconstrained/.test(msg)) {
      setError(
        'Camera not available. Ensure:\n1. Camera is connected and working\n2. No other app is using it\n3. Camera permissions are granted\n4. Use Manual mode as fallback',
      )
    } else if (
      location.protocol !== 'https:' &&
      location.hostname !== 'localhost' &&
      location.hostname !== '127.0.0.1'
    ) {
      setError('Camera scanning requires HTTPS (localhost is exempt).')
    } else if (/notreadable|insecure|browser|unsupported/.test(msg)) {
      setError('Browser does not support camera access. Try Chrome, Edge, or Firefox.')
    } else {
      setError('Camera error. Try refreshing or use Manual mode.')
    }
    setCameraState('error')
  }

  async function startCamera() {
    setCameraState('starting')
    setError('')
    setIsLocked(false)

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Your browser does not support camera access. Please use Chrome, Edge, or Firefox.')
      }

      // Step 1 — Acquire 720p stream. We own this, not ZXing.
      const stream = await navigator.mediaDevices.getUserMedia(CAMERA_CONSTRAINTS)
      streamRef.current = stream

      // Step 2 — Mount stream to the persistent video element BEFORE showing it.
      // srcObject must be set while the element is hidden so iOS Safari's compositor
      // has a frame ready the moment it becomes visible (prevents black-flash).
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play().catch(console.error)
      }

      // Step 3 — Show the viewfinder. Stream is already live.
      setCameraState('scanning')

      // Step 4 — Hand the live stream to ZXing for frame decoding only.
      // decodeFromStream re-assigns srcObject (same object, harmless) and starts
      // the interval-based decode loop without calling getUserMedia again.
      const reader = new BrowserMultiFormatReader()
      readerRef.current = reader

      reader
        .decodeFromStream(stream, videoRef.current!, (result, err) => {
          if (err instanceof NotFoundException) return  // no QR in frame — expected noise
          if (err) { handleError(err); return }
          if (result) { onDecoded(result.getText()) }
        })
        .catch(handleError)
    } catch (err) {
      handleError(err)
    }
  }

  function stopCamera() {
    readerRef.current?.reset()
    readerRef.current = null
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setIsLocked(false)
    setCameraState('idle')
  }

  const isScanning = cameraState === 'scanning'

  return (
    <div>
      {/*
        THE VIDEO ELEMENT IS ALWAYS IN THE DOM — never inside a conditional branch.

        Root cause of the black-screen bug:
        The previous implementation rendered <video ref={videoRef}> inside each
        state branch (idle / starting / error / scanning). On every state transition
        React unmounts the old element and mounts a new one, reassigning videoRef.current
        to the new node. ZXing's stream was still wired to the old (removed) element.
        The on-screen video frame never received srcObject → black screen.

        Fix: one persistent <video>. CSS controls visibility.
        videoRef.current always points to the same DOM node, so both our manual
        srcObject assignment and ZXing's decodeFromStream binding hit the correct element.
      */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '1',
          maxWidth: '360px',
          margin: '0 auto 20px',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          background: '#000',
          display: isScanning ? 'block' : 'none',
        }}
      >
        <style>{`
          @keyframes ct-scanLine {
            0%   { top: 0%; }
            100% { top: 100%; }
          }
          .ct-scan-line {
            position: absolute;
            width: 100%;
            height: 2px;
            background: #4ade80;
            animation: ct-scanLine 1.8s linear infinite;
            z-index: 10;
            opacity: 0.9;
          }
          .ct-scan-corner {
            position: absolute;
            width: 32px;
            height: 32px;
            border-color: #4ade80;
            border-style: solid;
          }
          .ct-tl { top: 0; left: 0; border-width: 3px 0 0 3px; }
          .ct-tr { top: 0; right: 0; border-width: 3px 3px 0 0; }
          .ct-bl { bottom: 0; left: 0; border-width: 0 0 3px 3px; }
          .ct-br { bottom: 0; right: 0; border-width: 0 3px 3px 0; }
        `}</style>

        {/*
          autoPlay + playsInline + muted are required to unlock hardware-accelerated
          canvas projection on iOS Safari and Alpine WebViews. Without playsInline,
          Safari routes the stream through a fullscreen native player (no srcObject feed).
          Without muted, autoplay is blocked by browser autoplay policy.
        */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />

        <div className="ct-scan-corner ct-tl" />
        <div className="ct-scan-corner ct-tr" />
        <div className="ct-scan-corner ct-bl" />
        <div className="ct-scan-corner ct-br" />
        <div className="ct-scan-line" />

        {/* Processing dim while scan lock is active */}
        {(isLocked || isProcessing) && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 20,
            }}
          >
            <div
              style={{
                background: 'rgba(124,58,237,0.9)',
                color: '#fff',
                padding: '12px 20px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
              Processing…
            </div>
          </div>
        )}
      </div>

      {/* Idle */}
      {cameraState === 'idle' && (
        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '40px 24px',
            textAlign: 'center',
          }}
        >
          <Camera size={48} color="var(--color-brand)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 8px' }}>
            Camera Scanner
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: '0 0 20px' }}>
            Position ticket QR codes in the camera frame to check in attendees
          </p>
          <button
            onClick={() => void startCamera()}
            style={{
              padding: '12px 28px',
              fontSize: '14px',
              fontWeight: 600,
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'var(--color-brand)',
              color: '#ffffff',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-brand-dark)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-brand)' }}
          >
            Start Camera
          </button>
        </div>
      )}

      {/* Starting */}
      {cameraState === 'starting' && (
        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '40px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <Loader2 size={32} color="var(--color-brand)" style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', margin: 0 }}>
            Requesting camera access…
          </p>
        </div>
      )}

      {/* Error */}
      {cameraState === 'error' && (
        <div
          style={{
            background: 'rgba(239,68,68,0.12)',
            border: '1px solid var(--color-error)',
            borderRadius: '12px',
            padding: '24px',
          }}
        >
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <AlertCircle size={24} color="var(--color-error)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-error)', margin: '0 0 4px' }}>
                Camera Error
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--color-error)', margin: '0 0 12px', whiteSpace: 'pre-line' }}>
                {error}
              </p>
              <button
                onClick={() => void startCamera()}
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: 'var(--color-error)',
                  color: '#ffffff',
                  cursor: 'pointer',
                }}
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scanning controls */}
      {cameraState === 'scanning' && (
        <>
          <button
            onClick={stopCamera}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '13px',
              fontWeight: 600,
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface-2)',
              color: 'var(--color-text)',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-border)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-surface-2)' }}
          >
            Stop Camera
          </button>
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: '16px 0 0', textAlign: 'center' }}>
            Position QR codes in the frame to scan
          </p>
        </>
      )}
    </div>
  )
}
