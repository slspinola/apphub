'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { UpdateSystemSettingsSchema, UpdateSystemSettingsInput } from '@/features/system/schemas'
import { updateSystemSettings } from '@/features/system/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { SystemSettings } from '@prisma/client'

import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface SystemSettingsFormProps {
    initialSettings: SystemSettings
}

export function SystemSettingsForm({ initialSettings }: SystemSettingsFormProps) {
    const [isPending, startTransition] = useTransition()

    const form = useForm<UpdateSystemSettingsInput>({
        resolver: zodResolver(UpdateSystemSettingsSchema),
        defaultValues: {
            companyName: initialSettings.companyName,
            productName: initialSettings.productName,
            companyLogo: initialSettings.companyLogo || '',
            productLogo: initialSettings.productLogo || '',
            defaultLanguage: initialSettings.defaultLanguage || 'en',
            defaultTimezone: initialSettings.defaultTimezone || 'UTC',
            defaultCountry: initialSettings.defaultCountry || 'US',
        },
    })

    function onSubmit(data: UpdateSystemSettingsInput) {
        startTransition(async () => {
            const result = await updateSystemSettings(data)
            if (result.success) {
                toast.success('Settings updated successfully')
            } else {
                toast.error(result.error || 'Failed to update settings')
            }
        })
    }

    return (
        <Card className="w-full max-w-2xl">
            <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>
                    Configure the white-label settings and general configuration for the application.
                </CardDescription>
            </CardHeader>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="grid gap-6">
                    <div className="grid gap-4">
                        <h3 className="text-lg font-medium">White Labeling</h3>
                        <Separator />
                        <div className="grid gap-2">
                            <Label htmlFor="companyName">Company Name</Label>
                            <Input
                                id="companyName"
                                {...form.register('companyName')}
                                placeholder="Acme Corp"
                            />
                            {form.formState.errors.companyName && (
                                <p className="text-sm text-red-500">{form.formState.errors.companyName.message}</p>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="productName">Product Name</Label>
                            <Input
                                id="productName"
                                {...form.register('productName')}
                                placeholder="AppHub"
                            />
                            {form.formState.errors.productName && (
                                <p className="text-sm text-red-500">{form.formState.errors.productName.message}</p>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="companyLogo">Company Logo URL</Label>
                            <Input
                                id="companyLogo"
                                {...form.register('companyLogo')}
                                placeholder="https://example.com/logo.png"
                            />
                            {form.formState.errors.companyLogo && (
                                <p className="text-sm text-red-500">{form.formState.errors.companyLogo.message}</p>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="productLogo">Product Logo URL</Label>
                            <Input
                                id="productLogo"
                                {...form.register('productLogo')}
                                placeholder="https://example.com/product-logo.png"
                            />
                            {form.formState.errors.productLogo && (
                                <p className="text-sm text-red-500">{form.formState.errors.productLogo.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid gap-4">
                        <h3 className="text-lg font-medium">General Configuration</h3>
                        <Separator />
                        <div className="grid gap-2">
                            <Label htmlFor="defaultCountry">Default Country</Label>
                            <Input
                                id="defaultCountry"
                                {...form.register('defaultCountry')}
                                placeholder="US"
                            />
                            {form.formState.errors.defaultCountry && (
                                <p className="text-sm text-red-500">{form.formState.errors.defaultCountry.message}</p>
                            )}
                        </div>
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
                                    <SelectItem value="en">English</SelectItem>
                                    <SelectItem value="es">Spanish</SelectItem>
                                    <SelectItem value="fr">French</SelectItem>
                                    <SelectItem value="de">German</SelectItem>
                                </SelectContent>
                            </Select>
                            {form.formState.errors.defaultLanguage && (
                                <p className="text-sm text-red-500">{form.formState.errors.defaultLanguage.message}</p>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="defaultTimezone">Default Timezone</Label>
                            <Input
                                id="defaultTimezone"
                                {...form.register('defaultTimezone')}
                                placeholder="UTC"
                            />
                            {form.formState.errors.defaultTimezone && (
                                <p className="text-sm text-red-500">{form.formState.errors.defaultTimezone.message}</p>
                            )}
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit" disabled={isPending}>
                        {isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}
