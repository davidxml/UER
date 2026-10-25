package com.unilag.uer.user;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * One row per account, whatever its role. Student profile fields are null for
 * responders/admins; the responder unit is stored in {@code department}.
 *
 * <p>Security-relevant counters live here so they survive restarts:
 * {@code failedAttempts}/{@code lockedUntil} for brute-force protection and
 * {@code tokenVersion} for immediate access-token revocation.</p>
 */
@Entity
@Table(name = "users")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @Column(name = "id", nullable = false)
    private String id;

    /** Matric number for students, email for responders/admins. */
    @Column(name = "login_id", nullable = false)
    private String loginId;

    @Column(name = "display_name", nullable = false)
    private String displayName;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private Role role;

    /** Responder unit, e.g. "Fire Station". Null for reporters/admins. */
    @Column(name = "department")
    private String department;

    @Enumerated(EnumType.STRING)
    @Column(name = "gender")
    private Gender gender;

    @Column(name = "academic_department")
    private String academicDepartment;

    @Column(name = "academic_level")
    private Integer academicLevel;

    @Enumerated(EnumType.STRING)
    @Column(name = "verification_status", nullable = false)
    private VerificationStatus verificationStatus;

    /** MANUAL or UNIVERSITY_API. Null while unverified. */
    @Column(name = "verification_source")
    private String verificationSource;

    @Column(name = "external_student_ref")
    private String externalStudentRef;

    @Column(name = "verified_at")
    private Instant verifiedAt;

    /** Admin user id that performed the verification. */
    @Column(name = "verified_by")
    private String verifiedBy;

    @Column(name = "enabled", nullable = false)
    private boolean enabled;

    @Column(name = "failed_attempts", nullable = false)
    private int failedAttempts;

    @Column(name = "locked_until")
    private Instant lockedUntil;

    @Column(name = "token_version", nullable = false)
    private int tokenVersion;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "last_login_at")
    private Instant lastLoginAt;
}
