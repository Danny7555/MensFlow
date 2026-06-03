import { request } from '../lib/apiClient'
import type { ApiUser } from './userService'

export interface AuthResponse {
  token?: string
  requiresOtp?: boolean
  otpToken?: string
  user: ApiUser
}

export const authApi = {
  register: (username: string, email: string, password: string, name: string, role?: 'lady' | 'partner') =>
    request<AuthResponse>('POST', '/auth/register', { username, email, password, name, role }, false),

  login: (username: string, password: string) =>
    request<AuthResponse>('POST', '/auth/login', { username, password }, false),

  verifyOtp: (otpToken: string, code: string) =>
    request<{ token: string; user: ApiUser }>('POST', '/auth/verify-otp', { otpToken, code }, false),

  resendOtp: (otpToken: string) =>
    request<{ otpToken: string; message: string }>('POST', '/auth/resend-otp', { otpToken }, false),
}
