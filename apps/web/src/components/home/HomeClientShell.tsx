'use client'

import { useState } from 'react'
import { CityHeaderSection } from '@/components/home/CityHeaderSection'

export function HomeClientShell() {
  const [selectedCity, setSelectedCity] = useState('Lagos')

  return (
    <CityHeaderSection
      selectedCity={selectedCity}
      onCityChange={setSelectedCity}
    />
  )
}
