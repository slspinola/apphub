import * as crypto from 'crypto'

// Encryption constants
const ENCRYPTION_ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16

/**
 * Get the encryption key from environment
 * In production, this should be set to a secure 32-byte key
 */
function getEncryptionKey(): Buffer {
  const key = process.env.WEBHOOK_ENCRYPTION_KEY
  if (!key) {
    // Development fallback - NOT SECURE FOR PRODUCTION
    console.warn('[Webhook] No WEBHOOK_ENCRYPTION_KEY set, using insecure fallback')
    return crypto.scryptSync('dev-fallback-key', 'salt', 32)
  }
  // Decode base64 key or use scrypt to derive from passphrase
  if (key.length === 44) {
    // Looks like base64-encoded 32 bytes
    return Buffer.from(key, 'base64')
  }
  return crypto.scryptSync(key, 'apphub-webhook-salt', 32)
}

/**
 * Encrypt a secret for storage
 */
export function encryptSecret(plaintext: string): string {
  const key = getEncryptionKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv)

  let encrypted = cipher.update(plaintext, 'utf8', 'base64')
  encrypted += cipher.final('base64')

  const authTag = cipher.getAuthTag()

  // Format: iv:authTag:encrypted (all base64)
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`
}

/**
 * Decrypt a stored secret
 */
export function decryptSecret(ciphertext: string): string {
  const key = getEncryptionKey()
  const [ivB64, authTagB64, encrypted] = ciphertext.split(':')

  if (!ivB64 || !authTagB64 || !encrypted) {
    throw new Error('Invalid encrypted secret format')
  }

  const iv = Buffer.from(ivB64, 'base64')
  const authTag = Buffer.from(authTagB64, 'base64')

  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encrypted, 'base64', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

/**
 * Generate a unique client ID for an app
 * Format: {appSlug}_client_{random}
 */
export function generateClientId(appSlug: string): string {
  const random = crypto.randomBytes(12).toString('base64url')
  return `${appSlug}_client_${random}`
}

/**
 * Generate a secure client secret
 * Format: secret_live_{random}
 */
export function generateClientSecret(): { raw: string; hash: string } {
  const random = crypto.randomBytes(32).toString('base64url')
  const raw = `secret_live_${random}`
  const hash = hashSecret(raw)
  return { raw, hash }
}

/**
 * Hash a client secret for storage
 */
export function hashSecret(secret: string): string {
  return crypto.createHash('sha256').update(secret).digest('hex')
}

/**
 * Verify a client secret against its hash
 */
export function verifySecret(secret: string, hash: string): boolean {
  const computedHash = hashSecret(secret)
  return crypto.timingSafeEqual(
    Buffer.from(computedHash),
    Buffer.from(hash)
  )
}

/**
 * Get a hint of the secret (last 6 characters)
 */
export function getSecretHint(hash: string): string {
  return `****${hash.slice(-6)}`
}

/**
 * Generate a webhook secret for signing payloads
 * Returns raw (for display once), encrypted (for storage), and hash (for hint display)
 */
export function generateWebhookSecret(): { raw: string; encrypted: string; hash: string } {
  const random = crypto.randomBytes(24).toString('base64url')
  const raw = `whsec_${random}`
  const encrypted = encryptSecret(raw)
  const hash = hashSecret(raw)
  return { raw, encrypted, hash }
}

/**
 * Sign a webhook payload with HMAC-SHA256
 */
export function signWebhookPayload(payload: string, secret: string): string {
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
  return `sha256=${signature}`
}

/**
 * Verify a webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = signWebhookPayload(payload, secret)
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    )
  } catch {
    return false
  }
}

/**
 * Validate a redirect URI format
 */
export function isValidRedirectUri(uri: string): boolean {
  try {
    const url = new URL(uri)
    
    // Must be HTTPS in production (allow localhost for development)
    if (process.env.NODE_ENV === 'production') {
      if (url.protocol !== 'https:' && url.hostname !== 'localhost') {
        return false
      }
    }
    
    // Cannot have fragment
    if (url.hash) {
      return false
    }
    
    return true
  } catch {
    return false
  }
}

/**
 * Validate a list of redirect URIs
 */
export function validateRedirectUris(uris: string[]): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  for (const uri of uris) {
    if (!isValidRedirectUri(uri)) {
      errors.push(`Invalid redirect URI: ${uri}`)
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  }
}

