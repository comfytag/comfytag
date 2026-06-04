'use client'

import type { MapViewProps } from './MapLibreMapView'
import { GoogleMapView } from './GoogleMapView'
import { MapLibreMapView } from './MapLibreMapView'

export type { MapViewProps }

const HAS_GOOGLE_KEY = Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)

export function MapView(props: MapViewProps) {
  return HAS_GOOGLE_KEY
    ? <GoogleMapView {...props} />
    : <MapLibreMapView {...props} />
}
