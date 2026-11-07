package com.unilag.uer.auth;

import java.io.IOException;
import java.util.List;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.unilag.uer.user.User;
import com.unilag.uer.user.UserRepository;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Authenticates {@code Authorization: Bearer <access token>} requests.
 *
 * <p>Because access tokens live for only five minutes, the filter also verifies
 * the account still exists, is enabled, and carries the same {@code tokenVersion}
 * that was signed into the token. A password reset or account disable therefore
 * invalidates existing tokens immediately.</p>
 */
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtService jwtService;
    private final UserRepository users;

    public JwtAuthFilter(JwtService jwtService, UserRepository users) {
        this.jwtService = jwtService;
        this.users = users;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain chain) throws ServletException, IOException {

        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith(BEARER_PREFIX)
                && SecurityContextHolder.getContext().getAuthentication() == null) {

            Claims claims = jwtService.parseClaims(header.substring(BEARER_PREFIX.length()));
            if (claims != null) {
                users.findById(claims.getSubject())
                        .filter(User::isEnabled)
                        .filter(user -> {
                            Integer version = claims.get("ver", Integer.class);
                            return version != null && version == user.getTokenVersion();
                        })
                        .ifPresent(this::authenticate);
            }
        }

        chain.doFilter(request, response);
    }

    private void authenticate(User user) {
        var authority = new SimpleGrantedAuthority("ROLE_" + user.getRole().name());
        var authentication = new UsernamePasswordAuthenticationToken(
                user.getId(), null, List.of(authority));
        // Responders carry their unit for ownership checks in the service layer.
        authentication.setDetails(user.getDepartment());
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }
}
