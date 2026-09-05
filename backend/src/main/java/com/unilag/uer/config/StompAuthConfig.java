package com.unilag.uer.config;

import java.util.List;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import com.unilag.uer.auth.JwtService;

/**
 * Authenticates STOMP CONNECT frames. The STOMP client sends its JWT in the
 * {@code Authorization} header of the CONNECT frame; on success the session
 * is given a RESPONDER identity, which gates the /topic/* subscriptions in
 * WebSocketConfig.
 *
 * This closes the "anyone can connect and sniff incident broadcasts" hole.
 */
@Configuration
@Order(Ordered.HIGHEST_PRECEDENCE)
public class StompAuthConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtService jwtService;

    public StompAuthConfig(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor =
                        MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
                    String auth = accessor.getFirstNativeHeader("Authorization");
                    if (auth != null && auth.startsWith("Bearer ")) {
                        String department = jwtService.parseSubject(auth.substring(7));
                        if (department != null) {
                            accessor.setUser(new UsernamePasswordAuthenticationToken(
                                    department, null,
                                    List.of(new SimpleGrantedAuthority("RESPONDER"))));
                        }
                    }
                }
                return message;
            }
        });
    }
}
