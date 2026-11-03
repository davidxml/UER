/**
 * Client-side validation for student signup. These mirror the backend rules
 * so the form can fail fast, but the server remains the source of truth.
 */

export function normalizeMatric(matric: string): string {
  return matric.replace(/\D/g, '').slice(0, 9)
}

export function isValidMatric(matric: string): boolean {
  const digits = normalizeMatric(matric)
  if (digits.length !== 9) return false

  const currentYear = new Date().getFullYear() % 100
  const entryYear = Number(digits.slice(0, 2))
  if (Number.isNaN(entryYear)) return false

  // Same rolling window as StudentSignupRequest: currentYear - 8 .. currentYear
  return entryYear >= currentYear - 8 && entryYear <= currentYear
}

export function isValidAcademicLevel(level: number): boolean {
  if (!Number.isInteger(level)) return false
  if (level < 100 || level > 800) return false
  return level % 100 === 0
}
