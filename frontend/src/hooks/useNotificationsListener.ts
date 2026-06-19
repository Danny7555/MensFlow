import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { useAuth } from '../context/useAuth'
import { partnerApi } from '../services/partnerService'
import { playNotificationSound } from '../lib/sound'
import { toast } from 'sonner'
import React from 'react'
import { HandWaving } from '@phosphor-icons/react'

interface PingItem {
  id: string
  label?: string
  message: string
  timestamp: number
  senderId?: string
}

let cachedLastPingProcessed: string | null = null
let cachedPingsListStr: string | null = null

const getLastPingProcessed = (): string | null => {
  if (cachedLastPingProcessed === null) {
    cachedLastPingProcessed = localStorage.getItem('mensflow_last_ping_processed:v1')
  }
  return cachedLastPingProcessed
}

const setLastPingProcessed = (val: string) => {
  cachedLastPingProcessed = val
  localStorage.setItem('mensflow_last_ping_processed:v1', val)
}

const getPingsListStr = (): string => {
  if (cachedPingsListStr === null) {
    cachedPingsListStr = localStorage.getItem('mensflow_received_pings_list:v1') || '[]'
  }
  return cachedPingsListStr
}

const setPingsListStr = (val: string) => {
  cachedPingsListStr = val
  localStorage.setItem('mensflow_received_pings_list:v1', val)
}

export function useNotificationsListener() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { user, incrementNotificationCount, fetchPartnerStatus } = useStore()
  const mountTime = useRef<number>(0)

  useEffect(() => {
    mountTime.current = Date.now()
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return

    let active = true
    const isAccessPing = (pingId?: string) => Boolean(pingId?.startsWith('access-'))

    const handlePingEvent = (e?: StorageEvent) => {
      if (e && e.key) {
        if (e.key === 'mensflow_last_ping_processed:v1') {
          cachedLastPingProcessed = e.newValue
        } else if (e.key === 'mensflow_received_pings_list:v1') {
          cachedPingsListStr = e.newValue
        }
        if (e.key !== 'mensflow_partner_ping:v1') return
      }
      
      // invalidate memory cache for safety
      cachedLastPingProcessed = null
      cachedPingsListStr = null

      try {
        const pingStr = localStorage.getItem('mensflow_partner_ping:v1')
        if (pingStr) {
          const ping = JSON.parse(pingStr)
          if (ping && ping.timestamp) {
            if (ping.senderId && ping.senderId === (user?.id || 'guest')) {
              return
            }
            const lastProcessed = getLastPingProcessed()
            if (lastProcessed !== String(ping.timestamp)) {
              setLastPingProcessed(String(ping.timestamp))
              
              // Increment the count
              incrementNotificationCount()
              
              // Play notification sound
              playNotificationSound()

              const pingsListStr = getPingsListStr()
              const pingsList = JSON.parse(pingsListStr) as PingItem[]
              if (!pingsList.some((p) => p.timestamp === ping.timestamp)) {
                pingsList.push({
                  id: ping.pingId || `ping-${ping.timestamp}`,
                  label: ping.label,
                  message: ping.message,
                  timestamp: ping.timestamp,
                  senderId: ping.senderId
                })
                setPingsListStr(JSON.stringify(pingsList))
              }

              // Invalidate partner status & trigger custom event for local components
              if (isAccessPing(ping.pingId)) {
                void fetchPartnerStatus()
              }
              
              // Dispatch custom DOM event
              window.dispatchEvent(new CustomEvent('mensflow_ping_received', { detail: ping }))

              // Only toast if the message is fresh
              if (ping.timestamp > mountTime.current - 15000) {
                toast.info(user?.role === 'lady' ? "Support Update received!" : "Partner Update received!", {
                  icon: React.createElement(HandWaving, { size: 16, weight: 'fill', className: 'text-amber-500' }),
                  description: user?.role === 'lady' ? `Partner says: "${ping.message}"` : `She is: "${ping.label}" (${ping.message})`,
                  duration: 8000,
                  action: {
                    label: 'View',
                    onClick: () => navigate('/dashboard'),
                  },
                })
              }
            }
          }
        }
      } catch (err) {
        console.error("Failed to parse local storage ping", err)
      }
    }

    window.addEventListener('storage', handlePingEvent as EventListener)

    // Trigger check immediately in case storage is already set or on initial mount
    handlePingEvent()

    const checkLatestPing = () => {
      partnerApi.getLatestPing()
        .then((ping) => {
          if (!active) return
          if (ping) {
            const lastProcessed = getLastPingProcessed()
            if (lastProcessed !== String(ping.timestamp)) {
              setLastPingProcessed(String(ping.timestamp))
              
              // Increment count
              incrementNotificationCount()
              
              // Play sound
              playNotificationSound()

              const pingsListStr = getPingsListStr()
              const pingsList = JSON.parse(pingsListStr) as PingItem[]
              if (!pingsList.some((p) => p.timestamp === ping.timestamp)) {
                pingsList.push({
                  id: ping.pingId || `ping-${ping.timestamp}`,
                  label: ping.label,
                  message: ping.message,
                  timestamp: ping.timestamp,
                  senderId: ping.senderId
                })
                setPingsListStr(JSON.stringify(pingsList))
              }

              if (isAccessPing(ping.pingId)) {
                void fetchPartnerStatus()
              }

              window.dispatchEvent(new CustomEvent('mensflow_ping_received', { detail: ping }))

              if (ping.timestamp > mountTime.current - 15000) {
                toast.info(user?.role === 'lady' ? "Support Update received!" : "Partner Update received!", {
                  icon: React.createElement(HandWaving, { size: 16, weight: 'fill', className: 'text-amber-500' }),
                  description: user?.role === 'lady' ? `Partner says: "${ping.message}"` : `She is: "${ping.label}" (${ping.message})`,
                  duration: 8000,
                })
              }
            }
          }
        })
        .catch((e) => console.error("Failed to fetch latest partner ping", e))
    }

    checkLatestPing()
    const interval = setInterval(checkLatestPing, 10000)

    return () => {
      active = false
      window.removeEventListener('storage', handlePingEvent as EventListener)
      clearInterval(interval)
    }
  }, [isAuthenticated, user?.id, user?.role, incrementNotificationCount, fetchPartnerStatus, navigate])
}
