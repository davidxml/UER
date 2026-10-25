package com.unilag.uer.auth;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.LocalDate;

import org.junit.jupiter.api.Test;

import com.unilag.uer.auth.dto.StudentSignupRequest;

class StudentSignupRequestTest {

    private static String matricStartingWith(int twoDigitYear) {
        return String.format("%02d0201001", twoDigitYear);
    }

    private static StudentSignupRequest withMatric(String matric) {
        StudentSignupRequest request = new StudentSignupRequest();
        request.setMatricNo(matric);
        return request;
    }

    @Test
    void acceptsEntryYearsInsideTheEightYearWindow() {
        int currentYear = LocalDate.now().getYear() % 100;

        assertTrue(withMatric(matricStartingWith(currentYear)).isMatricYearValid());
        assertTrue(withMatric(matricStartingWith(currentYear - 8)).isMatricYearValid());
    }

    @Test
    void rejectsEntryYearsOlderThanEightYears() {
        int currentYear = LocalDate.now().getYear() % 100;

        assertFalse(withMatric(matricStartingWith(currentYear - 9)).isMatricYearValid());
    }

    @Test
    void rejectsEntryYearsInTheFuture() {
        int currentYear = LocalDate.now().getYear() % 100;

        assertFalse(withMatric(matricStartingWith(currentYear + 1)).isMatricYearValid());
    }

    @Test
    void leavesMalformedMatricNumbersToThePatternValidator() {
        assertTrue(withMatric("not-a-matric").isMatricYearValid());
        assertTrue(withMatric(null).isMatricYearValid());
    }

    @Test
    void academicLevelMustBeAMultipleOfOneHundred() {
        StudentSignupRequest request = new StudentSignupRequest();

        request.setAcademicLevel(300);
        assertTrue(request.isAcademicLevelValid());

        request.setAcademicLevel(250);
        assertFalse(request.isAcademicLevelValid());

        request.setAcademicLevel(null);
        assertTrue(request.isAcademicLevelValid());
    }
}
