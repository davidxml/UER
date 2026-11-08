import { api } from './api'
import type { AuthUser } from '../shared/auth'

export type CreateResponderPayload = {
  loginId: string
  displayName: string
  unit: string
  phoneNumber?: string
  password: string
}

export const adminApi = {
  listResponders: () => api.get<AuthUser[]>('/api/v1/admin/responders'),

  createResponder: (payload: CreateResponderPayload) =>
    api.post<AuthUser>('/api/v1/admin/responders', {
      loginId: payload.loginId.trim(),
      displayName: payload.displayName.trim(),
      unit: payload.unit,
      phoneNumber: payload.phoneNumber?.trim() || undefined,
      password: payload.password,
    }),

  setResponderEnabled: (id: string, enabled: boolean) =>
    api.patch<AuthUser>(`/api/v1/admin/responders/${id}`, { enabled }),

  resetResponderPassword: (id: string, newPassword: string) =>
    api.post<void>(`/api/v1/admin/responders/${id}/reset-password`, {
      newPassword,
    }),
}
