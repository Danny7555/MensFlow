import { useEffect, useRef } from 'react'
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

export function useNotificationsListener() {
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
      if (e && e.key && e.key !== 'mensflow_partner_ping:v1') return
      try {
        const pingStr = localStorage.getItem('mensflow_partner_ping:v1')
        if (pingStr) {
          const ping = JSON.parse(pingStr)
          if (ping && ping.timestamp) {
            if (ping.senderId && ping.senderId === (user?.id || 'guest')) {
              return
            }
            const lastProcessed = localStorage.getItem('mensflow_last_ping_processed:v1')
            if (lastProcessed !== String(ping.timestamp)) {
              localStorage.setItem('mensflow_last_ping_processed:v1', String(ping.timestamp))
              
              // Increment the count
              incrementNotificationCount()
              
              // Play notification sound
              playNotificationSound()

              const pingsListStr = localStorage.getItem('mensflow_received_pings_list:v1') || '[]'
              const pingsList = JSON.parse(pingsListStr) as PingItem[]
              if (!pingsList.some((p) => p.timestamp === ping.timestamp)) {
                pingsList.push({
                  id: ping.pingId || `ping-${ping.timestamp}`,
                  label: ping.label,
                  message: ping.message,
                  timestamp: ping.timestamp,
                  senderId: ping.senderId
                })
                localStorage.setItem('mensflow_received_pings_list:v1', JSON.stringify(pingsList))
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
            const lastProcessed = localStorage.getItem('mensflow_last_ping_processed:v1')
            if (lastProcessed !== String(ping.timestamp)) {
              localStorage.setItem('mensflow_last_ping_processed:v1', String(ping.timestamp))
              
              // Increment count
              incrementNotificationCount()
              
              // Play sound
              playNotificationSound()

              const pingsListStr = localStorage.getItem('mensflow_received_pings_list:v1') || '[]'
              const pingsList = JSON.parse(pingsListStr) as PingItem[]
              if (!pingsList.some((p) => p.timestamp === ping.timestamp)) {
                pingsList.push({
                  id: ping.pingId || `ping-${ping.timestamp}`,
                  label: ping.label,
                  message: ping.message,
                  timestamp: ping.timestamp,
                  senderId: ping.senderId
                })
                localStorage.setItem('mensflow_received_pings_list:v1', JSON.stringify(pingsList))
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
  }, [isAuthenticated, user?.id, user?.role, incrementNotificationCount, fetchPartnerStatus])
}
