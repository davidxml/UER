package com.unilag.uer.auth;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * A single issued refresh token. Only the SHA-256 hash is stored, so a database
 * leak cannot be replayed. Tokens rotate on every use; a revoked token being
 * presented again is treated as theft and its whole family is revoked.
 */
@Entity
@Table(name = "refresh_tokens")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RefreshToken {

    @Id
    @Column(name = "id", nullable = false)
    private String id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "token_hash", nullable = false, unique = true)
    private String tokenHash;

    /** Groups tokens produced by successive rotations of one login session. */
    @Column(name = "family_id", nullable = false)
    private String familyId;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "revoked_at")
    private Instant revokedAt;

    @Column(name = "replaced_by")
    private String replacedBy;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
}
