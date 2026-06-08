'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Camera, AlertCircle, Loader2 } from 'lucide-react'
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library'

interface CameraScannerProps {
  onScan: (reference: string) => void
  isProcessing: boolean
}

type CameraState = 'idle' | 'starting' | 'scanning' | 'error'

export function CameraScanner({ onScan, isProcessing }: CameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)
  const lastScannedRef = useRef<{ value: string; at: number }>({ value: '', at: 0 })

  const [cameraState, setCameraState] = useState<CameraState>('idle')
  const [error, setError] = useState<string>('')

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (readerRef.current) {
        try {
          readerRef.current.reset()
        } catch {
          // Ignore cleanup errors
        }
        readerRef.current = null
      }
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach(track => track.stop())
        videoRef.current.srcObject = null
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
    const msg = (err instanceof Error ? err.message : String(err)).toLowerCase()

    if (/notallowed|permission|denied|not allowed/.test(msg)) {
      setError('Camera access denied. Enable camera permission in browser settings.')
    } else if (/notfound|no camera|no device|overconstrained/.test(msg)) {
      setError(
        'Camera not available. Ensure:\n' +
        '1. Camera is connected and working\n' +
        '2. No other app is using it\n' +
        '3. Camera permissions are granted in browser settings\n' +
        '4. Use Manual mode as fallback'
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
      setError('Camera error. Try refreshing the page or use Manual mode.')
    }
    setCameraState('error')
  }

  async function startCamera() {
    setCameraState('starting')
    setError('')
    try {
      // Check browser support
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Your browser does not support camera access. Please use Chrome, Edge, or Firefox.')
      }

      const videoElement = videoRef.current
      if (!videoElement) {
        throw new Error('Video element not found')
      }

      // Initialize reader
      const reader = new BrowserMultiFormatReader()
      readerRef.current = reader

      // Start continuous QR code scanning
      // This will prompt for camera permission and start decoding frames
      reader.decodeFromConstraints(
        { audio: false, video: { facingMode: 'environment' } },
        videoElement,
        (result, error) => {
          // Suppress per-frame errors (expected when no QR in frame)
          if (error instanceof NotFoundException) {
            return
          }

          if (error) {
            handleError(error)
            return
          }

          if (result) {
            onDecoded(result.getText())
          }
        }
      )

      setCameraState('scanning')
    } catch (err) {
      handleError(err)
    }
  }

  async function stopCamera() {
    if (readerRef.current) {
      try {
        readerRef.current.reset()
      } catch {
        // Ignore cleanup errors
      }
      readerRef.current = null
    }
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    setCameraState('idle')
  }

  // Always render video element (hidden when not scanning)
  const videoContainerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    aspectRatio: '1',
    maxWidth: '360px',
    margin: '0 auto 20px',
    borderRadius: '8px',
    overflow: 'hidden',
    background: '#000',
    display: cameraState === 'scanning' ? 'block' : 'none', // Hidden when not scanning
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

        {/* Hidden video element - always in DOM for startCamera() to access */}
        <video
          ref={videoRef}
          style={{
            display: 'none',
          }}
        />
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

        {/* Hidden video element - always in DOM */}
        <video
          ref={videoRef}
          style={{
            display: 'none',
          }}
        />
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

        {/* Hidden video element - always in DOM */}
        <video
          ref={videoRef}
          style={{
            display: 'none',
          }}
        />
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
      {/* Video container */}
      <div style={videoContainerStyle}>
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
          video {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
        `}</style>

        {/* Video element - displayed when scanning */}
        <video
          ref={videoRef}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />

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
      <button
        onClick={() => void stopCamera()}
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

      <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: '16px 0 0', textAlign: 'center' }}>
        Position QR codes in the frame to scan
      </p>
    </div>
  )
}
