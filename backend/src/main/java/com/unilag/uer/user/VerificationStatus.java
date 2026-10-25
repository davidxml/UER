package com.unilag.uer.user;

/**
 * Whether a reporter's matric number has been checked against university
 * records. UNVERIFIED is the default until manual (or later, API) verification.
 */
public enum VerificationStatus {
    UNVERIFIED,
    VERIFIED,
    REJECTED
}
