'use client'

import { useState, useEffect } from 'react'
import { CityHeaderSection } from '@/components/home/CityHeaderSection'

export function HomeClientShell() {
  const [selectedCity, setSelectedCity] = useState('Lagos')

  // Restore city from localStorage on mount
  useEffect(() => {
    const savedCity = localStorage.getItem('comfytag_city')
    if (savedCity) {
      setSelectedCity(savedCity)
    }
  }, [])

  return (
    <CityHeaderSection
      selectedCity={selectedCity}
      onCityChange={setSelectedCity}
    />
  )
}
