package com.unilag.uer.admin;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.unilag.uer.auth.dto.CreateResponderRequest;
import com.unilag.uer.auth.dto.ResetPasswordRequest;
import com.unilag.uer.auth.dto.UpdateResponderRequest;
import com.unilag.uer.auth.dto.UserDto;
import com.unilag.uer.auth.dto.VerificationRequest;

import jakarta.validation.Valid;

/**
 * Admin-only account provisioning. Guarded by {@code hasRole("ADMIN")} in
 * SecurityConfig.
 *
 * <pre>
 * POST   /api/v1/admin/responders                     → create responder
 * GET    /api/v1/admin/responders                     → list responders
 * PATCH  /api/v1/admin/responders/{id}                → enable/disable
 * POST   /api/v1/admin/responders/{id}/reset-password → rotate password
 * GET    /api/v1/admin/students                       → list students
 * PATCH  /api/v1/admin/students/{id}/verification     → verify/reject
 * </pre>
 */
@RestController
@RequestMapping("/api/v1/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @PostMapping("/responders")
    @ResponseStatus(HttpStatus.CREATED)
    public UserDto createResponder(@Valid @RequestBody CreateResponderRequest request) {
        return adminService.createResponder(request);
    }

    @GetMapping("/responders")
    public List<UserDto> listResponders() {
        return adminService.listResponders();
    }

    @PatchMapping("/responders/{id}")
    public UserDto setResponderEnabled(
            @PathVariable String id,
            @Valid @RequestBody UpdateResponderRequest request) {
        return adminService.setResponderEnabled(id, request.enabled());
    }

    @PostMapping("/responders/{id}/reset-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resetResponderPassword(
            @PathVariable String id,
            @Valid @RequestBody ResetPasswordRequest request) {
        adminService.resetResponderPassword(id, request);
    }

    @GetMapping("/students")
    public List<UserDto> listStudents() {
        return adminService.listStudents();
    }

    @PatchMapping("/students/{id}/verification")
    public UserDto setStudentVerification(
            @PathVariable String id,
            @Valid @RequestBody VerificationRequest request,
            Authentication authentication) {
        return adminService.setStudentVerification(id, request.status(), authentication.getName());
    }
}
