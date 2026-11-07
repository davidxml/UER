package com.unilag.uer.auth;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.unilag.uer.auth.dto.AuthResponse;
import com.unilag.uer.auth.dto.UserDto;
import com.unilag.uer.user.Role;
import com.unilag.uer.user.User;
import com.unilag.uer.user.UserRepository;

/**
 * Issues access + refresh token pairs and rotates refresh tokens.
 *
 * <ul>
 *   <li>Refresh tokens are 256-bit random values; only their SHA-256 hash is
 *       stored.</li>
 *   <li>Every refresh rotates the token; the previous one is revoked.</li>
 *   <li>Presenting an already-revoked token revokes the whole family (theft
 *       detection).</li>
 *   <li>Students keep a session for 14 days; staff for 18 hours (one shift).</li>
 * </ul>
 */
@Service
public class RefreshTokenService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final RefreshTokenRepository repository;
    private final UserRepository users;
    private final JwtService jwtService;
    private final long studentTtlMs;
    private final long staffTtlMs;

    public RefreshTokenService(
            RefreshTokenRepository repository,
            UserRepository users,
            JwtService jwtService,
            @Value("${uer.refresh.student-ttl-ms:1209600000}") long studentTtlMs,
            @Value("${uer.refresh.staff-ttl-ms:64800000}") long staffTtlMs) {
        this.repository = repository;
        this.users = users;
        this.jwtService = jwtService;
        this.studentTtlMs = studentTtlMs;
        this.staffTtlMs = staffTtlMs;
    }

    @Transactional
    public AuthResponse issue(User user) {
        return issueInFamily(user, UUID.randomUUID().toString());
    }

    /**
     * Validates and rotates a refresh token. Bad credentials are not rolled
     * back so that failed-attempt and family-revocation writes survive.
     */
    @Transactional(noRollbackFor = BadCredentialsException.class)
    public AuthResponse rotate(String rawToken) {
        RefreshToken current = repository.findByTokenHash(sha256(rawToken))
                .orElseThrow(() -> new BadCredentialsException("Invalid refresh token"));

        if (current.getRevokedAt() != null) {
            revokeFamily(current.getFamilyId());
            throw new BadCredentialsException("Refresh token has already been used");
        }

        Instant now = Instant.now();
        if (!current.getExpiresAt().isAfter(now)) {
            throw new BadCredentialsException("Refresh token has expired");
        }

        User user = users.findById(current.getUserId()).orElse(null);
        if (user == null || !user.isEnabled()) {
            revokeFamily(current.getFamilyId());
            throw new BadCredentialsException("Invalid refresh token");
        }

        String newRaw = newRawToken();
        RefreshToken next = buildToken(user, newRaw, current.getFamilyId(), now);

        current.setRevokedAt(now);
        current.setReplacedBy(next.getId());
        repository.save(current);
        repository.save(next);

        return new AuthResponse(jwtService.generateAccessToken(user), newRaw, UserDto.from(user));
    }

    @Transactional
    public void logout(String rawToken) {
        repository.findByTokenHash(sha256(rawToken))
                .ifPresent(token -> revokeFamily(token.getFamilyId()));
    }

    @Transactional
    public void revokeAllForUser(String userId) {
        repository.revokeAllForUser(userId, Instant.now());
    }

    private AuthResponse issueInFamily(User user, String familyId) {
        String raw = newRawToken();
        repository.save(buildToken(user, raw, familyId, Instant.now()));
        return new AuthResponse(jwtService.generateAccessToken(user), raw, UserDto.from(user));
    }

    private RefreshToken buildToken(User user, String raw, String familyId, Instant now) {
        long ttl = user.getRole() == Role.REPORTER ? studentTtlMs : staffTtlMs;
        return RefreshToken.builder()
                .id(UUID.randomUUID().toString())
                .userId(user.getId())
                .tokenHash(sha256(raw))
                .familyId(familyId)
                .expiresAt(now.plus(Duration.ofMillis(ttl)))
                .createdAt(now)
                .build();
    }

    private void revokeFamily(String familyId) {
        Instant now = Instant.now();
        repository.findByFamilyIdAndRevokedAtIsNull(familyId).forEach(token -> {
            token.setRevokedAt(now);
            repository.save(token);
        });
    }

    private static String newRawToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }
}
