import { z } from 'zod'

export const UpdateSystemSettingsSchema = z.object({
    companyName: z.string().min(1, 'Company name is required'),
    productName: z.string().min(1, 'Product name is required'),
    companyLogo: z.string().url('Invalid URL').optional().or(z.literal('')),
    productLogo: z.string().url('Invalid URL').optional().or(z.literal('')),
    defaultLanguage: z.string().min(2, 'Language code is required'),
    defaultTimezone: z.string().min(1, 'Timezone is required'),
    defaultCountry: z.string().min(2, 'Country code is required'),
})

export type UpdateSystemSettingsInput = z.infer<typeof UpdateSystemSettingsSchema>
