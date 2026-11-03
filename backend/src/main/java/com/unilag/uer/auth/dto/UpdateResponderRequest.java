package com.unilag.uer.auth.dto;

import jakarta.validation.constraints.NotNull;

public record UpdateResponderRequest(
        @NotNull(message = "enabled is required") Boolean enabled) {
}
