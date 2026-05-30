import { request } from '../lib/apiClient'
import type { ApiUser } from './userService'

export const authApi = {
  register: (username: string, password: string, name: string, role?: 'lady' | 'partner') =>
    request<{ token: string; user: ApiUser }>('POST', '/auth/register', { username, password, name, role }, false),

  login: (username: string, password: string) =>
    request<{ token: string; user: ApiUser }>('POST', '/auth/login', { username, password }, false),
}
