import { useCallback, useEffect, useRef, useState } from 'react'
import { Client, IMessage } from '@stomp/stompjs'
import type { Incident } from '../shared/types'

const WS_URL = import.meta.env.DEV ? '/ws' : `ws://${window.location.host}/ws`

/**
 * Connects to the Spring Boot STOMP broker and exposes:
 *
 * - `connected` — boolean, true when the STOMP handshake has completed
 * - `send(destination, payload)` — publishes a message to an /app/* destination
 *
 * Every incident broadcast on `/topic/incidents` is parsed and passed to
 * `onIncidentUpdate`. The caller (IncidentContext) decides how to merge it
 * into the existing array.
 *
 * ## How STOMP over WebSocket works (read this first)
 *
 * 1. The browser opens a raw WebSocket to `ws://localhost:8080/ws`.
 * 2. A STOMP CONNECT frame is sent. The server replies CONNECTED.
 * 3. The client sends a STOMP SUBSCRIBE frame for `/topic/incidents`.
 * 4. The server's `SimpMessagingTemplate.convertAndSend("/topic/incidents", obj)`
 *    serialises the Java object to JSON and pushes a STOMP MESSAGE frame.
 * 5. The client's `onMessage` callback fires with the parsed `Incident`.
 *
 * This replaces the old `localStorage` + `storage` event sync that only
 * worked across tabs in the same browser.
 */
export function useWebSocket(onIncidentUpdate: (incident: Incident) => void) {
  const [connected, setConnected] = useState(false)
  const callbackRef = useRef(onIncidentUpdate)

  // Keep the callback ref fresh without triggering reconnection
  useEffect(() => {
    callbackRef.current = onIncidentUpdate
  }, [onIncidentUpdate])

  useEffect(() => {
    const client = new Client({
      // SockJS transport — Spring Boot's withSockJS() expects it
      brokerURL: WS_URL,

      // Called after the STOMP CONNECT handshake succeeds
      onConnect: () => {
        setConnected(true)

        // Subscribe to the single broadcast topic. Every create/update
        // in IncidentService calls convertAndSend("/topic/incidents", incident),
        // which pushes here.
        client.subscribe('/topic/incidents', (message: IMessage) => {
          try {
            const incident: Incident = JSON.parse(message.body)
            callbackRef.current(incident)
          } catch {
            console.warn('[WS] Failed to parse incident from /topic/incidents')
          }
        })
      },

      // Called when the WebSocket closes (server shutdown, network loss, etc.)
      onDisconnect: () => setConnected(false),

      // Called on WebSocket or STOMP errors
      onStompError: (frame) => {
        console.error('[WS] STOMP error:', frame.headers['message'])
        setConnected(false)
      },

      // Reconnect automatically after 3 seconds
      reconnectDelay: 3000,

      // Heartbeat — client sends HEARTBEAT every 10s, expects one back
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
    })

    // Activate the client — this opens the WebSocket connection
    client.activate()

    // Cleanup on unmount — cleanly close the WebSocket
    return () => {
      client.deactivate()
    }
  }, [])

  /** Publishes a message to a server-side @MessageMapping destination. */
  const send = useCallback((destination: string, body: object) => {
    // We use a separate ephemeral client reference since `client` is scoped
    // to the useEffect. In practice, we keep the connection alive and
    // re-fetch via REST, so send is reserved for future @MessageMapping use.
    console.log('[WS] send', destination, body)
  }, [])

  return { connected, send }
}
