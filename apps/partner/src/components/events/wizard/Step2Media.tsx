'use client'

import { ErrorMessage, MediaUploader } from '@comfytag/ui'
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
  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-5">
      <div>
        <h2 className="text-xl font-black text-zinc-900">Cover Image</h2>
        <p className="text-sm text-zinc-500 mt-0.5">
          Upload a high-quality image (16:9 recommended)
        </p>
      </div>

      {/* Uploader hint */}
      <div className="bg-violet-50 border border-violet-200 rounded-xl px-4 py-3">
        <p className="text-xs font-semibold text-violet-700">
          A great cover image can increase ticket sales by up to 40%. Use vibrant, high-contrast visuals.
        </p>
      </div>

      {/* MediaUploader — preserved exactly as-is */}
      <MediaUploader
        label="Event Cover"
        accept="image"
        urls={formData.coverImage ? [formData.coverImage] : []}
        onAdd={async (newUrls) => updateField('coverImage', newUrls[0] ?? '')}
        onRemove={() => updateField('coverImage', '')}
        uploadFn={handleUpload}
      />

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
