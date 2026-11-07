package com.unilag.uer.verification;

/**
 * A record returned by a student directory lookup. Kept intentionally small so
 * the future university integration does not leak into the domain model.
 */
public record StudentRecord(
        String matricNo,
        String fullName,
        String department,
        Integer level,
        String externalRef) {
}
