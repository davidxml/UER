package com.unilag.uer.verification;

import java.util.Optional;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

/**
 * Default provider while the university API is unavailable: no record can be
 * confirmed, so every student register stays UNVERIFIED until an admin checks
 * the details manually.
 */
@Service
@ConditionalOnProperty(name = "uer.student-directory.provider", havingValue = "manual", matchIfMissing = true)
public class ManualStudentDirectory implements StudentDirectory {

    @Override
    public Optional<StudentRecord> lookup(String matricNo) {
        return Optional.empty();
    }
}
