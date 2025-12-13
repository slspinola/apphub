'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { updateGeneralSettings } from '@/features/system/actions'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { SystemSettings } from '@prisma/client'
import { COUNTRIES, LANGUAGES, TIMEZONES } from '@/lib/constants'

const GeneralSettingsSchema = z.object({
    defaultLanguage: z.string().min(2, 'Language is required'),
    defaultTimezone: z.string().min(1, 'Timezone is required'),
    defaultCountry: z.string().min(2, 'Country is required'),
})

type GeneralSettingsInput = z.infer<typeof GeneralSettingsSchema>

interface GeneralSettingsFormProps {
    initialSettings: SystemSettings
}

export function GeneralSettingsForm({ initialSettings }: GeneralSettingsFormProps) {
    const [isPending, startTransition] = useTransition()

    const form = useForm<GeneralSettingsInput>({
        resolver: zodResolver(GeneralSettingsSchema) as any,
        defaultValues: {
            defaultLanguage: initialSettings.defaultLanguage || 'en',
            defaultTimezone: initialSettings.defaultTimezone || 'UTC',
            defaultCountry: initialSettings.defaultCountry || 'US',
        },
    })

    function onSubmit(data: GeneralSettingsInput) {
        startTransition(async () => {
            const result = await updateGeneralSettings(data)
            if (result.success) {
                toast.success('General settings updated successfully')
            } else {
                toast.error(result.error || 'Failed to update settings')
            }
        })
    }

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="defaultLanguage">Default Language</Label>
                    <Select
                        onValueChange={(value) => form.setValue('defaultLanguage', value)}
                        defaultValue={form.getValues('defaultLanguage')}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select a language" />
                        </SelectTrigger>
                        <SelectContent>
                            {LANGUAGES.map((language) => (
                                <SelectItem key={language.code} value={language.code}>
                                    {language.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {form.formState.errors.defaultLanguage && (
                        <p className="text-sm text-red-500">{form.formState.errors.defaultLanguage.message}</p>
                    )}
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="defaultCountry">Default Country</Label>
                    <Select
                        onValueChange={(value) => form.setValue('defaultCountry', value)}
                        defaultValue={form.getValues('defaultCountry')}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select a country" />
                        </SelectTrigger>
                        <SelectContent>
                            {COUNTRIES.map((country) => (
                                <SelectItem key={country.code} value={country.code}>
                                    {country.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {form.formState.errors.defaultCountry && (
                        <p className="text-sm text-red-500">{form.formState.errors.defaultCountry.message}</p>
                    )}
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="defaultTimezone">Default Timezone</Label>
                    <Select
                        onValueChange={(value) => form.setValue('defaultTimezone', value)}
                        defaultValue={form.getValues('defaultTimezone')}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select a timezone" />
                        </SelectTrigger>
                        <SelectContent>
                            {TIMEZONES.map((timezone) => (
                                <SelectItem key={timezone.value} value={timezone.value}>
                                    {timezone.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {form.formState.errors.defaultTimezone && (
                        <p className="text-sm text-red-500">{form.formState.errors.defaultTimezone.message}</p>
                    )}
                </div>
            </div>
            <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving...' : 'Save Changes'}
            </Button>
        </form>
    )
}




































