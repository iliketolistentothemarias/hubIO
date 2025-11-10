/**
 * Encryption Service
 * 
 * Handles data encryption at rest
 */

import crypto from 'crypto'

export class EncryptionService {
  private algorithm = 'aes-256-gcm'
  private keyLength = 32
  private ivLength = 16
  private saltLength = 64
  private tagLength = 16

  /**
   * Encrypt data
   */
  encrypt(text: string, key: string): string {
    const salt = crypto.randomBytes(this.saltLength)
    const keyDerived = crypto.pbkdf2Sync(key, salt, 100000, this.keyLength, 'sha512')
    const iv = crypto.randomBytes(this.ivLength)
    const cipher = crypto.createCipheriv(this.algorithm, keyDerived, iv)

    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    const tag = cipher.getAuthTag()

    return `${salt.toString('hex')}:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`
  }

  /**
   * Decrypt data
   */
  decrypt(encryptedData: string, key: string): string {
    const parts = encryptedData.split(':')
    if (parts.length !== 4) {
      throw new Error('Invalid encrypted data format')
    }

    const [saltHex, ivHex, tagHex, encrypted] = parts
    const salt = Buffer.from(saltHex, 'hex')
    const iv = Buffer.from(ivHex, 'hex')
    const tag = Buffer.from(tagHex, 'hex')
    const keyDerived = crypto.pbkdf2Sync(key, salt, 100000, this.keyLength, 'sha512')

    const decipher = crypto.createDecipheriv(this.algorithm, keyDerived, iv)
    decipher.setAuthTag(tag)

    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  }

  /**
   * Hash password
   */
  hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex')
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')
    return `${salt}:${hash}`
  }

  /**
   * Verify password
   */
  verifyPassword(password: string, hash: string): boolean {
    const [salt, hashValue] = hash.split(':')
    const hashVerify = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')
    return hashValue === hashVerify
  }
}

// Singleton instance
let encryptionService: EncryptionService | null = null

export function getEncryptionService(): EncryptionService {
  if (!encryptionService) {
    encryptionService = new EncryptionService()
  }
  return encryptionService
}

