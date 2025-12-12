import { z } from 'zod'

export const CreateEntitySchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    slug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
    parentId: z.string().nullish(),
})

export const UpdateEntitySchema = z.object({
    id: z.string(),
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    slug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens').optional(),
    parentId: z.string().nullish(),
})

export const CreateInvitationSchema = z.object({
    email: z.string().email('Invalid email address'),
    role: z.string().default('member'), // Simplified for now to string to avoid enum issues during build if types mismatch
    entityId: z.string().min(1, 'Entity ID is required'),
})

export const AcceptInvitationSchema = z.object({
    token: z.string().min(1, 'Token is required'),
})
