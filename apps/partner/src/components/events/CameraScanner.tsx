'use client'

import { useEffect, useRef, useState, useCallback, useId } from 'react'
import { Camera, AlertCircle, Loader2 } from 'lucide-react'
import { Html5Qrcode } from 'html5-qrcode'
import type { CameraDevice } from 'html5-qrcode'

interface CameraScannerProps {
  onScan: (reference: string) => void
  isProcessing: boolean
}

type CameraState = 'idle' | 'starting' | 'scanning' | 'error'

export function CameraScanner({ onScan, isProcessing }: CameraScannerProps) {
  const containerId = `qr-scanner-${useId()}`
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const lastScannedRef = useRef<{ value: string; at: number }>({ value: '', at: 0 })

  const [cameraState, setCameraState] = useState<CameraState>('idle')
  const [error, setError] = useState<string>('')
  const [cameras, setCameras] = useState<CameraDevice[]>([])
  const [selectedCameraId, setSelectedCameraId] = useState<string>('')

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {})
      }
    }
  }, [])

  const onDecoded = useCallback(
    (decodedText: string) => {
      const now = Date.now()
      // Deduplicate: ignore same reference within 3 seconds
      if (decodedText === lastScannedRef.current.value && now - lastScannedRef.current.at < 3000) {
        return
      }
      lastScannedRef.current = { value: decodedText, at: now }
      onScan(decodedText.trim().toUpperCase())
    },
    [onScan]
  )

  function handleError(err: unknown) {
    const msg = (err instanceof Error ? err.message + (err.name ? ' ' + err.name : '') : String(err)).toLowerCase()

    if (/notallowed|permission|denied/.test(msg)) {
      setError('Camera access denied. Enable camera permission in your browser settings.')
    } else if (/notfound|no camera/.test(msg)) {
      setError('No camera found on this device.')
    } else if (
      location.protocol !== 'https:' &&
      location.hostname !== 'localhost' &&
      location.hostname !== '127.0.0.1'
    ) {
      setError('Camera scanning requires HTTPS (localhost is exempt).')
    } else {
      setError('Failed to start camera. Please refresh and try again.')
    }
    setCameraState('error')
  }

  async function startCamera(cameraId?: string) {
    setCameraState('starting')
    setError('')
    try {
      const devices = await Html5Qrcode.getCameras()
      if (!devices || devices.length === 0) {
        throw new Error('No cameras found')
      }
      setCameras(devices)

      const targetCameraId = cameraId ?? selectedCameraId ?? devices[0].id
      setSelectedCameraId(targetCameraId)

      const scanner = new Html5Qrcode(containerId)
      scannerRef.current = scanner

      await scanner.start(
        targetCameraId,
        {
          fps: 10,
          qrbox: { width: 240, height: 240 },
          aspectRatio: 1.0,
        },
        onDecoded,
        () => {} // Ignore per-frame errors (noise)
      )

      setCameraState('scanning')
    } catch (err) {
      handleError(err)
    }
  }

  async function stopCamera() {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
      } catch {
        // Ignore cleanup errors
      }
      scannerRef.current = null
    }
    setCameraState('idle')
  }

  async function handleCameraChange(newCameraId: string) {
    setSelectedCameraId(newCameraId)
    // Stop current camera
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
      } catch {
        //
      }
      scannerRef.current = null
    }
    // Start new camera
    await startCamera(newCameraId)
  }

  if (cameraState === 'idle') {
    return (
      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          padding: '40px 24px',
          textAlign: 'center',
        }}
      >
        <div style={{ marginBottom: '16px' }}>
          <Camera size={48} color="var(--color-brand)" style={{ margin: '0 auto' }} />
        </div>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 8px' }}>
          Camera Scanner
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: '0 0 20px' }}>
          Position ticket QR codes in the camera frame to check in attendees
        </p>
        <button
          onClick={() => startCamera()}
          style={{
            padding: '12px 28px',
            fontSize: '14px',
            fontWeight: 600,
            borderRadius: '8px',
            border: 'none',
            backgroundColor: 'var(--color-brand)',
            color: '#ffffff',
            cursor: 'pointer',
            transition: 'background-color var(--duration-fast) ease',
          }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-brand-dark)'
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-brand)'
          }}
        >
          Start Camera
        </button>
      </div>
    )
  }

  if (cameraState === 'starting') {
    return (
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
    )
  }

  if (cameraState === 'error') {
    return (
      <div
        style={{
          background: 'rgba(239, 68, 68, 0.12)',
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
            <p style={{ fontSize: '13px', color: 'var(--color-error)', margin: '0 0 12px' }}>{error}</p>
            <button
              onClick={() => startCamera()}
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
    )
  }

  // cameraState === 'scanning'
  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        padding: '24px',
      }}
    >
      {/* Scanner container with overlay */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '1',
          maxWidth: '360px',
          margin: '0 auto 20px',
          borderRadius: '8px',
          overflow: 'hidden',
          background: '#000',
        }}
      >
        <style>{`
          @keyframes scanLine {
            0% { top: 0%; }
            100% { top: 100%; }
          }
          .scan-line {
            position: absolute;
            width: 100%;
            height: 2px;
            background: var(--color-brand);
            animation: scanLine 1.8s linear infinite;
            z-index: 10;
            opacity: 0.8;
          }
          .scan-frame {
            position: absolute;
            inset: 0;
            z-index: 5;
            border: 2px solid transparent;
          }
          .scan-corner {
            position: absolute;
            width: 32px;
            height: 32px;
            border-color: var(--color-brand);
            border-style: solid;
          }
          .scan-corner-tl { top: 0; left: 0; border-width: 3px 0 0 3px; }
          .scan-corner-tr { top: 0; right: 0; border-width: 3px 3px 0 0; }
          .scan-corner-bl { bottom: 0; left: 0; border-width: 0 0 3px 3px; }
          .scan-corner-br { bottom: 0; right: 0; border-width: 0 3px 3px 0; }
        `}</style>

        <div id={containerId} style={{ width: '100%', height: '100%' }} />

        {/* Scan frame overlay */}
        <div className="scan-frame">
          <div className="scan-corner scan-corner-tl" />
          <div className="scan-corner scan-corner-tr" />
          <div className="scan-corner scan-corner-bl" />
          <div className="scan-corner scan-corner-br" />
          <div className="scan-line" />
        </div>

        {/* Processing overlay */}
        {isProcessing && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 20,
            }}
          >
            <div
              style={{
                background: 'rgba(124, 58, 237, 0.9)',
                color: '#fff',
                padding: '12px 20px',
                borderRadius: '6px',
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

      {/* Controls */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap' }}>
        {cameras.length > 1 && (
          <select
            value={selectedCameraId}
            onChange={(e) => void handleCameraChange(e.target.value)}
            style={{
              flex: 1,
              minWidth: '200px',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface-2)',
              color: 'var(--color-text)',
              fontSize: '13px',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            {cameras.map((cam) => (
              <option key={cam.id} value={cam.id}>
                {cam.label || `Camera ${cameras.indexOf(cam) + 1}`}
              </option>
            ))}
          </select>
        )}
        <button
          onClick={() => void stopCamera()}
          style={{
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 600,
            borderRadius: '6px',
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface-2)',
            color: 'var(--color-text)',
            cursor: 'pointer',
            transition: 'background-color var(--duration-fast) ease',
          }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--color-border)'
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--color-surface-2)'
          }}
        >
          Stop Camera
        </button>
      </div>

      <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: 0, textAlign: 'center' }}>
        Position QR codes in the frame above to scan
      </p>
    </div>
  )
}
