#!/usr/bin/env node

/**
 * Generate OAuth JWT keys and Webhook encryption key for .env file
 * 
 * Usage: node scripts/generate-keys.js
 */

const crypto = require('crypto')
const { writeFileSync } = require('fs')
const { join } = require('path')

async function generateKeys() {
  console.log('Generating keys...\n')

  // Generate RSA keypair for OAuth JWT
  const { generateKeyPairSync } = require('crypto')
  const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  })

  // Generate webhook encryption key (32 bytes, base64 encoded)
  const webhookKey = crypto.randomBytes(32).toString('base64')

  // Generate key ID
  const keyId = 'apphub-key-1'

  // Format keys for .env file (escape newlines)
  const privateKeyEnv = privateKey.replace(/\n/g, '\\n')
  const publicKeyEnv = publicKey.replace(/\n/g, '\\n')

  console.log('Add these to your .env file:\n')
  console.log('='.repeat(60))
  console.log(`OAUTH_JWT_PRIVATE_KEY="${privateKeyEnv}"`)
  console.log(`OAUTH_JWT_PUBLIC_KEY="${publicKeyEnv}"`)
  console.log(`OAUTH_JWT_KEY_ID="${keyId}"`)
  console.log(`WEBHOOK_ENCRYPTION_KEY="${webhookKey}"`)
  console.log('='.repeat(60))

  // Optionally write to .env.example or a new file
  const output = {
    OAUTH_JWT_PRIVATE_KEY: privateKeyEnv,
    OAUTH_JWT_PUBLIC_KEY: publicKeyEnv,
    OAUTH_JWT_KEY_ID: keyId,
    WEBHOOK_ENCRYPTION_KEY: webhookKey
  }

  console.log('\n✅ Keys generated successfully!')
  console.log('\nCopy the values above to your .env file.')
}

generateKeys().catch(console.error)

