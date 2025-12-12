/**
 * Setup script for bee2app test application
 *
 * This script:
 * 1. Creates the bee2app App in AppHub
 * 2. Generates OAuth credentials
 * 3. Creates the bee2solutions Entity
 * 4. Creates a Basic Plan
 * 5. Assigns a license to bee2solutions
 *
 * Run with: npx tsx scripts/setup-bee2app.ts
 */

import { PrismaClient } from '@prisma/client'
import * as crypto from 'crypto'

const prisma = new PrismaClient()

// Helper functions (from src/lib/apps/oauth.ts)
function generateClientId(appSlug: string): string {
  const random = crypto.randomBytes(12).toString('base64url')
  return `${appSlug}_client_${random}`
}

function generateClientSecret(): { raw: string; hash: string } {
  const random = crypto.randomBytes(32).toString('base64url')
  const raw = `secret_live_${random}`
  const hash = crypto.createHash('sha256').update(raw).digest('hex')
  return { raw, hash }
}

async function main() {
  console.log('🐝 Setting up bee2app test application...\n')

  // 1. Create or update bee2app
  console.log('1️⃣ Creating bee2app in AppHub...')

  const app = await prisma.app.upsert({
    where: { slug: 'bee2app' },
    update: {
      name: 'Bee2App',
      description: 'Test application for AppHub OAuth integration',
      baseUrl: 'http://localhost:3001',
      loginUrl: 'http://localhost:3001/login',
      icon: '🐝',
      color: '#FCD34D',
      status: 'ACTIVE',
      isPublic: true,
      isCore: false,
    },
    create: {
      slug: 'bee2app',
      name: 'Bee2App',
      description: 'Test application for AppHub OAuth integration',
      baseUrl: 'http://localhost:3001',
      loginUrl: 'http://localhost:3001/login',
      icon: '🐝',
      color: '#FCD34D',
      status: 'ACTIVE',
      isPublic: true,
      isCore: false,
    },
  })
  console.log(`   ✅ App created: ${app.name} (${app.id})`)

  // 2. Generate OAuth credentials
  console.log('\n2️⃣ Generating OAuth credentials...')

  const existingClient = await prisma.oAuthClient.findUnique({
    where: { appId: app.id },
  })

  let clientId: string
  let clientSecret: string | null = null

  if (existingClient) {
    clientId = existingClient.clientId
    console.log(`   ⚠️ OAuth client already exists, keeping existing credentials`)
    console.log(`   Client ID: ${clientId}`)
  } else {
    clientId = generateClientId(app.slug)
    const secret = generateClientSecret()
    clientSecret = secret.raw

    await prisma.oAuthClient.create({
      data: {
        appId: app.id,
        clientId,
        clientSecret: secret.hash,
        redirectUris: [
          'http://localhost:3001/api/auth/callback/apphub',
        ],
        scopes: ['openid', 'profile', 'email', 'organization'],
        grantTypes: ['authorization_code', 'refresh_token'],
        tokenLifetime: 3600,
        refreshTokenLifetime: 604800,
      },
    })
    console.log(`   ✅ OAuth client created`)
    console.log(`   Client ID: ${clientId}`)
    console.log(`   Client Secret: ${clientSecret}`)
    console.log(`   ⚠️ SAVE THE CLIENT SECRET NOW - it cannot be retrieved later!`)
  }

  // 3. Create bee2solutions entity
  console.log('\n3️⃣ Creating bee2solutions entity...')

  const entity = await prisma.entity.upsert({
    where: { slug: 'bee2solutions' },
    update: {
      name: 'Bee2 Solutions',
    },
    create: {
      name: 'Bee2 Solutions',
      slug: 'bee2solutions',
      settings: {
        timezone: 'Europe/Berlin',
        language: 'en',
      },
    },
  })
  console.log(`   ✅ Entity created: ${entity.name} (${entity.id})`)

  // 4. Create Basic Plan
  console.log('\n4️⃣ Creating Basic plan for bee2app...')

  const plan = await prisma.plan.upsert({
    where: {
      appId_slug: {
        appId: app.id,
        slug: 'basic',
      },
    },
    update: {
      name: 'Basic',
      description: 'Basic plan with core features',
      isActive: true,
      isPublic: true,
    },
    create: {
      appId: app.id,
      slug: 'basic',
      name: 'Basic',
      description: 'Basic plan with core features',
      price: null,
      isActive: true,
      isPublic: true,
      isTrial: false,
      limits: {
        maxUsers: 10,
      },
      features: {
        dashboard: true,
        reports: true,
      },
    },
  })
  console.log(`   ✅ Plan created: ${plan.name} (${plan.id})`)

  // 5. Create license for bee2solutions
  console.log('\n5️⃣ Assigning license to bee2solutions...')

  const license = await prisma.license.upsert({
    where: {
      entityId_appId: {
        entityId: entity.id,
        appId: app.id,
      },
    },
    update: {
      planId: plan.id,
      status: 'ACTIVE',
    },
    create: {
      entityId: entity.id,
      appId: app.id,
      planId: plan.id,
      status: 'ACTIVE',
      validFrom: new Date(),
    },
  })
  console.log(`   ✅ License assigned (${license.id})`)

  // 6. Create some sample permissions
  console.log('\n6️⃣ Creating sample permissions...')

  const permissions = [
    { slug: 'dashboard:view', name: 'View Dashboard', resource: 'dashboard', action: 'view', groupName: 'Dashboard' },
    { slug: 'reports:view', name: 'View Reports', resource: 'reports', action: 'view', groupName: 'Reports' },
    { slug: 'reports:create', name: 'Create Reports', resource: 'reports', action: 'create', groupName: 'Reports' },
    { slug: 'settings:manage', name: 'Manage Settings', resource: 'settings', action: 'manage', groupName: 'Settings' },
  ]

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: {
        appId_slug: {
          appId: app.id,
          slug: perm.slug,
        },
      },
      update: perm,
      create: {
        appId: app.id,
        ...perm,
        isDefault: true,
      },
    })
  }
  console.log(`   ✅ ${permissions.length} permissions created`)

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📋 SETUP COMPLETE - Configuration Summary')
  console.log('='.repeat(60))
  console.log('')
  console.log('AppHub (OAuth Provider):')
  console.log(`  URL: http://localhost:3000`)
  console.log('')
  console.log('Bee2App (OAuth Client):')
  console.log(`  URL: http://localhost:3001`)
  console.log(`  App ID: ${app.id}`)
  console.log(`  Client ID: ${clientId}`)
  if (clientSecret) {
    console.log(`  Client Secret: ${clientSecret}`)
  } else {
    console.log(`  Client Secret: (use existing - run script again with --regenerate to get new secret)`)
  }
  console.log('')
  console.log('Entity:')
  console.log(`  Name: ${entity.name}`)
  console.log(`  Slug: ${entity.slug}`)
  console.log(`  ID: ${entity.id}`)
  console.log('')
  console.log('='.repeat(60))
  console.log('')
  console.log('📝 Next Steps:')
  console.log('')
  console.log('1. Copy the following to apphubapps/bee2app/.env.local:')
  console.log('')
  console.log('   APPHUB_URL="http://localhost:3000"')
  console.log(`   APPHUB_CLIENT_ID="${clientId}"`)
  if (clientSecret) {
    console.log(`   APPHUB_CLIENT_SECRET="${clientSecret}"`)
  } else {
    console.log('   APPHUB_CLIENT_SECRET="<your-existing-secret>"')
  }
  console.log('   AUTH_SECRET="<generate-with: openssl rand -base64 32>"')
  console.log('   NEXTAUTH_URL="http://localhost:3001"')
  console.log('')
  console.log('2. Start AppHub on port 3000: npm run dev')
  console.log('3. Start bee2app on port 3001: cd apphubapps/bee2app && npm run dev -- -p 3001')
  console.log('4. Create/use a user in AppHub and add them to bee2solutions entity')
  console.log('5. Visit http://localhost:3001 and sign in with AppHub')
  console.log('')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
