'use client'

import { useState, useCallback, useEffect } from 'react'

export type Density = 'compact' | 'default' | 'expanded'

const STORAGE_KEY = 'prythia-density'
const DENSITY_CYCLE: Density[] = ['compact', 'default', 'expanded']

export function useDensity() {
  const [density, setDensityState] = useState<Density>('default')

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Density | null
    if (stored && DENSITY_CYCLE.includes(stored)) {
      setDensityState(stored)
    }
  }, [])

  const setDensity = useCallback((d: Density) => {
    setDensityState(d)
    localStorage.setItem(STORAGE_KEY, d)
  }, [])

  const cycleDensity = useCallback(() => {
    setDensityState((current) => {
      const idx = DENSITY_CYCLE.indexOf(current)
      const next = DENSITY_CYCLE[(idx + 1) % DENSITY_CYCLE.length]
      localStorage.setItem(STORAGE_KEY, next)
      return next
    })
  }, [])

  return { density, setDensity, cycleDensity }
}
