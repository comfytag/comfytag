'use client'

import { useState, useEffect, useRef } from 'react'
import { APIProvider, Map, AdvancedMarker, InfoWindow, useMap } from '@vis.gl/react-google-maps'
import type { MapViewProps } from './MapLibreMapView'
import type { Event } from '@comfytag/types'
import { formatDate, formatNaira } from '@comfytag/utils'

const GOOGLE_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? 'DEMO_MAP_ID'

const NIGERIA_VENUE_COORDS: Record<string, [number, number]> = {
  'transcorp hilton': [7.4892, 9.0580],
  'transcorp hilton abuja': [7.4892, 9.0580],
  'sheraton abuja': [7.4905, 9.0532],
  'nicon luxury': [7.5089, 9.0572],
  'radisson blu abuja': [7.4917, 9.0600],
  'hilton abuja': [7.4892, 9.0580],
  'international conference centre': [7.5067, 9.0533],
  'icc abuja': [7.5067, 9.0533],
  'abuja national stadium': [7.4422, 9.0579],
  'moshood abiola stadium': [7.4422, 9.0579],
  'eko hotel': [3.4216, 6.4281],
  'eko hotel and suites': [3.4216, 6.4281],
  'eko hotels': [3.4216, 6.4281],
  'landmark event centre': [3.4283, 6.4333],
  'landmark beach': [3.4250, 6.4300],
  'federal palace hotel': [3.4188, 6.4303],
  'oriental hotel': [3.4227, 6.4294],
  'the oriental hotel': [3.4227, 6.4294],
  'lagos continental hotel': [3.3927, 6.4529],
  'sheraton lagos': [3.3540, 6.5973],
  'radisson blu lagos': [3.4367, 6.4267],
  'balmoral convention centre': [3.3558, 6.6012],
  'federal palace': [3.4188, 6.4303],
  'tafawa balewa square': [3.3903, 6.4527],
  'tbs': [3.3903, 6.4527],
  'national arts theatre': [3.3619, 6.5003],
  'muson centre': [3.4367, 6.4600],
  'terra kulture': [3.4228, 6.4392],
  'hard rock cafe lagos': [3.4292, 6.4340],
  'eko atlantic': [3.4100, 6.4150],
  'ocean parade': [3.4100, 6.4150],
  'lekki conservation centre': [3.5583, 6.4650],
  'genesis cinema': [3.3419, 6.6018],
  'presidential hotel port harcourt': [7.0500, 4.8333],
  'le meridien port harcourt': [7.0250, 4.8500],
  'novotel port harcourt': [7.0134, 4.8156],
  'tahir guest palace': [8.5247, 12.0022],
  'premier hotel ibadan': [3.9100, 7.3600],
  'international conference centre ibadan': [3.8960, 7.4160],
  'nike lake resort': [7.5383, 6.4700],
  'kwara state stadium': [4.5633, 8.4742],
  'sabe ilorin stadium': [4.5633, 8.4742],
  'save ilorin stadium': [4.5633, 8.4742],
  'ilorin township stadium': [4.5633, 8.4742],
  'kwara hotel': [4.5500, 8.4966],
  'protea hotel benin': [5.6037, 6.3350],
  'samuel ogbemudia stadium': [5.6150, 6.3500],
  'arewa house': [7.4278, 10.5264],
  'kaduna township stadium': [7.4233, 10.5233],
  'calabar carnival': [8.3269, 4.9500],
  'warri township stadium': [5.7450, 5.5133],
}

const NIGERIA_AREA_COORDS: Record<string, [number, number]> = {
  'Ikoyi': [3.4375, 6.4550],
  'Victoria Island': [3.4216, 6.4281],
  'VI': [3.4216, 6.4281],
  'Lekki': [3.5852, 6.4698],
  'Ajah': [3.6199, 6.4651],
  'Ikeja': [3.3419, 6.6018],
  'Surulere': [3.3561, 6.5008],
  'Yaba': [3.3793, 6.5085],
  'Gbagada': [3.3860, 6.5542],
  'Festac': [3.2744, 6.4650],
  'Alausa': [3.3588, 6.6073],
  'Maryland': [3.3667, 6.5667],
  'Oniru': [3.4533, 6.4367],
  'Maitama': [7.4961, 9.0765],
  'Wuse': [7.4892, 9.0600],
  'Garki': [7.5014, 9.0522],
  'Gwarinpa': [7.4167, 9.1167],
  'Asokoro': [7.5233, 9.0433],
  'Central Business District': [7.5067, 9.0533],
  'CBD': [7.5067, 9.0533],
  'Port Harcourt': [7.0134, 4.8156],
  'Ibadan': [3.9470, 7.3775],
  'Kano': [8.5247, 12.0022],
  'Enugu': [7.4951, 6.4527],
  'Abeokuta': [3.3503, 7.1475],
  'Ilorin': [4.5418, 8.4966],
  'Benin City': [5.6037, 6.3350],
  'Warri': [5.7480, 5.5167],
  'Asaba': [6.7500, 6.2000],
  'Owerri': [7.0498, 5.4920],
  'Uyo': [7.9306, 5.0073],
  'Calabar': [8.3269, 5.8700],
  'Kaduna': [7.4391, 10.5264],
  'Osogbo': [4.5450, 7.7667],
  'Oshogbo': [4.5450, 7.7667],
}

const NIGERIA_STATE_COORDS: Record<string, [number, number]> = {
  'Lagos': [3.3792, 6.5244],
  'Abuja': [7.1847, 9.0765],
  'Rivers': [7.0134, 4.8156],
  'Kano': [8.5247, 12.0022],
  'Oyo': [3.9470, 7.3775],
  'Delta': [6.7470, 6.2063],
  'Anambra': [7.0779, 6.2108],
  'Enugu': [7.4951, 6.4527],
  'Kaduna': [7.4391, 10.5264],
  'Imo': [7.0498, 5.4920],
  'Plateau': [8.8921, 9.2182],
  'Cross River': [8.3269, 5.8700],
  'Osun': [4.4833, 7.5629],
  'Borno': [13.1571, 11.8333],
  'Bayelsa': [6.3316, 4.7719],
  'Ogun': [3.3499, 6.9980],
  'Ekiti': [5.2311, 7.7190],
  'Edo': [5.6037, 6.3350],
  'Kwara': [4.5418, 8.4966],
  'Niger': [6.5569, 9.9309],
  'Sokoto': [5.2379, 13.0059],
  'Akwa Ibom': [7.9306, 5.0073],
  'Benue': [8.1135, 7.7279],
  'Abia': [7.3667, 5.4527],
  'Taraba': [11.3511, 7.8739],
  'Zamfara': [6.6572, 12.1699],
  'Adamawa': [12.3984, 9.3265],
  'Yobe': [12.2950, 12.1099],
  'Nasarawa': [8.3147, 8.5374],
  'Ebonyi': [8.1137, 6.2649],
  'Gombe': [11.0000, 10.2791],
  'Kogi': [6.7388, 7.8003],
  'Ondo': [4.8333, 7.2500],
  'Kebbi': [4.1975, 12.4534],
  'Bauchi': [9.8446, 10.3103],
  'Katsina': [7.6018, 12.9897],
  'Jigawa': [9.3555, 12.2280],
}

const DEFAULT_COORD: [number, number] = [8.6753, 9.0820]

function getPinColor(category: string): string {
  const cat = (category ?? '').toLowerCase()
  const colorMap: Record<string, string> = {
    music: '#7C3AED',
    comedy: '#F59E0B',
    tech: '#3B82F6',
    sports: '#10B981',
    art: '#EC4899',
    arts: '#EC4899',
    food: '#EF4444',
    party: '#F97316',
    parties: '#F97316',
    networking: '#6366F1',
  }
  return colorMap[cat] ?? '#7C3AED'
}

function getCoords(event: Event, index: number): [number, number] {
  if (event.venue) {
    const venueKey = event.venue.toLowerCase().trim()
    if (NIGERIA_VENUE_COORDS[venueKey]) {
      const base = NIGERIA_VENUE_COORDS[venueKey]
      const j = Math.sin(index * 7.3) * 0.002
      const j2 = Math.cos(index * 5.1) * 0.002
      return [base[0] + j, base[1] + j2]
    }
  }

  if (event.location) {
    const areaKey = Object.keys(NIGERIA_AREA_COORDS).find(
      (k) => k.toLowerCase() === event.location!.toLowerCase().trim()
    )
    if (areaKey) {
      const base = NIGERIA_AREA_COORDS[areaKey]
      const j = Math.sin(index * 7.3) * 0.02
      const j2 = Math.cos(index * 5.1) * 0.02
      return [base[0] + j, base[1] + j2]
    }
  }

  const stateKey = event.state
    ? event.state.charAt(0).toUpperCase() + event.state.slice(1).toLowerCase()
    : ''
  const base = NIGERIA_STATE_COORDS[stateKey] ?? DEFAULT_COORD
  const j = Math.sin(index * 7.3) * 0.25
  const j2 = Math.cos(index * 5.1) * 0.25
  return [base[0] + j, base[1] + j2]
}

function GoogleMapInner({ events, onEventSelect, onClose, selectedState }: MapViewProps) {
  const map = useMap()
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [locating, setLocating] = useState(false)
  const [locError, setLocError] = useState<string | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const hoveredEvent = hoveredId ? events.find((e) => e._id === hoveredId) : null

  function onPinEnter(id: string) {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
    setHoveredId(id)
  }

  function onPinLeave() {
    hoverTimeoutRef.current = setTimeout(() => setHoveredId(null), 150)
  }

  function onCardEnter() {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
  }

  function onCardLeave() {
    hoverTimeoutRef.current = setTimeout(() => setHoveredId(null), 150)
  }

  function flyTo(lat: number, lng: number, zoom: number) {
    if (!map) return
    map.panTo({ lat, lng })
    map.setZoom(zoom)
  }

  useEffect(() => {
    if (!selectedState || !map) return
    const coords = NIGERIA_STATE_COORDS[selectedState]
    if (coords) flyTo(coords[1], coords[0], 8)
  }, [selectedState, map])

  function handleNearMe() {
    if (!navigator.geolocation) {
      setLocError('Not supported')
      setTimeout(() => setLocError(null), 3000)
      return
    }
    setLocating(true)
    setLocError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { longitude, latitude } = pos.coords
        setUserLocation({ lat: latitude, lng: longitude })
        setLocating(false)
        flyTo(latitude, longitude, 11)
      },
      (err) => {
        setLocating(false)
        setLocError(err.code === err.PERMISSION_DENIED ? 'Location denied' : 'Unavailable')
        setTimeout(() => setLocError(null), 3000)
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    )
  }

  return (
    <>
      {/* Event avatar markers */}
      {events.map((event, i) => {
        const [lngVal, latVal] = getCoords(event, i)
        const pos = { lat: latVal, lng: lngVal }
        const isHovered = hoveredId === event._id
        const pinColor = getPinColor(event.category)

        return (
          <AdvancedMarker
            key={event._id}
            position={pos}
            onClick={() => onEventSelect(event._id)}
            zIndex={isHovered ? 10 : 1}
          >
            <div
              style={{
                position: 'relative',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
              onMouseEnter={() => onPinEnter(event._id)}
              onMouseLeave={() => onPinLeave()}
            >
              {/* Avatar circle */}
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: `3px solid ${isHovered ? pinColor : 'white'}`,
                  boxShadow: isHovered
                    ? `0 0 0 2px ${pinColor}, 0 2px 8px rgba(0,0,0,0.4)`
                    : '0 2px 8px rgba(0,0,0,0.4)',
                  transform: `scale(${isHovered ? 1.15 : 1})`,
                  transition: 'transform 200ms ease, border-color 150ms ease, box-shadow 150ms ease',
                  background: pinColor,
                  flexShrink: 0,
                }}
              >
                {event.coverImage ?? event.images?.[0] ? (
                  <img
                    src={event.coverImage ?? event.images![0]}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: 15,
                      fontWeight: 700,
                    }}
                  >
                    {(event.category?.[0] ?? '?').toUpperCase()}
                  </div>
                )}
              </div>
            </div>
          </AdvancedMarker>
        )
      })}

      {/* User location blue dot */}
      {userLocation && (
        <AdvancedMarker position={userLocation}>
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: '#3B82F6',
              border: '3px solid white',
              boxShadow: '0 0 0 6px rgba(59,130,246,0.25)',
              pointerEvents: 'none',
            }}
          />
        </AdvancedMarker>
      )}

      {/* Popup card (InfoWindow) */}
      {hoveredEvent && (() => {
        const [lngV, latV] = getCoords(hoveredEvent, events.indexOf(hoveredEvent))
        const hoveredPos = { lat: latV, lng: lngV }

        return (
          <InfoWindow key={hoveredEvent._id} position={hoveredPos} onCloseClick={() => setHoveredId(null)} pixelOffset={[0, -48]}>
            <div
              style={{ borderRadius: 8, overflow: 'hidden', background: '#fff', minWidth: '240px' }}
              onMouseEnter={onCardEnter}
              onMouseLeave={onCardLeave}
            >
              {/* Cover image */}
              {(hoveredEvent.coverImage ?? hoveredEvent.images?.[0]) && (
                <div style={{ height: 96, overflow: 'hidden' }}>
                  <img
                    src={hoveredEvent.coverImage ?? hoveredEvent.images[0]}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              )}
              <div style={{ padding: '10px 12px 12px' }}>
                {/* Category badge */}
                <span
                  style={{
                    display: 'inline-block',
                    marginBottom: 6,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: getPinColor(hoveredEvent.category),
                    background: getPinColor(hoveredEvent.category) + '22',
                    padding: '2px 7px',
                    borderRadius: 4,
                  }}
                >
                  {hoveredEvent.category}
                </span>
                {/* Event name */}
                <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 14, color: '#111', lineHeight: 1.3 }}>
                  {hoveredEvent.name}
                </p>
                {/* Date · Venue */}
                <p style={{ margin: '0 0 8px', fontSize: 12, color: '#666', lineHeight: 1.4 }}>
                  {formatDate(hoveredEvent.date)}
                  {hoveredEvent.venue ? ` · ${hoveredEvent.venue}` : ''}
                </p>
                {/* Price */}
                {hoveredEvent.ticketType?.length > 0 && (
                  <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: '#7C3AED' }}>
                    From {formatNaira(Math.min(...hoveredEvent.ticketType.map((t) => t.price)))}
                  </p>
                )}
                {/* CTA Button */}
                <button
                  onClick={() => onEventSelect(hoveredEvent._id)}
                  style={{
                    width: '100%',
                    padding: '9px',
                    borderRadius: 8,
                    background: getPinColor(hoveredEvent.category),
                    color: '#fff',
                    border: 'none',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    letterSpacing: '0.02em',
                    transition: 'opacity 150ms ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                >
                  View Event →
                </button>
              </div>
            </div>
          </InfoWindow>
        )
      })()}

      {/* Floating controls overlay */}
      <style>{`@keyframes __ct_spin { to { transform: rotate(360deg); } }`}</style>
      <div
        style={{
          position: 'absolute',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          display: 'flex',
          gap: 8,
        }}
      >
        {/* "Near me" button */}
        <button
          type="button"
          onClick={handleNearMe}
          disabled={locating}
          style={{
            padding: '10px 16px',
            borderRadius: 99,
            background: locError ? 'rgba(239,68,68,0.85)' : 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(8px)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.2)',
            fontSize: 13,
            fontWeight: 600,
            cursor: locating ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            opacity: locating ? 0.8 : 1,
            transition: 'background 150ms ease',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => {
            if (!locating && !locError) {
              e.currentTarget.style.background = 'rgba(0,0,0,0.85)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = locError ? 'rgba(239,68,68,0.85)' : 'rgba(0,0,0,0.75)'
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
          }}
        >
          {locating ? (
            <>
              <span
                style={{
                  display: 'inline-block',
                  animation: '__ct_spin 0.9s linear infinite',
                  fontSize: 14,
                }}
              >
                ◌
              </span>
              Locating…
            </>
          ) : locError ? (
            locError
          ) : (
            <>📍 Near me</>
          )}
        </button>

        {/* "List view" button */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px 20px',
              borderRadius: 99,
              background: 'rgba(0,0,0,0.75)',
              backdropFilter: 'blur(8px)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.2)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
              transition: 'background 150ms ease, border-color 150ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0,0,0,0.85)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0,0,0,0.75)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
            }}
          >
            ← List view
          </button>
        )}
      </div>
    </>
  )
}

export function GoogleMapView(props: MapViewProps) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <APIProvider apiKey={GOOGLE_KEY}>
        <Map
          defaultCenter={{ lat: 9.0820, lng: 8.6753 }}
          defaultZoom={6}
          mapId={MAP_ID}
          style={{ width: '100%', height: '100%' }}
          restriction={{
            latLngBounds: { north: 14.5, south: 3.5, east: 15.5, west: 2.5 },
            strictBounds: false,
          }}
          gestureHandling="greedy"
        >
          <GoogleMapInner {...props} />
        </Map>
      </APIProvider>
    </div>
  )
}
