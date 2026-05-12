'use client'

import { useEffect, useRef, useState } from 'react'

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const WS_ENDPOINT = `${WS_BASE.replace(/\/$/, '')}/ws/live`
const LATEST_API = `${API_BASE.replace(/\/$/, '')}/api/sensors/latest`

export function useLiveSensorData() {
  const [data, setData] = useState<any>(null)
  const [status, setStatus] = useState<'connecting'|'connected'|'disconnected'|'error'>('connecting')
  const [lastTs, setLastTs] = useState<Date | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const pingTimer = useRef<number | null>(null)
  const reconnectTimer = useRef<number | null>(null)

  useEffect(() => {
    let mounted = true

    const loadLatest = async () => {
      try {
        const res = await fetch(LATEST_API)
        if (!res.ok) return
        const json = await res.json()
        if (mounted && json) {
          setData(json)
          setLastTs(new Date())
        }
      } catch {
        // ignore initial fetch errors
      }
    }

    const connect = () => {
      if (!mounted) return

      setStatus('connecting')
      const ws = new WebSocket(WS_ENDPOINT)
      wsRef.current = ws

      ws.onopen = () => {
        if (!mounted) return
        setStatus('connected')
        if (pingTimer.current) window.clearInterval(pingTimer.current)
        pingTimer.current = window.setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send('ping')
          }
        }, 15000)
      }

      ws.onmessage = (event) => {
        if (!mounted) return
        try {
          const payload = JSON.parse(event.data)
          if (payload?.type === 'keepalive') {
            return
          }
          setData(payload)
          setLastTs(new Date())
        } catch {
          // ignore malformed messages
        }
      }

      ws.onclose = () => {
        if (!mounted) return
        setStatus('disconnected')
        if (pingTimer.current) {
          window.clearInterval(pingTimer.current)
          pingTimer.current = null
        }
        if (reconnectTimer.current) {
          window.clearTimeout(reconnectTimer.current)
        }
        reconnectTimer.current = window.setTimeout(() => {
          connect()
        }, 3000)
      }

      ws.onerror = () => {
        if (!mounted) return
        setStatus('error')
      }
    }

    loadLatest()
    connect()

    return () => {
      mounted = false
      if (pingTimer.current) {
        window.clearInterval(pingTimer.current)
      }
      if (reconnectTimer.current) {
        window.clearTimeout(reconnectTimer.current)
      }
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close()
      }
    }
  }, [])

  return { data, status, lastTs }
}
