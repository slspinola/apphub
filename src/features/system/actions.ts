'use server'

import { prisma } from '@/lib/prisma'
import { UpdateSystemSettingsSchema, UpdateSystemSettingsInput, WhiteLabelSettingsSchema, GeneralSettingsSchema } from './schemas'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'
import { SystemSettings } from '@prisma/client'
import { z } from 'zod'

type ActionResponse<T> =
    | { success: true; data: T; message?: string }
    | { success: false; error: string }

export async function getSystemSettings(): Promise<ActionResponse<SystemSettings>> {
    try {
        const settings = await prisma.systemSettings.findFirst()

        if (!settings) {
            // Return default settings if none exist
            return {
                success: true,
                data: {
                    id: 'default',
                    companyName: 'Acme Corp',
                    productName: 'AppHub',
                    companyLogo: null,
                    productLogo: null,
                    defaultLanguage: 'en',
                    defaultTimezone: 'UTC',
                    defaultCountry: 'US',
                    updatedAt: new Date(),
                } as SystemSettings
            }
        }

        return { success: true, data: settings }
    } catch (error) {
        return { success: false, error: 'Failed to fetch system settings' }
    }
}

export async function updateSystemSettings(data: UpdateSystemSettingsInput): Promise<ActionResponse<SystemSettings>> {
    const session = await auth()
    if (!session?.user) {
        return { success: false, error: 'Unauthorized' }
    }

    // TODO: Add role check here (e.g. only admin can update settings)

    const result = UpdateSystemSettingsSchema.safeParse(data)

    if (!result.success) {
        return { success: false, error: 'Invalid data' }
    }

    try {
        const existingSettings = await prisma.systemSettings.findFirst()

        let settings: SystemSettings

        if (existingSettings) {
            settings = await prisma.systemSettings.update({
                where: { id: existingSettings.id },
                data: result.data,
            })
        } else {
            settings = await prisma.systemSettings.create({
                data: result.data,
            })
        }

        revalidatePath('/')
        return { success: true, data: settings, message: 'Settings updated successfully' }
    } catch (error) {
        return { success: false, error: 'Failed to update system settings' }
    }
}

export async function updateWhiteLabelSettings(data: z.infer<typeof WhiteLabelSettingsSchema>): Promise<ActionResponse<SystemSettings>> {
    const session = await auth()
    if (!session?.user) {
        return { success: false, error: 'Unauthorized' }
    }

    const result = WhiteLabelSettingsSchema.safeParse(data)

    if (!result.success) {
        return { success: false, error: 'Invalid data' }
    }

    try {
        const existingSettings = await prisma.systemSettings.findFirst()

        let settings: SystemSettings

        if (existingSettings) {
            settings = await prisma.systemSettings.update({
                where: { id: existingSettings.id },
                data: result.data,
            })
        } else {
            settings = await prisma.systemSettings.create({
                data: {
                    ...result.data,
                    defaultLanguage: 'en',
                    defaultTimezone: 'UTC',
                    defaultCountry: 'US',
                },
            })
        }

        revalidatePath('/')
        revalidatePath('/settings/white-label')
        return { success: true, data: settings, message: 'White label settings updated successfully' }
    } catch (error) {
        return { success: false, error: 'Failed to update white label settings' }
    }
}

export async function updateGeneralSettings(data: z.infer<typeof GeneralSettingsSchema>): Promise<ActionResponse<SystemSettings>> {
    const session = await auth()
    if (!session?.user) {
        return { success: false, error: 'Unauthorized' }
    }

    const result = GeneralSettingsSchema.safeParse(data)

    if (!result.success) {
        return { success: false, error: 'Invalid data' }
    }

    try {
        const existingSettings = await prisma.systemSettings.findFirst()

        let settings: SystemSettings

        if (existingSettings) {
            settings = await prisma.systemSettings.update({
                where: { id: existingSettings.id },
                data: result.data,
            })
        } else {
            settings = await prisma.systemSettings.create({
                data: {
                    companyName: 'Acme Corp',
                    productName: 'AppHub',
                    ...result.data,
                },
            })
        }

        revalidatePath('/')
        revalidatePath('/settings/general')
        return { success: true, data: settings, message: 'General settings updated successfully' }
    } catch (error) {
        return { success: false, error: 'Failed to update general settings' }
    }
}
