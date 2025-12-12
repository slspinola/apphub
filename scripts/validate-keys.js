#!/usr/bin/env node

/**
 * Validate OAuth JWT keys and Webhook encryption key from .env file
 */

const fs = require('fs')
const path = require('path')
const jose = require('jose')
const crypto = require('crypto')

// Load .env file manually
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8')
    const lines = envContent.split('\n')
    let currentKey = null
    let currentValue = []
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim()
      
      // Skip comments and empty lines
      if (!line || line.startsWith('#')) {
        if (currentKey) {
          // End of multi-line value
          process.env[currentKey] = currentValue.join('\n')
          currentKey = null
          currentValue = []
        }
        continue
      }
      
      // Check if this is a new key=value line
      const match = line.match(/^([^#=]+)=(.*)$/)
      if (match) {
        // Save previous key if exists
        if (currentKey) {
          process.env[currentKey] = currentValue.join('\n')
        }
        
        const key = match[1].trim()
        let value = match[2]
        
        // Handle quoted values
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1)
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.slice(1, -1)
        }
        
        // Check if value ends with unescaped quote (multi-line)
        if (value.startsWith('"') && !value.endsWith('"')) {
          currentKey = key
          currentValue = [value.slice(1)]
        } else {
          process.env[key] = value
          currentKey = null
          currentValue = []
        }
      } else if (currentKey) {
        // Continuation of multi-line value
        if (line.endsWith('"')) {
          currentValue.push(line.slice(0, -1))
          process.env[currentKey] = currentValue.join('\n')
          currentKey = null
          currentValue = []
        } else {
          currentValue.push(line)
        }
      }
    }
    
    // Handle last key if still open
    if (currentKey) {
      process.env[currentKey] = currentValue.join('\n')
    }
  }
}

loadEnv()

async function validateKeys() {
  console.log('Validating keys from .env file...\n')
  let allValid = true

  // Check OAUTH_JWT_PRIVATE_KEY
  const privateKey = process.env.OAUTH_JWT_PRIVATE_KEY
  if (!privateKey) {
    console.log('❌ OAUTH_JWT_PRIVATE_KEY is missing')
    allValid = false
  } else {
    try {
      const privKeyFormatted = privateKey.replace(/\\n/g, '\n')
      await jose.importPKCS8(privKeyFormatted, 'RS256')
      console.log('✅ OAUTH_JWT_PRIVATE_KEY is valid (PKCS#8 format)')
    } catch (error) {
      console.log('❌ OAUTH_JWT_PRIVATE_KEY is invalid:', error.message)
      allValid = false
    }
  }

  // Check OAUTH_JWT_PUBLIC_KEY
  const publicKey = process.env.OAUTH_JWT_PUBLIC_KEY
  if (!publicKey) {
    console.log('❌ OAUTH_JWT_PUBLIC_KEY is missing')
    allValid = false
  } else {
    try {
      const pubKeyFormatted = publicKey.replace(/\\n/g, '\n')
      await jose.importSPKI(pubKeyFormatted, 'RS256')
      console.log('✅ OAUTH_JWT_PUBLIC_KEY is valid (SPKI format)')
    } catch (error) {
      console.log('❌ OAUTH_JWT_PUBLIC_KEY is invalid:', error.message)
      allValid = false
    }
  }

  // Check OAUTH_JWT_KEY_ID
  const keyId = process.env.OAUTH_JWT_KEY_ID
  if (!keyId) {
    console.log('⚠️  OAUTH_JWT_KEY_ID is missing (will use default: "apphub-key-1")')
  } else {
    console.log(`✅ OAUTH_JWT_KEY_ID is set: "${keyId}"`)
  }

  // Check WEBHOOK_ENCRYPTION_KEY
  const webhookKey = process.env.WEBHOOK_ENCRYPTION_KEY
  if (!webhookKey) {
    console.log('⚠️  WEBHOOK_ENCRYPTION_KEY is missing (will use insecure fallback in dev)')
  } else {
    try {
      const buf = Buffer.from(webhookKey, 'base64')
      if (buf.length === 32) {
        console.log('✅ WEBHOOK_ENCRYPTION_KEY is valid (32 bytes, base64 encoded)')
      } else {
        console.log(`⚠️  WEBHOOK_ENCRYPTION_KEY length: ${buf.length} bytes (expected 32, will use scrypt derivation)`)
      }
    } catch (error) {
      console.log('⚠️  WEBHOOK_ENCRYPTION_KEY is not base64, will use scrypt derivation')
    }
  }

  // Verify keypair match
  if (privateKey && publicKey) {
    try {
      const privKeyFormatted = privateKey.replace(/\\n/g, '\n')
      const pubKeyFormatted = publicKey.replace(/\\n/g, '\n')
      const priv = await jose.importPKCS8(privKeyFormatted, 'RS256')
      const pub = await jose.importSPKI(pubKeyFormatted, 'RS256')
      
      // Test sign/verify to ensure they match
      const testPayload = { test: 'validation' }
      const jwt = await new jose.SignJWT(testPayload)
        .setProtectedHeader({ alg: 'RS256' })
        .sign(priv)
      
      await jose.jwtVerify(jwt, pub)
      console.log('✅ Private and public keys match (keypair is valid)')
    } catch (error) {
      console.log('❌ Private and public keys do not match:', error.message)
      allValid = false
    }
  }

  console.log('\n' + '='.repeat(60))
  if (allValid) {
    console.log('✅ All keys are valid and ready to use!')
  } else {
    console.log('❌ Some keys have issues. Please fix them before deploying.')
  }
  console.log('='.repeat(60))
}

validateKeys().catch(console.error)

