'use client'

import { NIGERIAN_STATES, EVENT_CATEGORIES } from '@comfytag/utils'
import type { CreateEventFormData } from '@/hooks/useCreateEventWizard'

interface Step1BasicInfoProps {
  formData: CreateEventFormData
  updateField: (field: keyof CreateEventFormData, value: unknown) => void
  stepErrors: string
  onNext: () => void
  onPrev: () => void
}

const label = 'block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2'
const input =
  'w-full bg-white border-2 border-zinc-200 focus:border-violet-500 rounded-xl px-4 py-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none transition-colors'
const select =
  'w-full appearance-none bg-white border-2 border-zinc-200 focus:border-violet-500 rounded-xl px-4 py-3.5 pr-10 text-sm text-zinc-900 focus:outline-none transition-colors cursor-pointer'

function SelectChevron() {
  return (
    <svg
      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
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

export function Step1BasicInfo({
  formData,
  updateField,
  stepErrors,
  onNext,
}: Step1BasicInfoProps) {
  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-5">
      <div>
        <h2 className="text-xl font-black text-zinc-900">Basic Info</h2>
        <p className="text-sm text-zinc-500 mt-0.5">Name, category, date, and location</p>
      </div>

      {/* Event name */}
      <div>
        <label htmlFor="event-name" className={label}>
          Event Name <span className="text-red-400">*</span>
        </label>
        <input
          id="event-name"
          type="text"
          value={formData.name}
          onChange={(e) => updateField('name', e.target.value)}
          placeholder="e.g. Summer Festival 2025"
          className={input}
          autoFocus
        />
      </div>

      {/* Category + Date */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="event-category" className={label}>
            Category
          </label>
          <div className="relative">
            <select
              id="event-category"
              value={formData.category}
              onChange={(e) => updateField('category', e.target.value)}
              className={select}
            >
              <option value="">Select category</option>
              {EVENT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <SelectChevron />
          </div>
        </div>

        <div>
          <label htmlFor="event-date" className={label}>
            Date <span className="text-red-400">*</span>
          </label>
          <input
            id="event-date"
            type="date"
            value={formData.date}
            onChange={(e) => updateField('date', e.target.value)}
            className={input}
          />
        </div>
      </div>

      {/* Start + End time */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="event-start-time" className={label}>
            Start Time <span className="text-red-400">*</span>
          </label>
          <input
            id="event-start-time"
            type="time"
            value={formData.startTime}
            onChange={(e) => updateField('startTime', e.target.value)}
            className={input}
          />
        </div>
        <div>
          <label htmlFor="event-end-time" className={label}>
            End Time
          </label>
          <input
            id="event-end-time"
            type="time"
            value={formData.endTime}
            onChange={(e) => updateField('endTime', e.target.value)}
            className={input}
          />
        </div>
      </div>

      {/* Venue name */}
      <div>
        <label htmlFor="event-venue" className={label}>
          Venue Name
        </label>
        <input
          id="event-venue"
          type="text"
          value={formData.venue}
          onChange={(e) => updateField('venue', e.target.value)}
          placeholder="e.g. Lekki Conservancy"
          className={input}
        />
      </div>

      {/* Address */}
      <div>
        <label htmlFor="event-address" className={label}>
          Address
        </label>
        <input
          id="event-address"
          type="text"
          value={formData.address}
          onChange={(e) => updateField('address', e.target.value)}
          placeholder="e.g. Plot 50, Admiralty Way, Lekki"
          className={input}
        />
      </div>

      {/* State */}
      <div>
        <label htmlFor="event-state" className={label}>
          State
        </label>
        <div className="relative">
          <select
            id="event-state"
            value={formData.state}
            onChange={(e) => updateField('state', e.target.value)}
            className={select}
          >
            <option value="">Select state</option>
            {NIGERIAN_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <SelectChevron />
        </div>
      </div>

      {/* Error */}
      {stepErrors && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <p className="text-sm text-red-600 font-medium">{stepErrors}</p>
        </div>
      )}

      {/* Nav */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          disabled
          aria-disabled="true"
          className="flex items-center gap-1.5 text-sm font-semibold text-zinc-300 cursor-not-allowed"
        >
          <BackIcon />
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex-1 bg-violet-600 text-white text-sm font-bold py-4 rounded-2xl hover:bg-violet-700 active:bg-violet-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
        >
          Next: Cover Image →
        </button>
      </div>
    </div>
  )
}
