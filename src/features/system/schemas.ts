import { z } from 'zod'

// White Label Settings Schema
export const WhiteLabelSettingsSchema = z.object({
    companyName: z.string().min(1, 'Company name is required'),
    productName: z.string().min(1, 'Product name is required'),
    companyLogo: z.string().url('Invalid URL').optional().or(z.literal('')),
    productLogo: z.string().url('Invalid URL').optional().or(z.literal('')),
})

export type WhiteLabelSettingsInput = z.infer<typeof WhiteLabelSettingsSchema>

// General Settings Schema
export const GeneralSettingsSchema = z.object({
    defaultLanguage: z.string().min(2, 'Language is required'),
    defaultTimezone: z.string().min(1, 'Timezone is required'),
    defaultCountry: z.string().min(2, 'Country is required'),
})

export type GeneralSettingsInput = z.infer<typeof GeneralSettingsSchema>

// Combined Schema (for backwards compatibility)
export const UpdateSystemSettingsSchema = WhiteLabelSettingsSchema.merge(GeneralSettingsSchema)

export type UpdateSystemSettingsInput = z.infer<typeof UpdateSystemSettingsSchema>
