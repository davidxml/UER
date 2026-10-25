package com.unilag.uer.admin;

import java.time.Instant;
import java.util.Locale;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.unilag.uer.user.Role;
import com.unilag.uer.user.User;
import com.unilag.uer.user.UserRepository;
import com.unilag.uer.user.VerificationStatus;

/**
 * Creates the first admin account from {@code ADMIN_LOGIN} / {@code ADMIN_PASSWORD}
 * when no admin exists. Idempotent: never overwrites an existing account.
 *
 * <p>Responders are then created through {@code /api/v1/admin/responders}; there
 * is deliberately no public path to a privileged account.</p>
 */
@Component
public class AdminBootstrap implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminBootstrap.class);

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final String adminLogin;
    private final String adminPassword;

    public AdminBootstrap(
            UserRepository users,
            PasswordEncoder encoder,
            @Value("${ADMIN_LOGIN:}") String adminLogin,
            @Value("${ADMIN_PASSWORD:}") String adminPassword) {
        this.users = users;
        this.encoder = encoder;
        this.adminLogin = adminLogin;
        this.adminPassword = adminPassword;
    }

    @Override
    public void run(String... args) {
        if (adminLogin == null || adminLogin.isBlank()) {
            log.warn("ADMIN_LOGIN is not set; skipping admin bootstrap.");
            return;
        }
        if (users.countByRole(Role.ADMIN) > 0) {
            return;
        }
        if (adminPassword == null || adminPassword.length() < 12) {
            log.error("ADMIN_PASSWORD must be at least 12 characters; admin account was not created.");
            return;
        }

        User admin = User.builder()
                .id(java.util.UUID.randomUUID().toString())
                .loginId(adminLogin.trim().toLowerCase(Locale.ROOT))
                .displayName("Administrator")
                .passwordHash(encoder.encode(adminPassword))
                .role(Role.ADMIN)
                .verificationStatus(VerificationStatus.UNVERIFIED)
                .enabled(true)
                .failedAttempts(0)
                .tokenVersion(0)
                .createdAt(Instant.now())
                .build();

        users.save(admin);
        log.info("Bootstrapped admin account: {}", admin.getLoginId());
    }
}
