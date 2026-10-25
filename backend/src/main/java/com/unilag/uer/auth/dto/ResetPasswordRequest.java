package com.unilag.uer.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
        @NotBlank(message = "New password is required")
        @Size(min = 12, max = 72, message = "Responder passwords must be 12-72 characters")
        String newPassword) {
}
