'use client'

import { useCallback, useSyncExternalStore } from 'react'

const STORAGE_KEY = 'prythia_alerts'

export interface LocalAlert {
  id: string
  eventId: string
  eventTitle: string
  alertType: 'threshold_cross' | 'movement' | 'divergence'
  condition: {
    threshold: number
    direction?: 'above' | 'below'
  }
  isActive: boolean
  createdAt: string
  lastTriggeredAt: string | null
  triggerCount: number
}

let cachedAlerts: LocalAlert[] = []

function hydrate() {
  if (typeof window === 'undefined') return
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    cachedAlerts = raw ? JSON.parse(raw) : []
  } catch {
    cachedAlerts = []
  }
}

if (typeof window !== 'undefined') {
  hydrate()
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      hydrate()
      listeners.forEach((l) => l())
    }
  })
}

let listeners: Array<() => void> = []

function getSnapshot(): LocalAlert[] {
  return cachedAlerts
}

function getServerSnapshot(): LocalAlert[] {
  return []
}

function subscribe(listener: () => void) {
  listeners.push(listener)
  return () => {
    listeners = listeners.filter((l) => l !== listener)
  }
}

function setStoredAlerts(alerts: LocalAlert[]) {
  cachedAlerts = alerts
  localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts))
  listeners.forEach((l) => l())
}

export function useAlerts() {
  const alerts = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const addAlert = useCallback((alert: Omit<LocalAlert, 'id' | 'createdAt' | 'lastTriggeredAt' | 'triggerCount'>) => {
    const newAlert: LocalAlert = {
      ...alert,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      lastTriggeredAt: null,
      triggerCount: 0,
    }
    setStoredAlerts([...cachedAlerts, newAlert])
  }, [])

  const removeAlert = useCallback((id: string) => {
    setStoredAlerts(cachedAlerts.filter((a) => a.id !== id))
  }, [])

  const toggleAlert = useCallback((id: string) => {
    setStoredAlerts(
      cachedAlerts.map((a) =>
        a.id === id ? { ...a, isActive: !a.isActive } : a
      )
    )
  }, [])

  const clearAlerts = useCallback(() => {
    setStoredAlerts([])
  }, [])

  return { alerts, addAlert, removeAlert, toggleAlert, clearAlerts }
}
