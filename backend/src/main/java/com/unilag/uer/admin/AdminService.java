package com.unilag.uer.admin;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Set;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.unilag.uer.auth.RefreshTokenService;
import com.unilag.uer.auth.dto.CreateResponderRequest;
import com.unilag.uer.auth.dto.ResetPasswordRequest;
import com.unilag.uer.auth.dto.UserDto;
import com.unilag.uer.common.ConflictException;
import com.unilag.uer.user.Role;
import com.unilag.uer.user.User;
import com.unilag.uer.user.UserRepository;
import com.unilag.uer.user.VerificationStatus;

/**
 * Admin-only account management. Responders cannot self-register; this is the
 * only path that creates them.
 */
@Service
public class AdminService {

    /** The dispatch units the responder console supports. */
    public static final Set<String> ALLOWED_UNITS = Set.of(
            "Alpha Base", "Medical Center", "Fire Station", "General Dispatch");

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final RefreshTokenService refreshTokens;

    public AdminService(UserRepository users, PasswordEncoder encoder, RefreshTokenService refreshTokens) {
        this.users = users;
        this.encoder = encoder;
        this.refreshTokens = refreshTokens;
    }

    @Transactional
    public UserDto createResponder(CreateResponderRequest request) {
        if (!ALLOWED_UNITS.contains(request.unit())) {
            throw new IllegalArgumentException(
                    "Unknown responder unit. Allowed: " + String.join(", ", ALLOWED_UNITS));
        }
        String email = request.loginId().trim().toLowerCase(Locale.ROOT);
        if (users.existsByLoginIdIgnoreCase(email)) {
            throw new ConflictException("An account already exists for this email");
        }

        User responder = User.builder()
                .id(java.util.UUID.randomUUID().toString())
                .loginId(email)
                .displayName(request.displayName().trim())
                .passwordHash(encoder.encode(request.password()))
                .role(Role.RESPONDER)
                .department(request.unit())
                .verificationStatus(VerificationStatus.UNVERIFIED)
                .enabled(true)
                .failedAttempts(0)
                .tokenVersion(0)
                .createdAt(Instant.now())
                .build();

        return UserDto.from(users.save(responder));
    }

    public List<UserDto> listResponders() {
        return users.findByRoleOrderByCreatedAtDesc(Role.RESPONDER).stream()
                .map(UserDto::from)
                .toList();
    }

    public List<UserDto> listStudents() {
        return users.findByRoleOrderByCreatedAtDesc(Role.REPORTER).stream()
                .map(UserDto::from)
                .toList();
    }

    /**
     * Disabling bumps the token version and revokes refresh tokens, so access
     * ends immediately instead of waiting for the access token to expire.
     */
    @Transactional
    public UserDto setResponderEnabled(String responderId, boolean enabled) {
        User responder = requireResponder(responderId);
        responder.setEnabled(enabled);
        if (!enabled) {
            responder.setTokenVersion(responder.getTokenVersion() + 1);
            refreshTokens.revokeAllForUser(responder.getId());
        }
        return UserDto.from(users.save(responder));
    }

    @Transactional
    public void resetResponderPassword(String responderId, ResetPasswordRequest request) {
        User responder = requireResponder(responderId);
        responder.setPasswordHash(encoder.encode(request.newPassword()));
        responder.setFailedAttempts(0);
        responder.setLockedUntil(null);
        responder.setTokenVersion(responder.getTokenVersion() + 1);
        users.save(responder);
        refreshTokens.revokeAllForUser(responder.getId());
    }

    /**
     * Manual verification of a student's matric/profile until the university
     * directory API is available.
     */
    @Transactional
    public UserDto setStudentVerification(String studentId, VerificationStatus status, String adminId) {
        User student = users.findById(studentId)
                .orElseThrow(() -> new java.util.NoSuchElementException("Student not found: " + studentId));
        if (student.getRole() != Role.REPORTER) {
            throw new IllegalArgumentException("Account is not a student account");
        }

        student.setVerificationStatus(status);
        if (status == VerificationStatus.UNVERIFIED) {
            student.setVerifiedAt(null);
            student.setVerifiedBy(null);
            student.setVerificationSource(null);
        } else {
            student.setVerifiedAt(Instant.now());
            student.setVerifiedBy(adminId);
            student.setVerificationSource("MANUAL");
        }
        return UserDto.from(users.save(student));
    }

    private User requireResponder(String id) {
        User user = users.findById(id)
                .orElseThrow(() -> new java.util.NoSuchElementException("Responder not found: " + id));
        if (user.getRole() != Role.RESPONDER) {
            throw new IllegalArgumentException("Account is not a responder account");
        }
        return user;
    }
}
