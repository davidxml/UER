package com.unilag.uer.auth.dto;

import com.unilag.uer.user.VerificationStatus;

import jakarta.validation.constraints.NotNull;

public record VerificationRequest(
        @NotNull(message = "status is required") VerificationStatus status) {
}
