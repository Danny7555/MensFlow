/**
 * Token helpers — keeps JWT storage in one place.
 * Use these everywhere instead of touching localStorage directly.
 */

const TOKEN_KEY = 'mf_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export function isLoggedIn(): boolean {
  return getToken() !== null
}
