package com.unilag.uer.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

import com.unilag.uer.user.Role;
import com.unilag.uer.user.User;

import io.jsonwebtoken.Claims;

class JwtServiceTest {

    private static final String SECRET = "0123456789abcdef0123456789abcdef";
    private static final long TTL = 300_000L;

    @Test
    void roundTripsIdentityAndRoleClaims() {
        JwtService service = new JwtService(SECRET, TTL);
        User responder = User.builder()
                .id("user-1")
                .role(Role.RESPONDER)
                .department("Fire Station")
                .tokenVersion(3)
                .enabled(true)
                .build();

        Claims claims = service.parseClaims(service.generateAccessToken(responder));

        assertNotNull(claims);
        assertEquals("user-1", claims.getSubject());
        assertEquals("RESPONDER", claims.get("role", String.class));
        assertEquals("Fire Station", claims.get("dept", String.class));
        assertEquals(3, claims.get("ver", Integer.class));
    }

    @Test
    void omitsDepartmentForStudents() {
        JwtService service = new JwtService(SECRET, TTL);
        User student = User.builder().id("user-2").role(Role.REPORTER).tokenVersion(0).build();

        Claims claims = service.parseClaims(service.generateAccessToken(student));

        assertNotNull(claims);
        assertNull(claims.get("dept", String.class));
    }

    @Test
    void rejectsTamperedToken() {
        JwtService service = new JwtService(SECRET, TTL);
        User user = User.builder().id("user-3").role(Role.REPORTER).tokenVersion(0).build();
        String token = service.generateAccessToken(user);

        assertNull(service.parseClaims(token + "x"));
    }

    @Test
    void rejectsSecretShorterThanHs256Minimum() {
        assertThrows(IllegalStateException.class, () -> new JwtService("too-short", TTL));
    }
}
