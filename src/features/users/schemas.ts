import { z } from 'zod'

export const CreateUserSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['user', 'admin']).default('user'),
    status: z.enum(['active', 'inactive']).default('active'),
})

export const UpdateUserSchema = z.object({
    id: z.string(),
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    role: z.enum(['user', 'admin']),
    status: z.enum(['active', 'inactive']),
})

export type CreateUserInput = z.infer<typeof CreateUserSchema>
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>
