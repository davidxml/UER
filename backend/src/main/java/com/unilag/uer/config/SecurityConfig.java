package com.unilag.uer.config;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.unilag.uer.auth.JwtAuthFilter;

import jakarta.servlet.http.HttpServletResponse;

/**
 * Stateless, JWT-based security.
 *
 * <ul>
 *   <li>Auth endpoints are public; everything else needs a token.</li>
 *   <li>Students (REPORTER) may create incidents and read their own.</li>
 *   <li>Only responders/admins may read the incident feed or mutate state.</li>
 *   <li>Account provisioning is ADMIN-only.</li>
 * </ul>
 */
@Configuration
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final int bcryptStrength;

    public SecurityConfig(
            JwtAuthFilter jwtAuthFilter,
            @Value("${uer.security.bcrypt-strength:12}") int bcryptStrength) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.bcryptStrength = bcryptStrength;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(bcryptStrength);
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> {})
            .csrf(csrf -> csrf.disable())
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(ex -> ex
                    .authenticationEntryPoint((request, response, authException) ->
                            writeError(response, HttpServletResponse.SC_UNAUTHORIZED,
                                    "Authentication required"))
                    .accessDeniedHandler((request, response, accessDeniedException) ->
                            writeError(response, HttpServletResponse.SC_FORBIDDEN,
                                    "You do not have access to this resource")))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/error").permitAll()
                // Unauthenticated liveness probe for the hosting platform.
                .requestMatchers(HttpMethod.GET, "/api/v1/health").permitAll()
                // Public auth endpoints and the WebSocket handshake (STOMP CONNECT
                // performs its own token check).
                .requestMatchers("/api/v1/auth/**").permitAll()
                .requestMatchers("/ws/**").permitAll()
                // Account administration.
                .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                // Students report; responders and admins consume.
                .requestMatchers(HttpMethod.POST, "/api/v1/incidents").hasRole("REPORTER")
                .requestMatchers(HttpMethod.GET, "/api/v1/incidents/mine").hasRole("REPORTER")
                .requestMatchers(HttpMethod.GET, "/api/v1/incidents/**").hasAnyRole("RESPONDER", "ADMIN")
                .requestMatchers(HttpMethod.PATCH, "/api/v1/incidents/**").hasAnyRole("RESPONDER", "ADMIN")
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    private static void writeError(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.getWriter().write("{\"message\":\"" + message + "\"}");
    }
}
