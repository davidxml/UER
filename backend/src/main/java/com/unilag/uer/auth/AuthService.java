package com.unilag.uer.auth;

import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Locale;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.unilag.uer.auth.dto.AuthResponse;
import com.unilag.uer.auth.dto.LoginRequest;
import com.unilag.uer.auth.dto.StudentSignupRequest;
import com.unilag.uer.common.ConflictException;
import com.unilag.uer.user.Role;
import com.unilag.uer.user.User;
import com.unilag.uer.user.UserRepository;
import com.unilag.uer.user.VerificationStatus;
import com.unilag.uer.verification.StudentDirectory;
import com.unilag.uer.verification.StudentRecord;

/**
 * Student registration and login for every role. Roles are assigned here, never
 * accepted from the client: self-registration always produces a REPORTER.
 */
@Service
public class AuthService {

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final RefreshTokenService tokens;
    private final StudentDirectory directory;
    private final String dummyHash;
    private final int maxFailedLogins;
    private final int lockoutMinutes;

    public AuthService(
            UserRepository users,
            PasswordEncoder encoder,
            RefreshTokenService tokens,
            StudentDirectory directory,
            @Value("${uer.security.max-failed-logins:5}") int maxFailedLogins,
            @Value("${uer.security.lockout-minutes:15}") int lockoutMinutes) {
        this.users = users;
        this.encoder = encoder;
        this.tokens = tokens;
        this.directory = directory;
        this.maxFailedLogins = maxFailedLogins;
        this.lockoutMinutes = lockoutMinutes;
        // Used to spend the same BCrypt time when the account does not exist.
        this.dummyHash = encoder.encode("uer-placeholder-not-a-real-password");
    }

    @Transactional
    public AuthResponse registerStudent(StudentSignupRequest request) {
        String matric = request.getMatricNo().trim().toUpperCase(Locale.ROOT);
        if (users.existsByLoginIdIgnoreCase(matric)) {
            throw new ConflictException("An account already exists for this matric number");
        }

        // The seam for the future university API. Manual provider returns empty,
        // so signups stay UNVERIFIED until an admin checks them.
        Optional<StudentRecord> official = directory.lookup(matric);
        Instant now = Instant.now();

        User user = User.builder()
                .id(java.util.UUID.randomUUID().toString())
                .loginId(matric)
                .displayName(official.map(StudentRecord::fullName)
                        .filter(name -> name != null && !name.isBlank())
                        .orElse(request.getDisplayName().trim()))
                .passwordHash(encoder.encode(request.getPassword()))
                .role(Role.REPORTER)
                .gender(request.getGender())
                .academicDepartment(official.map(StudentRecord::department)
                        .filter(dept -> dept != null && !dept.isBlank())
                        .orElse(request.getAcademicDepartment().trim()))
                .academicLevel(official.map(StudentRecord::level)
                        .filter(level -> level != null)
                        .orElse(request.getAcademicLevel()))
                .verificationStatus(official.isPresent() ? VerificationStatus.VERIFIED : VerificationStatus.UNVERIFIED)
                .verificationSource(official.isPresent() ? "UNIVERSITY_API" : null)
                .externalStudentRef(official.map(StudentRecord::externalRef).orElse(null))
                .verifiedAt(official.isPresent() ? now : null)
                .enabled(true)
                .failedAttempts(0)
                .tokenVersion(0)
                .createdAt(now)
                .build();

        users.save(user);
        return tokens.issue(user);
    }

    /**
     * One login endpoint for students, responders and admins. Unknown accounts,
     * wrong passwords and disabled accounts all return the same 401 so the
     * endpoint cannot be used to enumerate users. A locked account gets a 423
     * with a retry time so the real user knows to wait.
     */
    @Transactional(noRollbackFor = { BadCredentialsException.class, LockedException.class })
    public AuthResponse login(LoginRequest request) {
        String loginId = normalize(request.loginId());
        User user = users.findByLoginIdIgnoreCase(loginId).orElse(null);

        if (user == null) {
            encoder.matches(request.password(), dummyHash);
            throw new BadCredentialsException("Invalid credentials");
        }

        Instant now = Instant.now();
        if (user.getLockedUntil() != null && user.getLockedUntil().isAfter(now)) {
            long minutes = Math.max(1, Duration.between(now, user.getLockedUntil()).toMinutes() + 1);
            throw new LockedException("Account temporarily locked. Try again in " + minutes + " minute(s).");
        }

        if (!user.isEnabled()) {
            throw new BadCredentialsException("Invalid credentials");
        }

        if (!encoder.matches(request.password(), user.getPasswordHash())) {
            int failures = user.getFailedAttempts() + 1;
            if (failures >= maxFailedLogins) {
                user.setFailedAttempts(0);
                user.setLockedUntil(now.plus(lockoutMinutes, ChronoUnit.MINUTES));
            } else {
                user.setFailedAttempts(failures);
            }
            users.save(user);
            throw new BadCredentialsException("Invalid credentials");
        }

        user.setFailedAttempts(0);
        user.setLockedUntil(null);
        user.setLastLoginAt(now);
        users.save(user);

        return tokens.issue(user);
    }

    public AuthResponse refresh(String refreshToken) {
        return tokens.rotate(refreshToken);
    }

    public void logout(String refreshToken) {
        tokens.logout(refreshToken);
    }

    private static String normalize(String loginId) {
        String value = loginId.trim();
        return value.contains("@") ? value.toLowerCase(Locale.ROOT) : value.toUpperCase(Locale.ROOT);
    }
}
