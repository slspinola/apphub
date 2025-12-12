// ============================================================================
// Webhook Event Dispatcher Service
// ============================================================================

import { prisma } from '@/lib/prisma'
import { decryptSecret, signWebhookPayload } from '@/lib/apps/oauth'

// Webhook event types
export type WebhookEventType =
  | 'user.created'
  | 'user.updated'
  | 'user.deleted'
  | 'user.suspended'
  | 'user.activated'
  | 'entity.updated'
  | 'entity.settings.updated'
  | 'membership.created'
  | 'membership.updated'
  | 'membership.deleted'
  | 'license.activated'
  | 'license.updated'
  | 'license.suspended'
  | 'license.cancelled'
  | 'license.expired'
  | 'test.ping'

export interface WebhookPayload {
  id: string
  type: WebhookEventType
  timestamp: string
  appId: string
  data: Record<string, unknown>
}

export interface WebhookDeliveryResult {
  webhookId: string
  success: boolean
  statusCode: number
  responseTime: number
  error?: string
}

/**
 * Dispatch a webhook event to all subscribed webhooks for an app
 */
export async function dispatchWebhookEvent(
  appId: string,
  eventType: WebhookEventType,
  data: Record<string, unknown>
): Promise<WebhookDeliveryResult[]> {
  // Find all active webhooks for this app that subscribe to this event
  const webhooks = await prisma.appWebhook.findMany({
    where: {
      appId,
      isActive: true,
      events: {
        has: eventType,
      },
    },
  })

  if (webhooks.length === 0) {
    return []
  }

  const payload: WebhookPayload = {
    id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    type: eventType,
    timestamp: new Date().toISOString(),
    appId,
    data,
  }

  // Dispatch to all webhooks in parallel
  const results = await Promise.all(
    webhooks.map((webhook) => deliverWebhook(webhook, payload))
  )

  return results
}

/**
 * Dispatch a webhook event to all apps that have an active license for an entity
 */
export async function dispatchEventToEntityApps(
  entityId: string,
  eventType: WebhookEventType,
  data: Record<string, unknown>
): Promise<WebhookDeliveryResult[]> {
  // Find all apps with active licenses for this entity
  const licenses = await prisma.license.findMany({
    where: {
      entityId,
      status: { in: ['ACTIVE', 'TRIAL'] },
    },
    include: {
      app: {
        include: {
          webhooks: {
            where: {
              isActive: true,
              events: { has: eventType },
            },
          },
        },
      },
    },
  })

  const allResults: WebhookDeliveryResult[] = []

  for (const license of licenses) {
    const payload: WebhookPayload = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type: eventType,
      timestamp: new Date().toISOString(),
      appId: license.appId,
      data: {
        ...data,
        entityId,
      },
    }

    const results = await Promise.all(
      license.app.webhooks.map((webhook) => deliverWebhook(webhook, payload))
    )

    allResults.push(...results)
  }

  return allResults
}

/**
 * Deliver a webhook payload to a single webhook endpoint
 */
async function deliverWebhook(
  webhook: { id: string; url: string; secret: string; failureCount: number },
  payload: WebhookPayload
): Promise<WebhookDeliveryResult> {
  const startTime = Date.now()

  try {
    // Decrypt the secret and sign the payload
    const rawSecret = decryptSecret(webhook.secret)
    const payloadString = JSON.stringify(payload)
    const signature = signWebhookPayload(payloadString, rawSecret)

    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-AppHub-Event': payload.type,
        'X-AppHub-Delivery': payload.id,
        'X-AppHub-Signature': signature,
        'X-AppHub-Timestamp': payload.timestamp,
        'User-Agent': 'AppHub-Webhook/1.0',
      },
      body: payloadString,
      // Timeout after 30 seconds
      signal: AbortSignal.timeout(30000),
    })

    const responseTime = Date.now() - startTime

    // Update webhook stats
    await prisma.appWebhook.update({
      where: { id: webhook.id },
      data: {
        lastTriggeredAt: new Date(),
        lastStatus: response.status,
        failureCount: response.ok ? 0 : webhook.failureCount + 1,
      },
    })

    return {
      webhookId: webhook.id,
      success: response.ok,
      statusCode: response.status,
      responseTime,
    }
  } catch (error) {
    const responseTime = Date.now() - startTime

    // Update webhook stats on error
    await prisma.appWebhook.update({
      where: { id: webhook.id },
      data: {
        lastTriggeredAt: new Date(),
        lastStatus: 0,
        failureCount: webhook.failureCount + 1,
      },
    })

    return {
      webhookId: webhook.id,
      success: false,
      statusCode: 0,
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ============================================================================
// Convenience functions for specific event types
// ============================================================================

/**
 * Dispatch user-related events
 */
export async function dispatchUserEvent(
  entityId: string,
  eventType: 'user.created' | 'user.updated' | 'user.deleted' | 'user.suspended' | 'user.activated',
  userData: {
    userId: string
    email: string
    name?: string | null
    role?: string
  }
): Promise<WebhookDeliveryResult[]> {
  return dispatchEventToEntityApps(entityId, eventType, userData)
}

/**
 * Dispatch membership-related events
 */
export async function dispatchMembershipEvent(
  entityId: string,
  eventType: 'membership.created' | 'membership.updated' | 'membership.deleted',
  membershipData: {
    membershipId: string
    userId: string
    role: string
  }
): Promise<WebhookDeliveryResult[]> {
  return dispatchEventToEntityApps(entityId, eventType, membershipData)
}

/**
 * Dispatch license-related events
 */
export async function dispatchLicenseEvent(
  appId: string,
  eventType: 'license.activated' | 'license.updated' | 'license.suspended' | 'license.cancelled' | 'license.expired',
  licenseData: {
    licenseId: string
    entityId: string
    planId?: string
    status: string
  }
): Promise<WebhookDeliveryResult[]> {
  return dispatchWebhookEvent(appId, eventType, licenseData)
}

/**
 * Dispatch entity-related events
 */
export async function dispatchEntityEvent(
  entityId: string,
  eventType: 'entity.updated' | 'entity.settings.updated',
  entityData: Record<string, unknown>
): Promise<WebhookDeliveryResult[]> {
  return dispatchEventToEntityApps(entityId, eventType, entityData)
}
