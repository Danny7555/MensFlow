import { getToken } from './auth-token'

const BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:5001/api').replace(/\/+$/, '')

export class ApiError extends Error {
  status: number
  payload: unknown

  constructor(message: string, status: number, payload: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

export async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  auth = true,
  signal?: AbortSignal,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (auth) {
    const token = getToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  })

  const contentType = res.headers.get('content-type') ?? ''
  const data = contentType.includes('application/json')
    ? await res.json().catch(() => ({}))
    : await res.text().catch(() => '')

  if (!res.ok) {
    const message =
      typeof data === 'object' && data !== null && 'error' in data && typeof data.error === 'string'
        ? data.error
        : `Request failed (${res.status})`

    const error = new ApiError(message, res.status, data)

    // Notify the app that the session has expired so AuthProvider can log out.
    // We only fire this when the request actually carried a token — otherwise
    // a 401 on a public endpoint (e.g. a wrong password) shouldn't log out.
    if (res.status === 401 && auth && getToken()) {
      window.dispatchEvent(new CustomEvent('mf:auth:expired'))
    }

    throw error
  }

  if (res.status === 204) {
    return undefined as T
  }

  return data as T
}

export const get  = <T>(path: string, signal?: AbortSignal) =>
  request<T>('GET', path, undefined, true, signal)

export const post = <T>(path: string, body?: unknown, signal?: AbortSignal) =>
  request<T>('POST', path, body, true, signal)

export const put  = <T>(path: string, body?: unknown, signal?: AbortSignal) =>
  request<T>('PUT', path, body, true, signal)

export const del  = <T>(path: string, signal?: AbortSignal) =>
  request<T>('DELETE', path, undefined, true, signal)
