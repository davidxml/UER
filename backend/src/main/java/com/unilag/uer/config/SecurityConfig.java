package com.unilag.uer.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.unilag.uer.auth.JwtAuthFilter;

/**
 * Security configuration:
 *
 * <ul>
 *   <li>CSRF disabled (stateless JSON API, JWT-based).</li>
 *   <li>Login and incident creation/list/detail are open so reporters can
 *       file and track incidents without an account (capstone).</li>
 *   <li>Status/severity mutations require a valid responder JWT (the
 *       RESPONDER role). This is what stops a script or a reporter from
 *       changing incident state — the real guard against abuse.</li>
 * </ul>
 *
 * In v2, reporter identity (matric/OTP) gets enforced here too, and the
 * shared PIN is replaced by per-department credentials.
 */
@Configuration
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> {})
            .csrf(csrf -> csrf.disable())
            // Stateless: every request is authenticated by the JWT filter.
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Responder login is public
                .requestMatchers("/api/v1/auth/**").permitAll()
                // Reporters can create and read incidents publicly (capstone)
                .requestMatchers(HttpMethod.POST, "/api/v1/incidents").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/incidents/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/incidents").permitAll()
                // Only responders may mutate status/severity
                .requestMatchers(HttpMethod.PATCH, "/api/v1/incidents/**").hasAuthority("RESPONDER")
                // WebSocket handshake must stay open so clients can connect
                .requestMatchers("/ws/**").permitAll()
                .anyRequest().permitAll()
            )
            // Run our JWT filter before the standard auth filter.
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
