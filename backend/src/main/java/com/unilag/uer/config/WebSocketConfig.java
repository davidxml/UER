package com.unilag.uer.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * Enables the STOMP messaging protocol over WebSocket for real-time
 * incident broadcasting. Clients connect to {@code /ws}, subscribe to
 * {@code /topic/incidents}, and send commands to {@code /app/*}.
 *
 * <h3>How the three zones work</h3>
 * <pre>
 *   ┌──────────┐  STOMP SEND   ┌──────────────┐  convertAndSend  ┌───────────┐
 *   │  Client  │ ───────────▶  │ /app/*       │ ───────────────▶ │ /topic/*  │
 *   │          │               │ (server cmd) │                  │ (broker)  │
 *   │          │ ◀─────────── │              │                  │           │
 *   │          │  STOMP MESSAGE│              │                  │           │
 *   └──────────┘               └──────────────┘                  └───────────┘
 *                                                                        │
 *                                                          all subscribers│
 *                                                              receive it ▼
 *                                                                    ┌──────────┐
 *                                                                    │  Client  │
 *                                                                    │          │
 *                                                                    └──────────┘
 * </pre>
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    /** Same origins as CORS (dev localhost default, deploy host overrides). */
    private final String[] allowedOrigins;

    public WebSocketConfig(@Value("${uer.cors.origins}") String[] allowedOrigins) {
        this.allowedOrigins = allowedOrigins;
    }

    /**
     * Configures the in-memory message broker. Clients subscribe to
     * destinations starting with {@code /topic} to receive broadcasts.
     * The {@code /app} prefix marks client-to-server destinations that
     * Spring routes to {@code @MessageMapping} handler methods.
     */
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic");
        config.setApplicationDestinationPrefixes("/app");
    }

    /**
     * Registers the STOMP handshake endpoint. This is the URL clients
     * connect to (e.g. {@code ws://localhost:8080/ws}). SockJS adds a
     * fallback layer for environments where native WebSocket is blocked.
     */
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOrigins(allowedOrigins)
                .withSockJS();
    }
}
