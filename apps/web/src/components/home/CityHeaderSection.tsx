'use client'

import React, { useState, useMemo, useRef, useEffect } from 'react'

interface CityHeaderSectionProps {
  selectedCity: string
  onCityChange: (city: string) => void
}

function getTimeOfDay(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function CityHeaderSection({ selectedCity, onCityChange }: CityHeaderSectionProps) {
  const [showCitySelector, setShowCitySelector] = useState(false)
  const greeting = useMemo(() => getTimeOfDay(), [])
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCitySelector(false)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setShowCitySelector(false)
      }
    }

    if (showCitySelector) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        document.removeEventListener('keydown', handleEscape)
      }
    }
  }, [showCitySelector])

  return (
    <>
      <style>{`
        .__ct_city_header_wrap { padding: 24px 24px 16px; background: var(--color-bg); }
        .__ct_city_header_top { margin-bottom: 24px; }
        .__ct_greeting { font-size: 14px; color: var(--color-text-muted); font-weight: 500; margin-bottom: 8px; }
        .__ct_city_question { font-size: 32px; color: var(--color-text); font-weight: 700; line-height: 1.2; margin: 0; }
        .__ct_city_pill_wrapper { position: relative; display: inline-block; }
        .__ct_city_pill { display: inline-flex; align-items: center; gap: 8px; background: var(--color-surface-2); border: 1px solid var(--color-border); color: var(--color-text); padding: 8px 16px; border-radius: var(--radius-full); cursor: pointer; font-size: 14px; font-weight: 600; transition: background 150ms ease, border-color 150ms ease; }
        .__ct_city_pill:hover { background: var(--color-surface); }
        .__ct_city_pill:focus-visible { outline: 2px solid var(--color-brand); outline-offset: 2px; }
        .__ct_chevron { font-size: 12px; }
        .__ct_city_dropdown { position: absolute; top: calc(100% + 8px); left: 0; width: 280px; max-height: 360px; overflow-y: auto; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); box-shadow: var(--shadow-lg); z-index: 50; opacity: var(--opacity-dropdown, 0); transform: var(--transform-dropdown, translateY(-4px)); transition: opacity 150ms ease, transform 150ms ease; pointer-events: var(--pointer-events-dropdown, none); }
        .__ct_city_dropdown_search { width: 100%; padding: 12px 12px; border: none; border-bottom: 1px solid var(--color-border); background: var(--color-surface); border-radius: 0; font-size: 14px; color: var(--color-text); box-sizing: border-box; }
        .__ct_city_dropdown_search:focus { outline: 2px solid var(--color-brand); outline-offset: 0; }
        .__ct_city_dropdown_search::placeholder { color: var(--color-text-muted); }
        .__ct_city_dropdown_divider { height: 1px; background: var(--color-border); }
        .__ct_city_dropdown_use_location { display: block; width: 100%; padding: 10px 12px; background: none; border: none; color: var(--color-text-muted); font-size: 12px; font-weight: 600; cursor: pointer; text-align: left; transition: color 150ms ease; text-transform: uppercase; letter-spacing: 0.05em; }
        .__ct_city_dropdown_use_location:hover { color: var(--color-brand); }
        .__ct_city_dropdown_use_location:focus-visible { outline: 2px solid var(--color-brand); outline-offset: -2px; }
        .__ct_city_dropdown_list { padding: 0; margin: 0; list-style: none; }
        .__ct_city_dropdown_item { display: block; width: 100%; padding: 10px 12px; background: none; border: none; color: var(--color-text); font-size: 14px; cursor: pointer; text-align: left; transition: background-color 100ms ease, color 100ms ease; }
        .__ct_city_dropdown_item:hover { background-color: var(--color-surface-2); color: var(--color-brand); }
        .__ct_city_dropdown_item:focus-visible { outline: 2px solid var(--color-brand); outline-offset: -2px; }
        @media (max-width: 767px) { .__ct_city_header_wrap { padding: 16px 16px 12px; } .__ct_city_question { font-size: 24px; } }
      `}</style>

      <div className="__ct_city_header_wrap">
        <div className="__ct_city_header_top">
          <div className="__ct_greeting">{greeting}</div>
          <h1 className="__ct_city_question">What's on in</h1>
          <div ref={dropdownRef} className="__ct_city_pill_wrapper">
            <button
              type="button"
              className="__ct_city_pill"
              onClick={() => setShowCitySelector(!showCitySelector)}
              aria-label={`Current city: ${selectedCity}. Click to change.`}
              aria-expanded={showCitySelector}
            >
              {selectedCity}
              <span className="__ct_chevron">▾</span>
            </button>

            {/* City Selector Dropdown */}
            <CitySelectorDropdown
              isOpen={showCitySelector}
              onSelect={(city) => {
                localStorage.setItem('comfytag_city', city)
                onCityChange(city)
                setShowCitySelector(false)
              }}
            />
          </div>
        </div>
      </div>
    </>
  )
}

interface CitySelectorDropdownProps {
  isOpen: boolean
  onSelect: (city: string) => void
}

function CitySelectorDropdown({ isOpen, onSelect }: CitySelectorDropdownProps) {
  const [searchInput, setSearchInput] = useState('')
  const [useLocation, setUseLocation] = useState(false)

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
      await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject)
      })
      onSelect('Lagos')
    } catch (err) {
      setUseLocation(false)
    }
  }

  return (
    <div
      style={{
        '--opacity-dropdown': isOpen ? 1 : 0,
        '--transform-dropdown': isOpen ? 'translateY(0)' : 'translateY(-4px)',
        '--pointer-events-dropdown': isOpen ? 'auto' : 'none',
      } as React.CSSProperties}
      className="__ct_city_dropdown"
      role="listbox"
      aria-label="City list"
    >
      <input
        type="text"
        className="__ct_city_dropdown_search"
        placeholder="Search city..."
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        aria-label="Search cities"
      />

      <div className="__ct_city_dropdown_divider" />

      <button
        type="button"
        className="__ct_city_dropdown_use_location"
        onClick={handleAutoDetect}
        disabled={useLocation}
      >
        {useLocation ? 'Detecting...' : '◆ Use my location'}
      </button>

      <div className="__ct_city_dropdown_divider" />

      <ul className="__ct_city_dropdown_list">
        {filteredCities.length > 0 ? (
          filteredCities.map((city) => (
            <li key={city}>
              <button
                type="button"
                className="__ct_city_dropdown_item"
                onClick={() => onSelect(city)}
                role="option"
              >
                {city}
              </button>
            </li>
          ))
        ) : (
          <li style={{ padding: '10px 12px', color: 'var(--color-text-muted)', fontSize: '13px' }}>
            No cities found
          </li>
        )}
      </ul>
    </div>
  )
}
