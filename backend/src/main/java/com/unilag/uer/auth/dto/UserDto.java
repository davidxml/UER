package com.unilag.uer.auth.dto;

import java.time.Instant;

import com.unilag.uer.user.Gender;
import com.unilag.uer.user.Role;
import com.unilag.uer.user.User;
import com.unilag.uer.user.VerificationStatus;

/**
 * Safe view of an account. Never carries the password hash, lockout counters or
 * token version.
 */
public record UserDto(
        String id,
        String loginId,
        String displayName,
        Role role,
        String department,
        Gender gender,
        String academicDepartment,
        Integer academicLevel,
        VerificationStatus verificationStatus,
        String verificationSource,
        Instant verifiedAt,
        boolean enabled,
        Instant createdAt) {

    public static UserDto from(User user) {
        return new UserDto(
                user.getId(),
                user.getLoginId(),
                user.getDisplayName(),
                user.getRole(),
                user.getDepartment(),
                user.getGender(),
                user.getAcademicDepartment(),
                user.getAcademicLevel(),
                user.getVerificationStatus(),
                user.getVerificationSource(),
                user.getVerifiedAt(),
                user.isEnabled(),
                user.getCreatedAt());
    }
}
