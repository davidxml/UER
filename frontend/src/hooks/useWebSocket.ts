import { useCallback, useEffect, useRef, useState } from 'react'
import { Client, type IMessage } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { readResponderSession } from '../responder/responderAuth'
import type { Incident } from '../shared/types'

// The backend registers /ws with SockJS, so the client must talk SockJS too —
// a raw WebSocket upgrade to /ws is rejected (the endpoint only negotiates the
// SockJS transports). In dev the /ws proxy forwards to :8080. In prod the
// SockJS URL points at the deployed backend (VITE_API_URL origin), not the
// Vercel origin — the frontend host has no /ws of its own.
const API_ORIGIN = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '')
const WS_URL = import.meta.env.DEV ? '/ws' : `${API_ORIGIN}/ws`

/**
 * Connects to the Spring Boot STOMP broker over SockJS and exposes:
 *
 * - `connected` — boolean, true when the STOMP handshake has completed
 * - `send(destination, body)` — publishes a message to an /app/* destination
 *
 * Every incident broadcast on `/topic/incidents` is parsed and passed to
 * `onIncidentUpdate`. The caller (IncidentContext) decides how to merge it
 * into the existing array.
 *
 * When a responder session (with a JWT) is present, the token is attached in
 * the STOMP CONNECT frame so the backend's StompAuthConfig authenticates the
 * session. Reporters connect anonymously and still receive broadcasts.
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
    // Read once at mount: the responder app mounts the dashboard AFTER login,
    // so the stored JWT is already available here. Reporters have no session.
    const session = readResponderSession()
    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      connectHeaders: session
        ? { Authorization: `Bearer ${session.token}` }
        : {},

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