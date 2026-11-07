package com.unilag.uer.verification;

import java.util.Optional;

/**
 * Seam for verifying a matric number against university records.
 *
 * <p>Today only {@link ManualStudentDirectory} exists (the university has not
 * granted access). When access arrives, add a provider that calls their API and
 * switch {@code uer.student-directory.provider}; no schema or service changes
 * are needed.</p>
 */
public interface StudentDirectory {

    /** @return the official record if the matric exists, else empty. */
    Optional<StudentRecord> lookup(String matricNo);
}
