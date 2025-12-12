import { z } from 'zod'

// ============================================================================
// APP SCHEMAS
// ============================================================================

export const appStatusSchema = z.enum([
  'DRAFT',
  'BETA',
  'ACTIVE',
  'SUSPENDED',
  'DEPRECATED',
  'ARCHIVED',
])

// Helper to handle optional URL fields (transforms empty strings to null)
const optionalUrl = (message: string) =>
  z.preprocess(
    (val) => (val === '' ? null : val),
    z.string().url(message).nullable().optional()
  )

export const createAppSchema = z.object({
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .max(50, 'Slug must be at most 50 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),
  description: z
    .preprocess((val) => (val === '' ? null : val), z.string().max(500, 'Description must be at most 500 characters').nullable().optional()),
  icon: optionalUrl('Icon must be a valid URL'),
  color: z
    .preprocess(
      (val) => (val === '' ? null : val),
      z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color').nullable().optional()
    ),
  baseUrl: z.string().url('Base URL must be a valid URL'),
  loginUrl: optionalUrl('Login URL must be a valid URL'),
  docsUrl: optionalUrl('Documentation URL must be a valid URL'),
  supportUrl: optionalUrl('Support URL must be a valid URL'),
  isPublic: z.boolean().optional().default(true),
  settings: z.record(z.unknown()).optional().default({}),
  metadata: z.record(z.unknown()).optional().default({}),
})

export const updateAppSchema = createAppSchema.partial().omit({ slug: true })

export const changeAppStatusSchema = z.object({
  status: appStatusSchema,
  reason: z.string().max(500).optional(),
})

// ============================================================================
// OAUTH SCHEMAS
// ============================================================================

export const oauthConfigSchema = z.object({
  redirectUris: z
    .array(z.string().url('Redirect URI must be a valid URL'))
    .min(1, 'At least one redirect URI is required'),
  scopes: z.array(z.string()).optional(),
  grantTypes: z.array(z.string()).optional(),
  tokenLifetime: z.number().min(300).max(86400).optional(), // 5 min to 24 hours
  refreshTokenLifetime: z.number().min(3600).max(2592000).optional(), // 1 hour to 30 days
})

export const generateCredentialsSchema = z.object({
  regenerateSecret: z.boolean().optional().default(false),
})

// ============================================================================
// PERMISSION SCHEMAS
// ============================================================================

export const createPermissionSchema = z.object({
  slug: z
    .string()
    .min(3, 'Slug must be at least 3 characters')
    .max(100, 'Slug must be at most 100 characters')
    .regex(/^[a-z0-9:_-]+$/, 'Slug can only contain lowercase letters, numbers, colons, underscores, and hyphens'),
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),
  description: z.string().max(500).optional().nullable(),
  resource: z
    .string()
    .min(2, 'Resource must be at least 2 characters')
    .max(50, 'Resource must be at most 50 characters'),
  action: z
    .string()
    .min(2, 'Action must be at least 2 characters')
    .max(50, 'Action must be at most 50 characters'),
  groupName: z.string().max(100).optional().nullable(),
  sortOrder: z.number().int().min(0).optional().default(0),
  isDefault: z.boolean().optional().default(false),
})

export const updatePermissionSchema = createPermissionSchema.partial().omit({ slug: true })

export const syncPermissionsSchema = z.object({
  permissions: z.array(createPermissionSchema),
})

// ============================================================================
// SCOPE TYPE SCHEMAS
// ============================================================================

export const createScopeTypeSchema = z.object({
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .max(50, 'Slug must be at most 50 characters')
    .regex(/^[a-z0-9_-]+$/, 'Slug can only contain lowercase letters, numbers, underscores, and hyphens'),
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),
  description: z.string().max(500).optional().nullable(),
  requiresSelection: z.boolean().optional().default(true),
  multiSelect: z.boolean().optional().default(false),
  optionsEndpoint: z.string().max(500).optional().nullable(),
  valueSchema: z.record(z.unknown()).optional().nullable(),
  sortOrder: z.number().int().min(0).optional().default(0),
})

export const updateScopeTypeSchema = createScopeTypeSchema.partial().omit({ slug: true })

export const syncScopeTypesSchema = z.object({
  scopeTypes: z.array(createScopeTypeSchema),
})

// ============================================================================
// PLAN SCHEMAS
// ============================================================================

export const createPlanSchema = z.object({
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .max(50, 'Slug must be at most 50 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),
  description: z.string().max(500).optional().nullable(),
  price: z.number().min(0).optional().nullable(),
  currency: z.string().length(3, 'Currency must be a 3-letter code').optional().nullable(),
  billingCycle: z.enum(['monthly', 'yearly', 'one-time']).optional().nullable(),
  limits: z.record(z.number()).optional().default({}),
  features: z.record(z.boolean()).optional().default({}),
  isPublic: z.boolean().optional().default(true),
  isTrial: z.boolean().optional().default(false),
  trialDays: z.number().int().min(1).max(365).optional().nullable(),
  sortOrder: z.number().int().min(0).optional().default(0),
})

export const updatePlanSchema = createPlanSchema.partial().omit({ slug: true })

// ============================================================================
// LICENSE SCHEMAS
// ============================================================================

export const licenseStatusSchema = z.enum([
  'TRIAL',
  'ACTIVE',
  'SUSPENDED',
  'CANCELLED',
  'EXPIRED',
])

export const createLicenseSchema = z.object({
  entityId: z.string().cuid('Invalid entity ID'),
  appId: z.string().cuid('Invalid app ID'),
  planId: z.string().cuid('Invalid plan ID'),
  status: licenseStatusSchema.optional().default('ACTIVE'),
  validFrom: z.coerce.date().optional(),
  validUntil: z.coerce.date().optional().nullable(),
  trialEndsAt: z.coerce.date().optional().nullable(),
  metadata: z.record(z.unknown()).optional().default({}),
})

export const updateLicenseSchema = z.object({
  planId: z.string().cuid('Invalid plan ID').optional(),
  status: licenseStatusSchema.optional(),
  validUntil: z.coerce.date().optional().nullable(),
  metadata: z.record(z.unknown()).optional(),
})

// ============================================================================
// WEBHOOK SCHEMAS
// ============================================================================

export const webhookEventSchema = z.enum([
  'user.created',
  'user.updated',
  'user.deleted',
  'user.suspended',
  'user.activated',
  'entity.updated',
  'entity.settings.updated',
  'membership.created',
  'membership.updated',
  'membership.deleted',
  'license.activated',
  'license.updated',
  'license.suspended',
  'license.cancelled',
  'license.expired',
])

export const createWebhookSchema = z.object({
  url: z.string().url('Webhook URL must be a valid URL'),
  events: z.array(webhookEventSchema).min(1, 'At least one event is required'),
  isActive: z.boolean().optional().default(true),
})

export const updateWebhookSchema = createWebhookSchema.partial()

// ============================================================================
// MEMBERSHIP SCOPE SCHEMAS
// ============================================================================

export const createMembershipScopeSchema = z.object({
  membershipId: z.string().cuid('Invalid membership ID'),
  appId: z.string().cuid('Invalid app ID'),
  scopeType: z.string().min(2).max(50),
  scopeValue: z.record(z.unknown()).optional().nullable(),
})

export const updateMembershipScopeSchema = z.object({
  scopeType: z.string().min(2).max(50),
  scopeValue: z.record(z.unknown()).optional().nullable(),
})

// ============================================================================
// QUERY SCHEMAS
// ============================================================================

export const appsQuerySchema = z.object({
  status: appStatusSchema.optional(),
  isPublic: z.coerce.boolean().optional(),
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  perPage: z.coerce.number().int().min(1).max(100).optional().default(20),
})

export const permissionsQuerySchema = z.object({
  resource: z.string().max(50).optional(),
  groupName: z.string().max(100).optional(),
})

export const plansQuerySchema = z.object({
  isActive: z.coerce.boolean().optional(),
  isPublic: z.coerce.boolean().optional(),
})

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CreateAppInput = z.infer<typeof createAppSchema>
export type UpdateAppInput = z.infer<typeof updateAppSchema>
export type ChangeAppStatusInput = z.infer<typeof changeAppStatusSchema>
export type OAuthConfigInput = z.infer<typeof oauthConfigSchema>
export type GenerateCredentialsInput = z.infer<typeof generateCredentialsSchema>
export type CreatePermissionInput = z.infer<typeof createPermissionSchema>
export type UpdatePermissionInput = z.infer<typeof updatePermissionSchema>
export type SyncPermissionsInput = z.infer<typeof syncPermissionsSchema>
export type CreateScopeTypeInput = z.infer<typeof createScopeTypeSchema>
export type UpdateScopeTypeInput = z.infer<typeof updateScopeTypeSchema>
export type SyncScopeTypesInput = z.infer<typeof syncScopeTypesSchema>
export type CreatePlanInput = z.infer<typeof createPlanSchema>
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>
export type CreateLicenseInput = z.infer<typeof createLicenseSchema>
export type UpdateLicenseInput = z.infer<typeof updateLicenseSchema>
export type CreateWebhookInput = z.infer<typeof createWebhookSchema>
export type UpdateWebhookInput = z.infer<typeof updateWebhookSchema>
export type CreateMembershipScopeInput = z.infer<typeof createMembershipScopeSchema>
export type UpdateMembershipScopeInput = z.infer<typeof updateMembershipScopeSchema>
export type AppsQueryInput = z.infer<typeof appsQuerySchema>
export type PermissionsQueryInput = z.infer<typeof permissionsQuerySchema>
export type PlansQueryInput = z.infer<typeof plansQuerySchema>

