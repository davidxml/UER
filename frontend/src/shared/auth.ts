/**
 * Authentication contract shared by the reporter and responder bundles.
 * These types mirror the backend's UserDto/AuthResponse so both apps decode the
 * same shape and the compiler catches drift at the API boundary.
 */

export const ROLES = ['REPORTER', 'RESPONDER', 'ADMIN'] as const

export type Role = (typeof ROLES)[number]

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value)
}

export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY'

export type VerificationStatus = 'UNVERIFIED' | 'VERIFIED' | 'REJECTED'

export type AuthUser = {
  id: string
  /** Matric number for students, email for responders and admins. */
  loginId: string
  displayName: string
  role: Role
  /** Responder unit, fixed when the admin creates the account. */
  department: string | null
  /** Official contact number (optional, primarily for responders/staff). */
  phoneNumber: string | null
  gender: Gender | null
  academicDepartment: string | null
  academicLevel: number | null
  verificationStatus: VerificationStatus
  verificationSource: string | null
  verifiedAt: string | null
  enabled: boolean
  createdAt: string
}

/** Exact JSON returned by /auth/register, /auth/login and /auth/refresh. */
export type AuthSession = {
  accessToken: string
  refreshToken: string
  user: AuthUser
}

export type AuthResponse = AuthSession

export type LoginPayload = {
  loginId: string
  password: string
}

export type StudentSignupPayload = {
  displayName: string
  gender: Gender
  matricNo: string
  academicDepartment: string
  academicLevel: number
  password: string
}
