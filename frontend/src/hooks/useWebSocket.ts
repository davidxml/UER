import { useCallback, useEffect, useRef, useState } from 'react'
import { Client, IMessage } from '@stomp/stompjs'
import type { Incident } from '../shared/types'

const WS_URL = import.meta.env.DEV ? '/ws' : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`

/**
 * Connects to the Spring Boot STOMP broker and exposes:
 *
 * - `connected` — boolean, true when the STOMP handshake has completed
 * - `send(destination, body)` — publishes a message to an /app/* destination
 *
 * Every incident broadcast on `/topic/incidents` is parsed and passed to
 * `onIncidentUpdate`. The caller (IncidentContext) decides how to merge it
 * into the existing array.
 */
export function useWebSocket(onIncidentUpdate: (incident: Incident) => void) {
  const [connected, setConnected] = useState(false)
  const clientRef = useRef<Client | null>(null)
  const callbackRef = useRef(onIncidentUpdate)

  // Keep the callback ref fresh without triggering reconnection
  useEffect(() => {
    callbackRef.current = onIncidentUpdate
  }, [onIncidentUpdate])

  useEffect(() => {
    const client = new Client({
      brokerURL: WS_URL,

      onConnect: () => {
        setConnected(true)
        client.subscribe('/topic/incidents', (message: IMessage) => {
          try {
            const incident: Incident = JSON.parse(message.body)
            callbackRef.current(incident)
          } catch {
            console.warn('[WS] Failed to parse incident from /topic/incidents')
          }
        })
      },

      onDisconnect: () => setConnected(false),

      onStompError: (frame) => {
        console.error('[WS] STOMP error:', frame.headers['message'])
        setConnected(false)
      },

      reconnectDelay: 3000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
    })

    clientRef.current = client
    client.activate()

    return () => {
      client.deactivate()
      clientRef.current = null
    }
  }, [])

  /** Publishes a message to a server-side @MessageMapping destination. */
  const send = useCallback((destination: string, body: object) => {
    clientRef.current?.publish({
      destination,
      body: JSON.stringify(body),
    })
  }, [])

  return { connected, send }
}
