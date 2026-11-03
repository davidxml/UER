package com.unilag.uer.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Admin-created responder account. Responders can never self-register. */
public record CreateResponderRequest(
        @NotBlank(message = "Email is required")
        @Email(message = "A valid email address is required")
        String loginId,

        @NotBlank(message = "Display name is required")
        @Size(min = 2, max = 80, message = "Display name must be 2-80 characters")
        String displayName,

        @NotBlank(message = "Responder unit is required")
        String unit,

        @NotBlank(message = "Password is required")
        @Size(min = 12, max = 72, message = "Responder passwords must be 12-72 characters")
        String password) {
}
