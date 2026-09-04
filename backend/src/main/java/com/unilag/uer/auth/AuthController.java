package com.unilag.uer.auth;

import java.util.Map;
import java.util.Set;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Responder authentication. Verifies the department + PIN against server-side
 * configuration and, on success, issues a signed JWT that the client must
 * send as {@code Authorization: Bearer <token>} on all responder operations.
 *
 * The PIN is a shared stub for the capstone ("1234"). In v2 this becomes a
 * per-department credential or an OTP/SSO flow — the token mechanics stay the
 * same, only the credential check changes.
 */
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final JwtService jwtService;
    private final String responderPin;
    private static final Set<String> VALID_DEPARTMENTS =
            Set.of("Alpha Base", "Medical Center", "Fire Station", "General Dispatch");

    public AuthController(
            JwtService jwtService,
            @Value("${uer.responder-pin:1234}") String responderPin) {
        this.jwtService = jwtService;
        this.responderPin = responderPin;
    }

    /** Body for the responder login request. */
    public record LoginRequest(String department, String pin) {}

    @PostMapping("/responder/login")
    public Map<String, String> responderLogin(@RequestBody LoginRequest login) {
        if (login.department() == null || !VALID_DEPARTMENTS.contains(login.department())) {
            throw new IllegalArgumentException("Invalid department: " + login.department());
        }
        if (login.pin() == null || !login.pin().equals(responderPin)) {
            throw new IllegalArgumentException("Invalid PIN");
        }
        return Map.of("token", jwtService.generateToken(login.department()));
    }
}
