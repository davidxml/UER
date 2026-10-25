package com.unilag.uer.auth.dto;

/** Access token (5 min) + rotating refresh token + the current user profile. */
public record AuthResponse(String accessToken, String refreshToken, UserDto user) {
}
