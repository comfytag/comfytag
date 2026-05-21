'use client'

import React, { useState, useEffect } from 'react'

export interface CitySelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (city: string) => void
}

export function CitySelector({ isOpen, onClose, onSelect }: CitySelectorProps) {
  const [searchInput, setSearchInput] = useState('')
  const [useLocation, setUseLocation] = useState(false)

  // Reset search when opening
  useEffect(() => {
    if (isOpen) {
      setSearchInput('')
      setUseLocation(false)
    }
  }, [isOpen])

  // Persist city selection to localStorage
  const handleCitySelect = (city: string) => {
    try {
      localStorage.setItem('selectedCity', city)
    } catch (err) {
      console.error('localStorage error:', err)
    }
    onSelect(city)
  }

  const NIGERIAN_CITIES = [
    'Lagos', 'Abuja', 'Ibadan', 'Kano', 'Katsina',
    'Port Harcourt', 'Enugu', 'Benin City', 'Ife', 'Ogbomosho',
    'Ilorin', 'Akure', 'Abeokuta', 'Calabar', 'Kaduna'
  ]

  const filteredCities = searchInput.trim()
    ? NIGERIAN_CITIES.filter((c) => c.toLowerCase().includes(searchInput.toLowerCase()))
    : NIGERIAN_CITIES

  const handleAutoDetect = async () => {
    setUseLocation(true)
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
      })
      // In production, reverse geocode the coordinates to city name
      // For MVP, default to Lagos after successful location access
      console.log('Location detected:', position.coords)
      handleCitySelect('Lagos')
    } catch (err) {
      console.error('Geolocation error:', err)
      setUseLocation(false)
    }
  }

  return (
    <>
      <style>{`
        .__ct_city_selector_backdrop { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5); z-index: 100; opacity: var(--opacity-backdrop, 1); pointer-events: var(--pointer-events-backdrop, auto); transition: opacity 300ms ease; }
        .__ct_city_selector_sheet { position: fixed; bottom: 0; left: 0; right: 0; z-index: 101; background: var(--color-surface); border-radius: 24px 24px 0 0; max-height: 90vh; overflow-y: auto; transform: var(--transform-sheet, translateY(0)); transition: transform 300ms cubic-bezier(0.32, 0.72, 0, 1); }
        .__ct_city_selector_drag { width: 36px; height: 4px; background: var(--color-border); border-radius: 2px; margin: 12px auto 16px; }
        .__ct_city_selector_title { font-size: 17px; font-weight: 600; padding: 0 24px 16px; color: var(--color-text); }
        .__ct_city_selector_search { width: 100%; padding: 12px 16px; border: 1px solid var(--color-border); background: var(--color-surface-2); border-radius: var(--radius-md); font-size: 14px; color: var(--color-text); transition: border-color 150ms ease, background 150ms ease; font-family: inherit; }
        .__ct_city_selector_search:focus { outline: 2px solid var(--color-brand); outline-offset: 0; border-color: var(--color-brand); }
        .__ct_city_selector_search::placeholder { color: var(--color-text-muted); }
        .__ct_city_selector_auto { width: 100%; padding: 12px 16px; margin: 16px 24px 16px; background: var(--color-brand); color: var(--color-text-on-brand); border: none; border-radius: var(--radius-md); font-size: 14px; font-weight: 600; cursor: pointer; transition: background 150ms ease; font-family: inherit; }
        .__ct_city_selector_auto:hover:not(:disabled) { background: var(--color-brand-dark); }
        .__ct_city_selector_auto:focus-visible { outline: 2px solid var(--color-text-on-brand); outline-offset: 2px; }
        .__ct_city_selector_auto:disabled { opacity: 0.7; cursor: not-allowed; }
        .__ct_city_selector_divider { height: 1px; background: var(--color-border); margin: 12px 24px; }
        .__ct_city_selector_list { padding: 0 24px 32px; display: flex; flex-direction: column; gap: 0; }
        .__ct_city_selector_item { width: 100%; text-align: left; padding: 14px 0; border-bottom: 1px solid var(--color-border); background: none; border: none; color: var(--color-text); font-size: 14px; cursor: pointer; transition: color 150ms ease; font-family: inherit; }
        .__ct_city_selector_item:last-child { border-bottom: none; }
        .__ct_city_selector_item:hover { color: var(--color-brand); }
        .__ct_city_selector_item:focus-visible { outline: 2px solid var(--color-brand); outline-offset: 2px; }
        .__ct_city_selector_empty { padding: 14px 0; color: var(--color-text-muted); font-size: 14px; }
      `}</style>

      {/* Backdrop */}
      <div
        style={{
          '--opacity-backdrop': isOpen ? 1 : 0,
          '--pointer-events-backdrop': isOpen ? 'auto' : 'none',
        } as React.CSSProperties}
        className="__ct_city_selector_backdrop"
        onClick={onClose}
        aria-hidden={!isOpen}
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Select your city"
        style={{
          '--transform-sheet': isOpen ? 'translateY(0)' : 'translateY(100%)',
        } as React.CSSProperties}
        className="__ct_city_selector_sheet"
      >
        {/* Drag handle */}
        <div className="__ct_city_selector_drag" aria-hidden="true" />

        {/* Title */}
        <div className="__ct_city_selector_title">Select your city</div>

        {/* Content */}
        <div style={{ padding: '0 24px' }}>
          {/* Search input */}
          <input
            type="text"
            className="__ct_city_selector_search"
            placeholder="Search city..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            autoFocus
          />

          {/* Auto-detect button */}
          <button
            type="button"
            className="__ct_city_selector_auto"
            onClick={handleAutoDetect}
            disabled={useLocation}
          >
            {useLocation ? 'Detecting location...' : 'Use my location'}
          </button>

          {/* Divider */}
          <div className="__ct_city_selector_divider" />

          {/* City list */}
          <div className="__ct_city_selector_list">
            {filteredCities.length > 0 ? (
              filteredCities.map((city) => (
                <button
                  key={city}
                  type="button"
                  className="__ct_city_selector_item"
                  onClick={() => handleCitySelect(city)}
                >
                  {city}
                </button>
              ))
            ) : (
              <div className="__ct_city_selector_empty">
                No cities found
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
