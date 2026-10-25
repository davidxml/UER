package com.unilag.uer.auth;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.unilag.uer.user.User;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

/**
 * Issues and validates short-lived (5 min) access tokens.
 *
 * <p>Claims: {@code sub} = user id (stable), {@code role}, {@code dept} for
 * responders, and {@code ver} = the user's token version. The version lets the
 * API reject tokens issued before a password reset or account disable.</p>
 */
@Service
public class JwtService {

    private final SecretKey key;
    private final long ttlMillis;

    public JwtService(
            @Value("${uer.jwt.secret}") String secret,
            @Value("${uer.jwt.ttl-ms:300000}") long ttlMillis) {
        byte[] secretBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (secretBytes.length < 32) {
            throw new IllegalStateException(
                    "uer.jwt.secret must be at least 32 characters for HS256. Set JWT_SECRET.");
        }
        this.key = Keys.hmacShaKeyFor(secretBytes);
        this.ttlMillis = ttlMillis;
    }

    public String generateAccessToken(User user) {
        Date now = new Date();
        var builder = Jwts.builder()
                .subject(user.getId())
                .claim("role", user.getRole().name())
                .claim("ver", user.getTokenVersion())
                .issuedAt(now)
                .expiration(new Date(now.getTime() + ttlMillis));

        if (user.getDepartment() != null) {
            builder.claim("dept", user.getDepartment());
        }
        return builder.signWith(key).compact();
    }

    /** @return verified claims, or {@code null} for tampered/expired/malformed tokens. */
    public Claims parseClaims(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (Exception e) {
            return null;
        }
    }

    public long getTtlMillis() {
        return ttlMillis;
    }
}
