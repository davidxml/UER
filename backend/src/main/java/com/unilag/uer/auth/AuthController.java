package com.unilag.uer.auth;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.unilag.uer.auth.dto.AuthResponse;
import com.unilag.uer.auth.dto.LoginRequest;
import com.unilag.uer.auth.dto.RefreshRequest;
import com.unilag.uer.auth.dto.StudentSignupRequest;

import jakarta.validation.Valid;

/**
 * Public authentication endpoints:
 *
 * <pre>
 * POST /api/v1/auth/register → student self-registration (always REPORTER)
 * POST /api/v1/auth/login    → students, responders, admins
 * POST /api/v1/auth/refresh  → rotate a refresh token for a new access token
 * POST /api/v1/auth/logout   → revoke the presented refresh token family
 * </pre>
 *
 * Responder and admin accounts are created by an admin, never here.
 */
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody StudentSignupRequest request) {
        return authService.registerStudent(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/refresh")
    public AuthResponse refresh(@Valid @RequestBody RefreshRequest request) {
        return authService.refresh(request.refreshToken());
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(@Valid @RequestBody RefreshRequest request) {
        authService.logout(request.refreshToken());
    }
}
