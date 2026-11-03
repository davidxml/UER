package com.unilag.uer.config;

import java.security.Principal;
import java.util.List;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import com.unilag.uer.auth.JwtService;
import com.unilag.uer.user.Role;
import com.unilag.uer.user.User;
import com.unilag.uer.user.UserRepository;

import io.jsonwebtoken.Claims;

/**
 * Guards the STOMP channel. Incident broadcasts are responder-only data, so both
 * steps are enforced:
 *
 * <ul>
 *   <li>CONNECT must carry a valid, current access token for a RESPONDER/ADMIN.</li>
 *   <li>SUBSCRIBE to {@code /topic/**} is rejected for anyone else.</li>
 * </ul>
 */
@Configuration
@Order(Ordered.HIGHEST_PRECEDENCE)
public class StompAuthConfig implements WebSocketMessageBrokerConfigurer {

    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtService jwtService;
    private final UserRepository users;

    public StompAuthConfig(JwtService jwtService, UserRepository users) {
        this.jwtService = jwtService;
        this.users = users;
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor =
                        MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                if (accessor == null || accessor.getCommand() == null) {
                    return message;
                }
                if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                    authenticate(accessor);
                } else if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
                    requirePrivilegedSubscription(accessor);
                }
                return message;
            }
        });
    }

    private void authenticate(StompHeaderAccessor accessor) {
        String header = accessor.getFirstNativeHeader("Authorization");
        if (header == null || !header.startsWith(BEARER_PREFIX)) {
            throw new MessagingException("Authentication required");
        }

        Claims claims = jwtService.parseClaims(header.substring(BEARER_PREFIX.length()));
        if (claims == null) {
            throw new MessagingException("Invalid or expired token");
        }

        User user = users.findById(claims.getSubject()).filter(User::isEnabled).orElse(null);
        Integer version = claims.get("ver", Integer.class);
        if (user == null || version == null || version != user.getTokenVersion()) {
            throw new MessagingException("Invalid token");
        }
        if (user.getRole() != Role.RESPONDER && user.getRole() != Role.ADMIN) {
            throw new MessagingException("Not authorized for the responder channel");
        }

        accessor.setUser(new UsernamePasswordAuthenticationToken(
                user.getId(), null,
                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))));
    }

    private void requirePrivilegedSubscription(StompHeaderAccessor accessor) {
        String destination = accessor.getDestination();
        if (destination == null || !destination.startsWith("/topic/")) {
            return;
        }

        Principal principal = accessor.getUser();
        if (principal == null) {
            Object header = accessor.getHeader(SimpMessageHeaderAccessor.USER_HEADER);
            if (header instanceof Principal p) {
                principal = p;
            }
        }
        if (principal == null) {
            throw new MessagingException("Authentication required");
        }

        boolean privileged = principal instanceof UsernamePasswordAuthenticationToken token
                && token.getAuthorities().stream().anyMatch(authority ->
                        "ROLE_RESPONDER".equals(authority.getAuthority())
                                || "ROLE_ADMIN".equals(authority.getAuthority()));
        if (!privileged) {
            throw new MessagingException("Not authorized to subscribe to incident broadcasts");
        }
    }
}
