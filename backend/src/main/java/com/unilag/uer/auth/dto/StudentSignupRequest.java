package com.unilag.uer.auth.dto;

import java.time.LocalDate;

import com.unilag.uer.user.Gender;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import lombok.Getter;
import lombok.Setter;

/**
 * Reporter (student) signup payload. The university does not expose a student
 * directory yet, so these details are collected at signup and verified manually
 * by an admin later.
 *
 * <p>The matric number carries the entry year in its first two digits, and the
 * university only allows students on campus for eight years. A static regex
 * cannot express that window, so the year check is dynamic and rolls forward
 * automatically each session.</p>
 */
@Getter
@Setter
public class StudentSignupRequest {

    @NotBlank(message = "Display name is required")
    @Size(min = 2, max = 80, message = "Display name must be 2-80 characters")
    private String displayName;

    @NotNull(message = "Gender is required")
    private Gender gender;

    @NotBlank(message = "Matric number is required")
    @Pattern(regexp = "^\\d{9}$", message = "Matric number must be exactly 9 digits")
    private String matricNo;

    @NotBlank(message = "Academic department is required")
    @Size(min = 2, max = 100, message = "Academic department must be 2-100 characters")
    private String academicDepartment;

    @NotNull(message = "Academic level is required")
    @Min(value = 100, message = "Academic level must be between 100 and 800")
    @Max(value = 800, message = "Academic level must be between 100 and 800")
    private Integer academicLevel;

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 72, message = "Password must be 8-72 characters")
    private String password;

    /**
     * Entry year (first two digits) must fall inside the permitted eight-year
     * window. Returns true for malformed input so that {@code @Pattern} owns
     * that error message instead of duplicating it here.
     */
    @AssertTrue(message = "Matric number is outside the permitted eight-year admission window")
    public boolean isMatricYearValid() {
        if (matricNo == null || !matricNo.matches("\\d{9}")) {
            return true;
        }
        int currentYear = LocalDate.now().getYear() % 100;
        int entryYear = Integer.parseInt(matricNo.substring(0, 2));
        return entryYear >= (currentYear - 8) && entryYear <= currentYear;
    }

    @AssertTrue(message = "Academic level must be a multiple of 100")
    public boolean isAcademicLevelValid() {
        return academicLevel == null || academicLevel % 100 == 0;
    }
}
