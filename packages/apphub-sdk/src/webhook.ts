// ============================================================================
// APPHUB SDK - Webhook Handler Module
// ============================================================================

import type {
  WebhookEvent,
  WebhookEventType,
  UserEventData,
  MembershipEventData,
  LicenseEventData,
} from './types'

/**
 * Webhook handler function type
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WebhookHandler<T = any> = (
  event: WebhookEvent<T>
) => Promise<void> | void

/**
 * Map of event types to their handlers
 */
export type WebhookHandlerMap = Partial<Record<WebhookEventType, WebhookHandler>>

/**
 * HMAC signature utilities for webhook verification
 */
async function computeHmacSha256(payload: string, secret: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
    return Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  } else {
    // Node.js fallback
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nodeCrypto = require('crypto')
    return nodeCrypto.createHmac('sha256', secret).update(payload).digest('hex')
  }
}

/**
 * Timing-safe string comparison
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

/**
 * Verify webhook signature from AppHub
 */
export async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const expectedSignature = await computeHmacSha256(payload, secret)
  const providedSignature = signature.startsWith('sha256=')
    ? signature.slice(7)
    : signature
  
  return timingSafeEqual(expectedSignature, providedSignature)
}

/**
 * Parse and validate a webhook request
 */
export async function parseWebhookRequest<T = Record<string, unknown>>(
  payload: string,
  signature: string,
  secret: string
): Promise<WebhookEvent<T>> {
  // Verify signature
  const isValid = await verifyWebhookSignature(payload, signature, secret)
  if (!isValid) {
    throw new WebhookError('invalid_signature', 'Invalid webhook signature')
  }

  // Parse payload
  try {
    const event = JSON.parse(payload) as WebhookEvent<T>
    
    // Basic validation
    if (!event.id || !event.type || !event.timestamp) {
      throw new WebhookError('invalid_payload', 'Missing required event fields')
    }
    
    return event
  } catch (error) {
    if (error instanceof WebhookError) throw error
    throw new WebhookError('parse_error', 'Failed to parse webhook payload')
  }
}

/**
 * Webhook error class
 */
export class WebhookError extends Error {
  code: string
  
  constructor(code: string, message: string) {
    super(message)
    this.name = 'WebhookError'
    this.code = code
  }
}

/**
 * Webhook processor for handling multiple event types
 */
export class WebhookProcessor {
  private secret: string
  private handlers: WebhookHandlerMap = {}
  private defaultHandler?: WebhookHandler

  constructor(secret: string) {
    this.secret = secret
  }

  /**
   * Register a handler for a specific event type
   */
  on(eventType: WebhookEventType, handler: WebhookHandler): this {
    this.handlers[eventType] = handler
    return this
  }

  /**
   * Register a default handler for unhandled events
   */
  onDefault(handler: WebhookHandler): this {
    this.defaultHandler = handler
    return this
  }

  /**
   * Register handlers for user events
   */
  onUserCreated(handler: WebhookHandler<UserEventData>): this {
    return this.on('user.created', handler)
  }

  onUserUpdated(handler: WebhookHandler<UserEventData>): this {
    return this.on('user.updated', handler)
  }

  onUserDeleted(handler: WebhookHandler<UserEventData>): this {
    return this.on('user.deleted', handler)
  }

  /**
   * Register handlers for membership events
   */
  onMembershipCreated(handler: WebhookHandler<MembershipEventData>): this {
    return this.on('membership.created', handler)
  }

  onMembershipUpdated(handler: WebhookHandler<MembershipEventData>): this {
    return this.on('membership.updated', handler)
  }

  onMembershipDeleted(handler: WebhookHandler<MembershipEventData>): this {
    return this.on('membership.deleted', handler)
  }

  /**
   * Register handlers for license events
   */
  onLicenseActivated(handler: WebhookHandler<LicenseEventData>): this {
    return this.on('license.activated', handler)
  }

  onLicenseSuspended(handler: WebhookHandler<LicenseEventData>): this {
    return this.on('license.suspended', handler)
  }

  onLicenseCancelled(handler: WebhookHandler<LicenseEventData>): this {
    return this.on('license.cancelled', handler)
  }

  /**
   * Process a webhook request
   */
  async process(payload: string, signature: string): Promise<WebhookEvent> {
    const event = await parseWebhookRequest(payload, signature, this.secret)
    
    const handler = this.handlers[event.type] ?? this.defaultHandler
    if (handler) {
      await handler(event)
    }
    
    return event
  }

  /**
   * Create a request handler for common frameworks
   */
  createHandler() {
    return async (req: {
      text?: () => Promise<string>
      body?: string | Record<string, unknown>
      headers: Headers | Record<string, string | string[] | undefined>
    }): Promise<{ success: boolean; event?: WebhookEvent; error?: string }> => {
      try {
        // Get payload
        let payload: string
        if (typeof req.text === 'function') {
          payload = await req.text()
        } else if (typeof req.body === 'string') {
          payload = req.body
        } else if (req.body) {
          payload = JSON.stringify(req.body)
        } else {
          throw new WebhookError('no_payload', 'No request body')
        }

        // Get signature
        let signature: string | null = null
        if (req.headers instanceof Headers) {
          signature = req.headers.get('x-apphub-signature')
        } else {
          const header = req.headers['x-apphub-signature'] ?? req.headers['X-AppHub-Signature']
          signature = Array.isArray(header) ? header[0] : header ?? null
        }

        if (!signature) {
          throw new WebhookError('no_signature', 'Missing X-AppHub-Signature header')
        }

        const event = await this.process(payload, signature)
        return { success: true, event }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      }
    }
  }
}

/**
 * Create a webhook processor
 */
export function createWebhookProcessor(secret: string): WebhookProcessor {
  return new WebhookProcessor(secret)
}

// ============================================================================
// NEXT.JS WEBHOOK HANDLER HELPER
// ============================================================================

/**
 * Options for creating a Next.js webhook handler
 */
export interface NextJSWebhookOptions {
  secret: string
  handlers: WebhookHandlerMap
  onError?: (error: Error) => void
}

/**
 * Create a Next.js API route handler for webhooks
 * For use in app/api/webhooks/apphub/route.ts
 */
export function createNextJSWebhookHandler(options: NextJSWebhookOptions) {
  const processor = new WebhookProcessor(options.secret)
  
  // Register all handlers
  for (const [eventType, handler] of Object.entries(options.handlers)) {
    if (handler) {
      processor.on(eventType as WebhookEventType, handler)
    }
  }

  return async function POST(request: Request): Promise<Response> {
    try {
      const payload = await request.text()
      const signature = request.headers.get('x-apphub-signature')

      if (!signature) {
        return Response.json(
          { error: 'Missing signature' },
          { status: 401 }
        )
      }

      const event = await processor.process(payload, signature)
      
      return Response.json({ received: true, eventId: event.id })
    } catch (error) {
      if (options.onError && error instanceof Error) {
        options.onError(error)
      }

      if (error instanceof WebhookError) {
        if (error.code === 'invalid_signature') {
          return Response.json({ error: error.message }, { status: 401 })
        }
        return Response.json({ error: error.message }, { status: 400 })
      }

      return Response.json({ error: 'Internal error' }, { status: 500 })
    }
  }
}

