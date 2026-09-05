package com.unilag.uer.auth;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

/**
 * Creates and validates signed JWTs for responder sessions. The signing key
 * is read from the {@code JWT_SECRET} environment variable (32+ chars for
 * HS256) so it never lives in source control. In v2 this should move to a
 * secrets manager.
 */
@Service
public class JwtService {

    private final SecretKey key;
    private final long ttlMillis;

    public JwtService(
            @Value("${uer.jwt.secret}") String secret,
            @Value("${uer.jwt.ttl-ms:86400000}") long ttlMillis) {
        byte[] secretBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (secretBytes.length < 32) {
            throw new IllegalStateException(
                    "uer.jwt.secret must be at least 32 characters for HS256. Set JWT_SECRET.");
        }
        this.key = Keys.hmacShaKeyFor(secretBytes);
        this.ttlMillis = ttlMillis;
    }

    /** Builds a signed token carrying the department as the principal name. */
    public String generateToken(String department) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + ttlMillis);
        return Jwts.builder()
                .subject(department)
                .claim("role", "RESPONDER")
                .issuedAt(now)
                .expiration(expiry)
                .signWith(key)
                .compact();
    }

    /** @return the subject (department) if the token is valid, else null. */
    public String parseSubject(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            return claims.getSubject();
        } catch (Exception e) {
            return null;
        }
    }
}
