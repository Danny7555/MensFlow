/**
 * Zero-Knowledge Client-Side End-to-End Encryption (E2EE) Helpers
 * Derives a shared cryptographic key from the pairing code and encrypts/decrypts payloads.
 */

// Helper to convert string to Uint8Array
function stringToArrayBuffer(str: string): Uint8Array {
  const encoder = new TextEncoder()
  return encoder.encode(str)
}

// Helper to convert ArrayBuffer to string
function arrayBufferToString(buf: ArrayBuffer): string {
  const decoder = new TextDecoder()
  return decoder.decode(buf)
}

// Helper to convert buffer to base64
function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

// Helper to convert base64 to buffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

// Derive a CryptoKey from the shared pairing code
async function deriveKey(pairingCode: string, salt: Uint8Array): Promise<CryptoKey> {
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    stringToArrayBuffer(pairingCode.toUpperCase().trim()) as any,
    'PBKDF2',
    false,
    ['deriveKey']
  )

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as any,
      iterations: 1000,
      hash: 'SHA-256'
    } as any,
    baseKey,
    { name: 'AES-GCM', length: 256 } as any,
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * Encrypts plaintext data using a pairing code.
 * Returns a serialized Base64 payload containing: salt + iv + ciphertext.
 */
export async function encryptData(plaintext: string, pairingCode: string): Promise<string> {
  try {
    const salt = window.crypto.getRandomValues(new Uint8Array(16))
    const iv = window.crypto.getRandomValues(new Uint8Array(12))
    const key = await deriveKey(pairingCode, salt)

    const encryptedBuf = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv as any } as any,
      key,
      stringToArrayBuffer(plaintext) as any
    )

    // Construct unified payload: salt (16 bytes) + iv (12 bytes) + ciphertext
    const payload = new Uint8Array(salt.byteLength + iv.byteLength + encryptedBuf.byteLength)
    payload.set(salt, 0)
    payload.set(iv, salt.byteLength)
    payload.set(new Uint8Array(encryptedBuf), salt.byteLength + iv.byteLength)

    return '[E2E]:' + arrayBufferToBase64(payload.buffer)
  } catch (err) {
    console.error('E2EE Encryption failed:', err)
    throw new Error('E2EE Encryption failed')
  }
}

/**
 * Decrypts E2EE cipher payload using the pairing code.
 */
export async function decryptData(cipherPayload: string, pairingCode: string): Promise<string> {
  if (!cipherPayload.startsWith('[E2E]:')) {
    // If not encrypted, return as-is (for backward compatibility)
    return cipherPayload
  }

  try {
    const base64Data = cipherPayload.substring(6)
    const payload = new Uint8Array(base64ToArrayBuffer(base64Data))

    const salt = payload.slice(0, 16)
    const iv = payload.slice(16, 28)
    const ciphertext = payload.slice(28)

    const key = await deriveKey(pairingCode, salt)
    const decryptedBuf = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as any } as any,
      key,
      ciphertext.buffer as any
    )

    return arrayBufferToString(decryptedBuf)
  } catch (err) {
    console.error('E2EE Decryption failed (invalid key/code?):', err)
    throw new Error('E2EE Decryption failed')
  }
}
