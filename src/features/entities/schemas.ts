import { z } from 'zod'

export const CreateEntitySchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    slug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
    parentId: z.string().optional(),
})

export const UpdateEntitySchema = z.object({
    id: z.string(),
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    slug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens').optional(),
    parentId: z.string().optional(),
})
