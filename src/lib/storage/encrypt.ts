import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12

export interface EncryptedFile {
  ciphertext: Buffer
  iv: string
  authTag: string
}

export function getEncryptionKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY?.trim()
  if (!hex || !/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error('ENCRYPTION_KEY must be a 32-byte hex string (openssl rand -hex 32)')
  }
  return Buffer.from(hex, 'hex')
}

export function encryptFile(plaintext: Buffer): EncryptedFile {
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, getEncryptionKey(), iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()])
  const authTag = cipher.getAuthTag()

  return {
    ciphertext,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  }
}

export function decryptFile(ciphertext: Buffer, ivHex: string, authTagHex: string): Buffer {
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const decipher = createDecipheriv(ALGORITHM, getEncryptionKey(), iv)
  decipher.setAuthTag(authTag)
  return Buffer.concat([decipher.update(ciphertext), decipher.final()])
}

export function isEncrypted(iv: string | null | undefined, authTag: string | null | undefined): boolean {
  return Boolean(iv?.trim() && authTag?.trim())
}
