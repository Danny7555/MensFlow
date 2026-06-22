import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { useAuth } from '../context/useAuth'
import { partnerApi, type ApiPing } from '../services/partnerService'
import { playNotificationSound } from '../lib/sound'
import { toast } from 'sonner'
import React from 'react'
import { HandWaving } from '@phosphor-icons/react'
import { decryptData } from '../lib/e2e'

interface PingItem {
  id: string
  label?: string
  message: string
  timestamp: number
  senderId?: string
}

let cachedLastPingProcessed: string | null = null
let cachedPingsListStr: string | null = null
const processedTimestamps = new Set<string>()

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

    const processReceivedPing = async (ping: ApiPing) => {
      const lastProcessed = getLastPingProcessed()
      if (lastProcessed === String(ping.timestamp)) return

      if (processedTimestamps.has(String(ping.timestamp))) return
      processedTimestamps.add(String(ping.timestamp))
      setLastPingProcessed(String(ping.timestamp))

      let message = ping.message || 'A new nudge was sent'
      const pairingCode = user?.role === 'lady'
        ? user?.partnerCode
        : localStorage.getItem('mensflow_e2ee_pairing_code:v1')

      if (pairingCode && message.startsWith('[E2E]:')) {
        try {
          message = await decryptData(message, pairingCode)
        } catch (e) {
          console.error('Failed to decrypt incoming E2EE partner ping', e)
        }
      }

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
          message,
          timestamp: ping.timestamp,
          senderId: ping.senderId
        })
        setPingsListStr(JSON.stringify(pingsList))
      }

      if (isAccessPing(ping.pingId)) {
        void fetchPartnerStatus()
      }

      window.dispatchEvent(new CustomEvent('mensflow_ping_received', { detail: { ...ping, message } }))

      if (ping.timestamp > mountTime.current - 15000) {
        const lbl = ping.label || 'Support'
        toast.info(user?.role === 'lady' ? "Support Update received!" : "Partner Update received!", {
          icon: React.createElement(HandWaving, { size: 16, weight: 'fill', className: 'text-amber-500' }),
          description: user?.role === 'lady' ? `Partner says: "${message}"` : `She is: "${lbl}" (${message})`,
          duration: 8000,
          action: {
            label: 'View',
            onClick: () => navigate('/dashboard'),
          },
        })
      }
    }

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
              setLastPingProcessed(String(ping.timestamp))
              return
            }
            void processReceivedPing(ping)
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
            void processReceivedPing(ping)
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
  }, [isAuthenticated, user?.id, user?.role, user?.partnerCode, incrementNotificationCount, fetchPartnerStatus, navigate])
}
