'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'
import { isSystemAdmin, SYSTEM_ADMIN_ROLE, getCurrentUser } from '@/lib/authorization'
import { auth } from '@/auth'
import { cookies } from 'next/headers'
import {
  createAppSchema,
  updateAppSchema,
  changeAppStatusSchema,
  oauthConfigSchema,
  createPermissionSchema,
  updatePermissionSchema,
  syncPermissionsSchema,
  createScopeTypeSchema,
  updateScopeTypeSchema,
  syncScopeTypesSchema,
  createPlanSchema,
  updatePlanSchema,
  createWebhookSchema,
  updateWebhookSchema,
  type CreateAppInput,
  type UpdateAppInput,
  type ChangeAppStatusInput,
  type OAuthConfigInput,
  type CreatePermissionInput,
  type UpdatePermissionInput,
  type SyncPermissionsInput,
  type CreateScopeTypeInput,
  type UpdateScopeTypeInput,
  type SyncScopeTypesInput,
  type CreatePlanInput,
  type UpdatePlanInput,
  type CreateWebhookInput,
  type UpdateWebhookInput,
} from './schemas'
import {
  generateClientId,
  generateClientSecret,
  getSecretHint,
  generateWebhookSecret,
  validateRedirectUris,
  decryptSecret,
  signWebhookPayload,
} from '@/lib/apps/oauth'
import type { AppStatus } from '@prisma/client'

// ============================================================================
// AUTHORIZATION HELPER
// ============================================================================

async function requireSystemAdmin() {
  const isAdmin = await isSystemAdmin()
  if (!isAdmin) {
    throw new Error('Unauthorized: System admin access required')
  }
}

// ============================================================================
// APP CRUD ACTIONS
// ============================================================================

/**
 * Get all apps with optional filtering
 */
export async function getApps(options?: {
  status?: AppStatus
  isPublic?: boolean
  search?: string
  page?: number
  perPage?: number
}) {
  const { status, isPublic, search, page = 1, perPage = 20 } = options || {}

  const where: Prisma.AppWhereInput = {}

  if (status) {
    where.status = status
  }

  if (isPublic !== undefined) {
    where.isPublic = isPublic
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { slug: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [apps, total] = await Promise.all([
    prisma.app.findMany({
      where,
      include: {
        _count: {
          select: {
            permissions: true,
            plans: true,
            licenses: true,
          },
        },
      },
      orderBy: { name: 'asc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.app.count({ where }),
  ])

  return {
    data: apps,
    meta: {
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    },
  }
}

/**
 * Get a single app by ID with all details
 */
export async function getAppById(appId: string) {
  const app = await prisma.app.findUnique({
    where: { id: appId },
    include: {
      oauthClient: true,
      permissions: {
        orderBy: [{ groupName: 'asc' }, { sortOrder: 'asc' }, { slug: 'asc' }],
      },
      scopeTypes: {
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      },
      plans: {
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        include: {
          _count: {
            select: { licenses: true },
          },
        },
      },
      webhooks: {
        orderBy: { createdAt: 'desc' },
      },
      _count: {
        select: {
          permissions: true,
          scopeTypes: true,
          plans: true,
          licenses: true,
          webhooks: true,
        },
      },
    },
  })

  if (!app) {
    throw new Error('App not found')
  }

  // Serialize Decimal fields for client components
  return {
    ...app,
    plans: app.plans.map(plan => ({
      ...plan,
      price: plan.price ? plan.price.toNumber() : null,
    })),
  }
}

/**
 * Get app by slug
 */
export async function getAppBySlug(slug: string) {
  const app = await prisma.app.findUnique({
    where: { slug },
    include: {
      _count: {
        select: {
          permissions: true,
          plans: true,
          licenses: true,
        },
      },
    },
  })

  return app
}

/**
 * Create a new app
 */
export async function createApp(input: CreateAppInput) {
  await requireSystemAdmin()

  const validated = createAppSchema.parse(input)

  // Check if slug is already taken
  const existing = await prisma.app.findUnique({
    where: { slug: validated.slug },
  })

  if (existing) {
    throw new Error('An app with this slug already exists')
  }

  const app = await prisma.app.create({
    data: {
      ...(validated as Prisma.AppCreateInput),
      status: 'DRAFT',
    },
  })

  revalidatePath('/apps')
  return app
}

/**
 * Update an existing app
 */
export async function updateApp(appId: string, input: UpdateAppInput) {
  await requireSystemAdmin()

  const validated = updateAppSchema.parse(input)

  const app = await prisma.app.update({
    where: { id: appId },
    data: validated as Prisma.AppUpdateInput,
  })

  revalidatePath('/apps')
  revalidatePath(`/apps/${appId}`)
  return app
}

/**
 * Change app status
 */
export async function changeAppStatus(appId: string, input: ChangeAppStatusInput) {
  await requireSystemAdmin()

  const validated = changeAppStatusSchema.parse(input)

  const app = await prisma.app.update({
    where: { id: appId },
    data: {
      status: validated.status,
      publishedAt: validated.status === 'ACTIVE' ? new Date() : undefined,
    },
  })

  revalidatePath('/apps')
  revalidatePath(`/apps/${appId}`)
  return app
}

/**
 * Delete an app
 */
export async function deleteApp(appId: string) {
  await requireSystemAdmin()

  // Check if app has active licenses
  const licenseCount = await prisma.license.count({
    where: {
      appId,
      status: { in: ['ACTIVE', 'TRIAL'] },
    },
  })

  if (licenseCount > 0) {
    throw new Error('Cannot delete app with active licenses')
  }

  await prisma.app.delete({
    where: { id: appId },
  })

  revalidatePath('/apps')
}

// ============================================================================
// OAUTH ACTIONS
// ============================================================================

/**
 * Get OAuth configuration for an app
 */
export async function getOAuthConfig(appId: string) {
  await requireSystemAdmin()

  const oauthClient = await prisma.oAuthClient.findUnique({
    where: { appId },
  })

  if (!oauthClient) {
    return null
  }

  return {
    clientId: oauthClient.clientId,
    clientSecretHint: getSecretHint(oauthClient.clientSecret),
    redirectUris: oauthClient.redirectUris,
    scopes: oauthClient.scopes,
    grantTypes: oauthClient.grantTypes,
    tokenLifetime: oauthClient.tokenLifetime,
    refreshTokenLifetime: oauthClient.refreshTokenLifetime,
    createdAt: oauthClient.createdAt,
    secretRotatedAt: oauthClient.secretRotatedAt,
  }
}

/**
 * Generate or regenerate OAuth credentials
 */
export async function generateOAuthCredentials(
  appId: string,
  regenerateSecret: boolean = false
) {
  await requireSystemAdmin()

  const app = await prisma.app.findUnique({
    where: { id: appId },
    include: { oauthClient: true },
  })

  if (!app) {
    throw new Error('App not found')
  }

  const clientId = app.oauthClient?.clientId || generateClientId(app.slug)
  const { raw: clientSecret, hash: secretHash } = generateClientSecret()

  if (app.oauthClient && !regenerateSecret) {
    throw new Error('OAuth credentials already exist. Set regenerateSecret to true to regenerate.')
  }

  await prisma.oAuthClient.upsert({
    where: { appId },
    create: {
      appId,
      clientId,
      clientSecret: secretHash,
      redirectUris: [],
    },
    update: {
      clientSecret: secretHash,
      secretRotatedAt: new Date(),
    },
  })

  revalidatePath(`/apps/${appId}`)

  return {
    clientId,
    clientSecret, // Return raw secret only once
  }
}

/**
 * Update OAuth configuration
 */
export async function updateOAuthConfig(appId: string, input: OAuthConfigInput) {
  await requireSystemAdmin()

  const validated = oauthConfigSchema.parse(input)

  // Validate redirect URIs
  if (validated.redirectUris) {
    const validation = validateRedirectUris(validated.redirectUris)
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '))
    }
  }

  const oauthClient = await prisma.oAuthClient.update({
    where: { appId },
    data: validated as any,
  })

  revalidatePath(`/apps/${appId}`)
  return oauthClient
}

// ============================================================================
// PERMISSION ACTIONS
// ============================================================================

/**
 * Get permissions for an app
 */
export async function getAppPermissions(appId: string, options?: {
  resource?: string
  groupName?: string
}) {
  const where: Prisma.PermissionWhereInput = {
    appId,
  }

  if (options?.resource) {
    where.resource = options.resource
  }

  if (options?.groupName) {
    where.groupName = options.groupName
  }

  const permissions = await prisma.permission.findMany({
    where,
    orderBy: [{ groupName: 'asc' }, { sortOrder: 'asc' }, { slug: 'asc' }],
  })

  return permissions
}

/**
 * Create a permission
 */
export async function createPermission(appId: string, input: CreatePermissionInput) {
  await requireSystemAdmin()

  const validated = createPermissionSchema.parse(input)

  // Check if permission slug already exists for this app
  const existing = await prisma.permission.findUnique({
    where: {
      appId_slug: {
        appId,
        slug: validated.slug,
      },
    },
  })

  if (existing) {
    throw new Error('A permission with this slug already exists for this app')
  }

  const permission = await prisma.permission.create({ data: {
      appId,
      ...validated,
    } as Prisma.PermissionUncheckedCreateInput,
  })

  revalidatePath(`/apps/${appId}`)
  return permission
}

/**
 * Update a permission
 */
export async function updatePermission(
  appId: string,
  permissionId: string,
  input: UpdatePermissionInput
) {
  await requireSystemAdmin()

  const validated = updatePermissionSchema.parse(input)

  // Verify permission belongs to app
  const permission = await prisma.permission.findFirst({
    where: { id: permissionId, appId },
  })

  if (!permission) {
    throw new Error('Permission not found')
  }

  if (permission.isSystem) {
    throw new Error('Cannot modify system permission')
  }

  const updated = await prisma.permission.update({
    where: { id: permissionId },
    data: validated as any,
  })

  revalidatePath(`/apps/${appId}`)
  return updated
}

/**
 * Delete a permission
 */
export async function deletePermission(appId: string, permissionId: string) {
  await requireSystemAdmin()

  const permission = await prisma.permission.findFirst({
    where: { id: permissionId, appId },
  })

  if (!permission) {
    throw new Error('Permission not found')
  }

  if (permission.isSystem) {
    throw new Error('Cannot delete system permission')
  }

  await prisma.permission.delete({
    where: { id: permissionId },
  })

  revalidatePath(`/apps/${appId}`)
}

/**
 * Sync permissions (bulk create/update/delete)
 */
export async function syncPermissions(appId: string, input: SyncPermissionsInput) {
  await requireSystemAdmin()

  const validated = syncPermissionsSchema.parse(input)

  // Get existing non-system permissions
  const existing = await prisma.permission.findMany({
    where: { appId, isSystem: false },
  })

  const existingSlugs = new Set(existing.map((p) => p.slug))
  const inputSlugs = new Set(validated.permissions.map((p) => p.slug))

  // Determine operations
  const toCreate = validated.permissions.filter((p) => !existingSlugs.has(p.slug))
  const toUpdate = validated.permissions.filter((p) => existingSlugs.has(p.slug))
  const toDelete = existing.filter((p) => !inputSlugs.has(p.slug))

  // Execute in transaction
  await prisma.$transaction(async (tx) => {
    // Delete removed permissions
    if (toDelete.length > 0) {
      await tx.permission.deleteMany({
        where: {
          id: { in: toDelete.map((p) => p.id) },
        },
      })
    }

    // Create new permissions
    if (toCreate.length > 0) {
      await tx.permission.createMany({
        data: toCreate.map((p) => ({
          appId,
          ...p,
        })),
      })
    }

    // Update existing permissions
    for (const p of toUpdate) {
      await tx.permission.update({
        where: {
          appId_slug: { appId, slug: p.slug },
        },
        data: p,
      })
    }
  })

  revalidatePath(`/apps/${appId}`)

  return {
    created: toCreate.length,
    updated: toUpdate.length,
    deleted: toDelete.length,
    total: validated.permissions.length,
  }
}

// ============================================================================
// SCOPE TYPE ACTIONS
// ============================================================================

/**
 * Get scope types for an app
 */
export async function getAppScopeTypes(appId: string) {
  const scopeTypes = await prisma.appScopeType.findMany({
    where: { appId },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  })

  return scopeTypes
}

/**
 * Create a scope type
 */
export async function createScopeType(appId: string, input: CreateScopeTypeInput) {
  await requireSystemAdmin()

  const validated = createScopeTypeSchema.parse(input)

  const existing = await prisma.appScopeType.findUnique({
    where: {
      appId_slug: { appId, slug: validated.slug },
    },
  })

  if (existing) {
    throw new Error('A scope type with this slug already exists for this app')
  }

  const scopeType = await prisma.appScopeType.create({ data: {
      appId,
      ...validated,
    } as Prisma.AppScopeTypeUncheckedCreateInput,
  })

  revalidatePath(`/apps/${appId}`)
  return scopeType
}

/**
 * Update a scope type
 */
export async function updateScopeType(
  appId: string,
  scopeTypeId: string,
  input: UpdateScopeTypeInput
) {
  await requireSystemAdmin()

  const validated = updateScopeTypeSchema.parse(input)

  const scopeType = await prisma.appScopeType.findFirst({
    where: { id: scopeTypeId, appId },
  })

  if (!scopeType) {
    throw new Error('Scope type not found')
  }

  const updated = await prisma.appScopeType.update({
    where: { id: scopeTypeId },
    data: validated as any,
  })

  revalidatePath(`/apps/${appId}`)
  return updated
}

/**
 * Delete a scope type
 */
export async function deleteScopeType(appId: string, scopeTypeId: string) {
  await requireSystemAdmin()

  const scopeType = await prisma.appScopeType.findFirst({
    where: { id: scopeTypeId, appId },
  })

  if (!scopeType) {
    throw new Error('Scope type not found')
  }

  await prisma.appScopeType.delete({
    where: { id: scopeTypeId },
  })

  revalidatePath(`/apps/${appId}`)
}

/**
 * Sync scope types (bulk create/update/delete)
 */
export async function syncScopeTypes(appId: string, input: SyncScopeTypesInput) {
  await requireSystemAdmin()

  const validated = syncScopeTypesSchema.parse(input)

  const existing = await prisma.appScopeType.findMany({
    where: { appId },
  })

  const existingSlugs = new Set(existing.map((s) => s.slug))
  const inputSlugs = new Set(validated.scopeTypes.map((s) => s.slug))

  const toCreate = validated.scopeTypes.filter((s) => !existingSlugs.has(s.slug))
  const toUpdate = validated.scopeTypes.filter((s) => existingSlugs.has(s.slug))
  const toDelete = existing.filter((s) => !inputSlugs.has(s.slug))

  await prisma.$transaction(async (tx) => {
    if (toDelete.length > 0) {
      await tx.appScopeType.deleteMany({
        where: {
          id: { in: toDelete.map((s) => s.id) },
        },
      })
    }

    if (toCreate.length > 0) {
      await tx.appScopeType.createMany({
        data: toCreate.map((s) => ({
          appId,
          ...s,
        })) as any,
      })
    }

    for (const s of toUpdate) {
      await tx.appScopeType.update({
        where: {
          appId_slug: { appId, slug: s.slug },
        },
        data: s as any,
      })
    }
  })

  revalidatePath(`/apps/${appId}`)

  return {
    created: toCreate.length,
    updated: toUpdate.length,
    deleted: toDelete.length,
    total: validated.scopeTypes.length,
  }
}

// ============================================================================
// PLAN ACTIONS
// ============================================================================

/**
 * Get plans for an app
 */
export async function getAppPlans(appId: string, options?: {
  isActive?: boolean
  isPublic?: boolean
}) {
  const where: Prisma.PlanWhereInput = {
    appId,
  }

  if (options?.isActive !== undefined) {
    where.isActive = options.isActive
  }

  if (options?.isPublic !== undefined) {
    where.isPublic = options.isPublic
  }

  const plans = await prisma.plan.findMany({
    where,
    include: {
      _count: {
        select: { licenses: true },
      },
    },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  })

  // Serialize Decimal fields for client components
  return plans.map(plan => ({
    ...plan,
    price: plan.price ? plan.price.toNumber() : null,
  }))
}

/**
 * Create a plan
 */
export async function createPlan(appId: string, input: CreatePlanInput) {
  await requireSystemAdmin()

  const validated = createPlanSchema.parse(input)

  const existing = await prisma.plan.findUnique({
    where: {
      appId_slug: { appId, slug: validated.slug },
    },
  })

  if (existing) {
    throw new Error('A plan with this slug already exists for this app')
  }

  const plan = await prisma.plan.create({ data: {
      appId,
      ...validated,
    } as Prisma.PlanUncheckedCreateInput,
  })

  revalidatePath(`/apps/${appId}`)
  return {
    ...plan,
    price: plan.price ? plan.price.toNumber() : null,
  }
}

/**
 * Update a plan
 */
export async function updatePlan(appId: string, planId: string, input: UpdatePlanInput) {
  await requireSystemAdmin()

  const validated = updatePlanSchema.parse(input)

  const plan = await prisma.plan.findFirst({
    where: { id: planId, appId },
  })

  if (!plan) {
    throw new Error('Plan not found')
  }

  const updated = await prisma.plan.update({
    where: { id: planId },
    data: validated as any,
  })

  revalidatePath(`/apps/${appId}`)
  return {
    ...updated,
    price: updated.price ? updated.price.toNumber() : null,
  }
}

/**
 * Delete a plan
 */
export async function deletePlan(appId: string, planId: string) {
  await requireSystemAdmin()

  const plan = await prisma.plan.findFirst({
    where: { id: planId, appId },
    include: {
      _count: { select: { licenses: true } },
    },
  })

  if (!plan) {
    throw new Error('Plan not found')
  }

  if (plan._count.licenses > 0) {
    throw new Error('Cannot delete plan with existing licenses')
  }

  await prisma.plan.delete({
    where: { id: planId },
  })

  revalidatePath(`/apps/${appId}`)
}

// ============================================================================
// WEBHOOK ACTIONS
// ============================================================================

/**
 * Get webhooks for an app
 */
export async function getAppWebhooks(appId: string) {
  await requireSystemAdmin()

  const webhooks = await prisma.appWebhook.findMany({
    where: { appId },
    orderBy: { createdAt: 'desc' },
  })

  return webhooks
}

/**
 * Create a webhook
 */
export async function createWebhook(appId: string, input: CreateWebhookInput) {
  await requireSystemAdmin()

  const validated = createWebhookSchema.parse(input)

  const { raw: secret, encrypted: encryptedSecret, hash: secretHash } = generateWebhookSecret()

  const webhook = await prisma.appWebhook.create({
    data: {
      appId,
      url: validated.url,
      events: validated.events,
      secret: encryptedSecret,    // Store encrypted secret for signing
      secretHash: secretHash,      // Store hash for display hint
      isActive: validated.isActive ?? true,
    },
  })

  revalidatePath(`/apps/${appId}`)

  return {
    ...webhook,
    secret, // Return raw secret only once (for user to save)
  }
}

/**
 * Update a webhook
 */
export async function updateWebhook(
  appId: string,
  webhookId: string,
  input: UpdateWebhookInput
) {
  await requireSystemAdmin()

  const validated = updateWebhookSchema.parse(input)

  const webhook = await prisma.appWebhook.findFirst({
    where: { id: webhookId, appId },
  })

  if (!webhook) {
    throw new Error('Webhook not found')
  }

  const updated = await prisma.appWebhook.update({
    where: { id: webhookId },
    data: validated as any,
  })

  revalidatePath(`/apps/${appId}`)
  return updated
}

/**
 * Delete a webhook
 */
export async function deleteWebhook(appId: string, webhookId: string) {
  await requireSystemAdmin()

  const webhook = await prisma.appWebhook.findFirst({
    where: { id: webhookId, appId },
  })

  if (!webhook) {
    throw new Error('Webhook not found')
  }

  await prisma.appWebhook.delete({
    where: { id: webhookId },
  })

  revalidatePath(`/apps/${appId}`)
}

/**
 * Test a webhook by sending a test event
 */
export async function testWebhook(appId: string, webhookId: string) {
  await requireSystemAdmin()

  const webhook = await prisma.appWebhook.findFirst({
    where: { id: webhookId, appId },
  })

  if (!webhook) {
    throw new Error('Webhook not found')
  }

  const testPayload = {
    id: `evt_test_${Date.now()}`,
    type: 'test.ping',
    timestamp: new Date().toISOString(),
    appId,
    data: {
      message: 'This is a test webhook event',
    },
  }

  const startTime = Date.now()

  // Decrypt the secret and sign the payload
  const rawSecret = decryptSecret(webhook.secret)
  const payloadString = JSON.stringify(testPayload)
  const signature = signWebhookPayload(payloadString, rawSecret)

  try {
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-AppHub-Event': 'test.ping',
        'X-AppHub-Delivery': testPayload.id,
        'X-AppHub-Signature': signature,
        'X-AppHub-Timestamp': testPayload.timestamp,
      },
      body: payloadString,
    })

    const responseTime = Date.now() - startTime

    // Update webhook stats
    await prisma.appWebhook.update({
      where: { id: webhookId },
      data: {
        lastTriggeredAt: new Date(),
        lastStatus: response.status,
        failureCount: response.ok ? 0 : webhook.failureCount + 1,
      },
    })

    return {
      success: response.ok,
      statusCode: response.status,
      responseTime,
    }
  } catch (error) {
    const responseTime = Date.now() - startTime

    await prisma.appWebhook.update({
      where: { id: webhookId },
      data: {
        lastTriggeredAt: new Date(),
        lastStatus: 0,
        failureCount: webhook.failureCount + 1,
      },
    })

    return {
      success: false,
      statusCode: 0,
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ============================================================================
// USER APP ACCESS ACTIONS
// ============================================================================

/**
 * Get apps accessible to the current user's entity
 * Returns apps with active/trial licenses
 */
export async function getAppsForUser() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  // Get current entity from cookie
  const cookieStore = await cookies()
  let currentEntityId = cookieStore.get('currentEntityId')?.value

  // If no entity is selected via cookie, try to use the user's first entity
  if (!currentEntityId) {
    const firstMembership = await prisma.membership.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'asc' },
    })
    if (firstMembership) {
      currentEntityId = firstMembership.entityId
      // Note: Cannot set cookie here as this may be called from Server Component context
    }
  }

  if (!currentEntityId) {
    return {
      licensed: [],
    }
  }

  // Get apps with active licenses
  const licensedApps = await prisma.app.findMany({
    where: {
      licenses: {
        some: {
          entityId: currentEntityId,
          status: { in: ['ACTIVE', 'TRIAL'] },
        },
      },
    },
    include: {
      licenses: {
        where: {
          entityId: currentEntityId,
          status: { in: ['ACTIVE', 'TRIAL'] },
        },
        include: {
          plan: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  // Serialize dates for client components
  const serializedApps = licensedApps.map(app => ({
    ...app,
    licenses: app.licenses.map(license => ({
      ...license,
      validFrom: license.validFrom.toISOString(),
      validUntil: license.validUntil?.toISOString() ?? null,
      trialEndsAt: license.trialEndsAt?.toISOString() ?? null,
      cancelledAt: license.cancelledAt?.toISOString() ?? null,
      createdAt: license.createdAt.toISOString(),
      updatedAt: license.updatedAt.toISOString(),
    })),
  }))

  return {
    licensed: serializedApps,
  }
}

/**
 * Get available apps that user doesn't have access to yet
 * Returns public, active apps without an active/trial license
 */
export async function getAvailableApps() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  // Get current entity from cookie
  const cookieStore = await cookies()
  let currentEntityId = cookieStore.get('currentEntityId')?.value

  // If no entity is selected via cookie, try to use the user's first entity
  if (!currentEntityId) {
    const firstMembership = await prisma.membership.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'asc' },
    })
    if (firstMembership) {
      currentEntityId = firstMembership.entityId
      // Note: Cannot set cookie here as this may be called from Server Component context
    }
  }

  if (!currentEntityId) {
    // Return all public active apps if no entity
    const apps = await prisma.app.findMany({
      where: {
        status: 'ACTIVE',
        isPublic: true,
        isCore: false, // Exclude core apps like apphub itself
      },
      include: {
        plans: {
          where: { isActive: true, isPublic: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    })
    // Serialize plans
    return apps.map(app => ({
      ...app,
      plans: app.plans.map(plan => ({
        ...plan,
        price: plan.price ? plan.price.toNumber() : null,
      })),
    }))
  }

  // Get apps that are public and active but entity has no active/trial license
  const apps = await prisma.app.findMany({
    where: {
      status: 'ACTIVE',
      isPublic: true,
      isCore: false,
      // No active license
      NOT: {
        licenses: {
          some: {
            entityId: currentEntityId,
            status: { in: ['ACTIVE', 'TRIAL'] },
          },
        },
      },
    },
    include: {
      plans: {
        where: { isActive: true, isPublic: true },
        orderBy: { sortOrder: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  })

  // Serialize plans
  return apps.map(app => ({
    ...app,
    plans: app.plans.map(plan => ({
      ...plan,
      price: plan.price ? plan.price.toNumber() : null,
    })),
  }))
}

/**
 * Get app by slug (for user detail view)
 * Includes available plans for users to select
 */
export async function getAppBySlugForUser(slug: string) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const cookieStore = await cookies()
  const currentEntityId = cookieStore.get('currentEntityId')?.value

  const app = await prisma.app.findUnique({
    where: { slug },
    include: {
      licenses: currentEntityId
        ? {
            where: {
              entityId: currentEntityId,
            },
            include: {
              plan: true,
            },
            orderBy: { validFrom: 'desc' },
          }
        : false,
      plans: {
        where: { isActive: true, isPublic: true },
        orderBy: { sortOrder: 'asc' },
      },
    },
  })

  if (!app) {
    throw new Error('App not found')
  }

  // Determine active license
  const activeLicense = app.licenses?.find(l => ['ACTIVE', 'TRIAL'].includes(l.status))
  const hasActiveLicense = !!activeLicense
  const isPublicApp = app.isPublic && app.status === 'ACTIVE'

  // Serialize for client
  return {
    ...app,
    licenses: (app.licenses as any[])?.map(license => ({
      ...license,
      validFrom: license.validFrom.toISOString(),
      validUntil: license.validUntil?.toISOString() ?? null,
      trialEndsAt: license.trialEndsAt?.toISOString() ?? null,
      cancelledAt: license.cancelledAt?.toISOString() ?? null,
      createdAt: license.createdAt.toISOString(),
      updatedAt: license.updatedAt.toISOString(),
      plan: {
        ...license.plan,
        price: license.plan?.price ? license.plan.price.toNumber() : null,
      },
    })) ?? [],
    plans: app.plans.map(plan => ({
      ...plan,
      price: plan.price ? plan.price.toNumber() : null,
    })),
    hasActiveLicense,
    activeLicense: activeLicense ? {
      ...activeLicense,
      validFrom: activeLicense.validFrom.toISOString(),
      validUntil: activeLicense.validUntil?.toISOString() ?? null,
      trialEndsAt: activeLicense.trialEndsAt?.toISOString() ?? null,
      cancelledAt: activeLicense.cancelledAt?.toISOString() ?? null,
      createdAt: activeLicense.createdAt.toISOString(),
      updatedAt: activeLicense.updatedAt.toISOString(),
      plan: {
        ...(activeLicense as any).plan,
        price: (activeLicense as any).plan?.price ? (activeLicense as any).plan.price.toNumber() : null,
      },
    } : null,
    isPublicApp,
  }
}

/**
 * Request a license for the current user's entity (self-service)
 * Creates an ACTIVE or TRIAL license based on plan settings
 */
export async function requestLicenseForCurrentEntity(appId: string, planId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const cookieStore = await cookies()
  let currentEntityId = cookieStore.get('currentEntityId')?.value

  // If no entity is selected via cookie, try to use the user's first entity
  if (!currentEntityId) {
    const firstMembership = await prisma.membership.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'asc' },
    })
    if (firstMembership) {
      currentEntityId = firstMembership.entityId
      // Persist for future requests
      cookieStore.set('currentEntityId', currentEntityId)
    }
  }

  if (!currentEntityId) {
    throw new Error('No entity selected')
  }

  // Verify the user has permission to manage this entity (owner/admin)
  const membership = await prisma.membership.findUnique({
    where: {
      userId_entityId: {
        userId: session.user.id,
        entityId: currentEntityId,
      },
    },
  })

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    throw new Error('You do not have permission to manage licenses for this entity')
  }

  // Check if entity already has an active/trial license for this app
  const existingLicense = await prisma.license.findUnique({
    where: {
      entityId_appId: {
        entityId: currentEntityId,
        appId,
      },
    },
  })

  if (existingLicense && ['ACTIVE', 'TRIAL'].includes(existingLicense.status)) {
    throw new Error('This entity already has an active license for this app')
  }

  // Get the plan and app
  const plan = await prisma.plan.findUnique({
    where: { id: planId },
    include: { app: true },
  })

  if (!plan) {
    throw new Error('Plan not found')
  }

  if (plan.appId !== appId) {
    throw new Error('Plan does not belong to this app')
  }

  if (!plan.isActive || !plan.isPublic) {
    throw new Error('This plan is not available')
  }

  // Determine license status and dates
  const now = new Date()
  const isTrial = plan.isTrial
  const trialEndsAt = isTrial && plan.trialDays ? new Date(now.getTime() + plan.trialDays * 24 * 60 * 60 * 1000) : null

  // Create or update the license
  const license = existingLicense
    ? await prisma.license.update({
        where: { id: existingLicense.id },
        data: {
          planId,
          status: isTrial ? 'TRIAL' : 'ACTIVE',
          validFrom: now,
          validUntil: null,
          trialEndsAt,
          cancelledAt: null,
        },
        include: { plan: true },
      })
    : await prisma.license.create({
        data: {
          entityId: currentEntityId,
          appId,
          planId,
          status: isTrial ? 'TRIAL' : 'ACTIVE',
          validFrom: now,
          trialEndsAt,
        },
        include: { plan: true },
      })

  revalidatePath('/my-apps')
  revalidatePath(`/my-apps/${plan.app.slug}`)

  return {
    ...license,
    validFrom: license.validFrom.toISOString(),
    validUntil: license.validUntil?.toISOString() ?? null,
    trialEndsAt: license.trialEndsAt?.toISOString() ?? null,
    cancelledAt: license.cancelledAt?.toISOString() ?? null,
    createdAt: license.createdAt.toISOString(),
    updatedAt: license.updatedAt.toISOString(),
    plan: {
      ...license.plan,
      price: license.plan.price ? license.plan.price.toNumber() : null,
    },
  }
}

// ============================================================================
// LICENSE MANAGEMENT (System Admin Only)
// ============================================================================

/**
 * Admin assigns a license to an entity with a specific plan
 */
export async function adminAssignLicense(
  entityId: string,
  appId: string,
  planId: string,
  options?: { validFrom?: Date }
) {
  await requireSystemAdmin()

  // Check if entity already has a license for this app
  const existingLicense = await prisma.license.findUnique({
    where: {
      entityId_appId: {
        entityId,
        appId,
      },
    },
  })

  if (existingLicense && ['ACTIVE', 'TRIAL'].includes(existingLicense.status)) {
    throw new Error('Entity already has an active license for this app')
  }

  // Get the plan
  const plan = await prisma.plan.findUnique({
    where: { id: planId },
  })

  if (!plan) {
    throw new Error('Plan not found')
  }

  if (plan.appId !== appId) {
    throw new Error('Plan does not belong to this app')
  }

  const now = options?.validFrom ?? new Date()
  const isTrial = plan.isTrial
  const trialEndsAt = isTrial && plan.trialDays ? new Date(now.getTime() + plan.trialDays * 24 * 60 * 60 * 1000) : null

  // Create or reactivate the license
  const license = existingLicense
    ? await prisma.license.update({
        where: { id: existingLicense.id },
        data: {
          planId,
          status: isTrial ? 'TRIAL' : 'ACTIVE',
          validFrom: now,
          validUntil: null,
          trialEndsAt,
          cancelledAt: null,
        },
        include: { plan: true, entity: true },
      })
    : await prisma.license.create({
        data: {
          entityId,
          appId,
          planId,
          status: isTrial ? 'TRIAL' : 'ACTIVE',
          validFrom: now,
          trialEndsAt,
        },
        include: { plan: true, entity: true },
      })

  revalidatePath(`/apps/${appId}`)

  return {
    ...license,
    validFrom: license.validFrom.toISOString(),
    validUntil: license.validUntil?.toISOString() ?? null,
    trialEndsAt: license.trialEndsAt?.toISOString() ?? null,
    cancelledAt: license.cancelledAt?.toISOString() ?? null,
    createdAt: license.createdAt.toISOString(),
    updatedAt: license.updatedAt.toISOString(),
    plan: {
      ...license.plan,
      price: license.plan.price ? license.plan.price.toNumber() : null,
    },
  }
}

/**
 * Admin revokes a license (sets status to CANCELLED)
 */
export async function adminRevokeLicense(entityId: string, appId: string) {
  await requireSystemAdmin()

  const license = await prisma.license.findUnique({
    where: {
      entityId_appId: {
        entityId,
        appId,
      },
    },
  })

  if (!license) {
    throw new Error('License not found')
  }

  if (license.status === 'CANCELLED') {
    throw new Error('License is already cancelled')
  }

  const updated = await prisma.license.update({
    where: { id: license.id },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
    },
  })

  revalidatePath(`/apps/${appId}`)

  return updated
}

/**
 * Admin changes the plan for an existing license
 */
export async function adminChangeLicensePlan(entityId: string, appId: string, newPlanId: string) {
  await requireSystemAdmin()

  const license = await prisma.license.findUnique({
    where: {
      entityId_appId: {
        entityId,
        appId,
      },
    },
  })

  if (!license) {
    throw new Error('License not found')
  }

  // Verify new plan belongs to this app
  const plan = await prisma.plan.findUnique({
    where: { id: newPlanId },
  })

  if (!plan || plan.appId !== appId) {
    throw new Error('Invalid plan for this app')
  }

  const updated = await prisma.license.update({
    where: { id: license.id },
    data: {
      planId: newPlanId,
    },
    include: { plan: true },
  })

  revalidatePath(`/apps/${appId}`)

  return {
    ...updated,
    plan: {
      ...updated.plan,
      price: updated.plan.price ? updated.plan.price.toNumber() : null,
    },
  }
}

/**
 * Get all entities with licenses for an app
 */
export async function getEntitiesForApp(appId: string) {
  await requireSystemAdmin()

  // Get all licenses for this app with entity and plan data
  const licenses = await prisma.license.findMany({
    where: { appId },
    include: {
      entity: true,
      plan: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
    orderBy: [{ entity: { name: 'asc' } }, { validFrom: 'desc' }],
  })

  // Get all entities (for granting new licenses)
  const allEntities = await prisma.entity.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
    },
    orderBy: { name: 'asc' },
  })

  // Get all plans for this app (for the grant dialog)
  const plans = await prisma.plan.findMany({
    where: { appId, isActive: true },
    orderBy: { sortOrder: 'asc' },
  })

  // Transform licenses to entity-centric structure
  const entitiesWithLicenses = licenses.map(license => ({
    id: license.entity.id,
    name: license.entity.name,
    slug: license.entity.slug,
    license: {
      id: license.id,
      status: license.status,
      validFrom: license.validFrom.toISOString(),
      validUntil: license.validUntil?.toISOString() ?? null,
      trialEndsAt: license.trialEndsAt?.toISOString() ?? null,
      cancelledAt: license.cancelledAt?.toISOString() ?? null,
      plan: license.plan,
    },
  }))

  return {
    entitiesWithLicenses,
    allEntities,
    plans: plans.map(plan => ({
      ...plan,
      price: plan.price ? plan.price.toNumber() : null,
    })),
  }
}

