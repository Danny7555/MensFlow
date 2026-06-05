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

  // ── Reset Password ──────────────────────────────────────────────────────────
  forgotPassword: (email: string) =>
    request<{ message: string; resetToken?: string }>('POST', '/auth/forgot-password', { email }, false),

  verifyResetOtp: (resetToken: string, code: string) =>
    request<{ passwordResetToken: string }>('POST', '/auth/verify-reset-otp', { resetToken, code }, false),

  resetPassword: (passwordResetToken: string, newPassword: string) =>
    request<{ message: string }>('POST', '/auth/reset-password', { passwordResetToken, newPassword }, false),
}

