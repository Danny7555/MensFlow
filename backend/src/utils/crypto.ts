import crypto from 'crypto'
import { getJwtSecret } from '../config/env'

function deriveKey(): Buffer {
  return crypto.createHash('sha256').update(getJwtSecret() + ':passcode-encryption').digest()
}

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const TAG_LENGTH = 16

export function encryptPasscode(passcode: string): string {
  const key = deriveKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  const encrypted = Buffer.concat([
    cipher.update(passcode, 'utf8'),
    cipher.final(),
  ])

  const authTag = cipher.getAuthTag()

  const combined = Buffer.concat([iv, authTag, encrypted])
  return combined.toString('base64')
}

export function decryptPasscode(encoded: string): string {
  const key = deriveKey()
  const combined = Buffer.from(encoded, 'base64')

  const iv = combined.subarray(0, IV_LENGTH)
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH)
  const ciphertext = combined.subarray(IV_LENGTH + TAG_LENGTH)

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ])

  return decrypted.toString('utf8')
}

export function encryptTextWithPasscode(text: string, passcode: string): string {
  const key = crypto.scryptSync(passcode, 'mensflow-passcode-salt-string', 32)
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  const encrypted = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final(),
  ])

  const authTag = cipher.getAuthTag()
  const combined = Buffer.concat([iv, authTag, encrypted])
  return `[ENC]:${combined.toString('base64')}`
}

export function decryptTextWithPasscode(encoded: string, passcode: string): string {
  if (!encoded || !encoded.startsWith('[ENC]:')) return encoded
  const key = crypto.scryptSync(passcode, 'mensflow-passcode-salt-string', 32)
  const combined = Buffer.from(encoded.substring(6), 'base64')

  const iv = combined.subarray(0, IV_LENGTH)
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH)
  const ciphertext = combined.subarray(IV_LENGTH + TAG_LENGTH)

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ])

  return decrypted.toString('utf8')
}

