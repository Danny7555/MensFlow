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
  auth = true
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
  })

  const contentType = res.headers.get('content-type') ?? ''
  const data = contentType.includes('application/json')
    ? await res.json().catch(() => ({}))
    : await res.text().catch(() => '')

  if (!res.ok) {
    const message = typeof data === 'object' && data !== null && 'error' in data && typeof data.error === 'string'
      ? data.error
      : `Request failed (${res.status})`
    throw new ApiError(message, res.status, data)
  }

  if (res.status === 204) {
    return undefined as T
  }

  return data as T
}

export const get  = <T>(path: string)              => request<T>('GET',    path)
export const post = <T>(path: string, body?: unknown) => request<T>('POST',   path, body)
export const put  = <T>(path: string, body?: unknown) => request<T>('PUT',    path, body)
export const del  = <T>(path: string)              => request<T>('DELETE', path)
