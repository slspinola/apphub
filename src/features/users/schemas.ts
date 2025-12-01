import { z } from 'zod'

/**
 * Available user roles:
 * - user: Standard user with basic permissions
 * - admin: Administrator with elevated permissions within entities
 * - system_admin: Full system access, can manage all users and entities
 */
export const UserRoles = ['user', 'admin', 'system_admin'] as const
export type UserRole = typeof UserRoles[number]

export const CreateUserSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(UserRoles).default('user'),
    status: z.enum(['active', 'inactive']).default('active'),
})

export const UpdateUserSchema = z.object({
    id: z.string(),
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    role: z.enum(UserRoles),
    status: z.enum(['active', 'inactive']),
})

export type CreateUserInput = z.infer<typeof CreateUserSchema>
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>
