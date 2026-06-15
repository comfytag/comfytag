'use client'

import { useRef, useState } from 'react'
import { ErrorMessage } from '@comfytag/ui'
import type { CreateEventFormData } from '@/hooks/useCreateEventWizard'

interface Step2MediaProps {
  formData: CreateEventFormData
  updateField: (field: keyof CreateEventFormData, value: unknown) => void
  handleUpload: (file: File) => Promise<string>
  stepErrors: string
  onNext: () => void
  onPrev: () => void
}

function BackIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  )
}

export function Step2Media({
  formData,
  updateField,
  handleUpload,
  stepErrors,
  onNext,
  onPrev,
}: Step2MediaProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      const urls = await Promise.all(Array.from(files).map(f => handleUpload(f)))
      updateField('images', [...formData.images, ...urls].slice(0, 10))
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function removeImage(url: string) {
    updateField('images', formData.images.filter(u => u !== url))
  }

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-5">
      <div>
        <h2 className="text-xl font-black text-zinc-900">Event Images</h2>
        <p className="text-sm text-zinc-500 mt-0.5">
          Upload up to 10 images. The first image becomes your cover (16:9 recommended).
        </p>
      </div>

      {/* Hint */}
      <div className="bg-violet-50 border border-violet-200 rounded-xl px-4 py-3">
        <p className="text-xs font-semibold text-violet-700">
          Great visuals can increase ticket sales by up to 40%. Add multiple angles — stage, venue, past events.
        </p>
      </div>

      {/* Thumbnail strip */}
      {formData.images.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
          {formData.images.map((url, i) => (
            <div key={url} className="relative shrink-0 group">
              {i === 0 && (
                <span className="absolute top-1.5 left-1.5 z-10 bg-violet-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider pointer-events-none">
                  Cover
                </span>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Event image ${i + 1}`}
                className="w-28 h-20 object-cover rounded-xl border-2 border-zinc-200 group-hover:border-violet-400 transition-colors"
              />
              <button
                type="button"
                onClick={() => removeImage(url)}
                aria-label="Remove image"
                className="absolute top-1.5 right-1.5 w-5 h-5 bg-black/60 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity focus-visible:opacity-100 focus-visible:outline-none"
              >
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload area */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
      />
      <button
        type="button"
        disabled={uploading || formData.images.length >= 10}
        onClick={() => inputRef.current?.click()}
        className="w-full border-2 border-dashed border-zinc-300 hover:border-violet-400 rounded-xl py-8 flex flex-col items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
      >
        {uploading ? (
          <>
            <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-semibold text-violet-600">Uploading…</span>
          </>
        ) : (
          <>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
            </svg>
            <span className="text-sm font-semibold text-zinc-700">
              {formData.images.length === 0 ? 'Upload images' : 'Add more images'}
            </span>
            <span className="text-xs text-zinc-400">
              {formData.images.length}/10 · JPG, PNG, WEBP
            </span>
          </>
        )}
      </button>

      {/* Error */}
      {stepErrors && <ErrorMessage message={stepErrors} />}

      {/* Nav */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={onPrev}
          className="flex items-center gap-1.5 text-sm font-semibold text-zinc-500 hover:text-zinc-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded-lg"
        >
          <BackIcon />
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex-1 bg-violet-600 text-white text-sm font-bold py-4 rounded-2xl hover:bg-violet-700 active:bg-violet-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
        >
          Next: Ticket Tiers →
        </button>
      </div>
    </div>
  )
}
