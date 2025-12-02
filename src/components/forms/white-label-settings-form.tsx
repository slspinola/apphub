'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { updateWhiteLabelSettings } from '@/features/system/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ImageUpload } from '@/components/ui/image-upload'
import { toast } from 'sonner'
import { SystemSettings } from '@prisma/client'

const WhiteLabelSettingsSchema = z.object({
    companyName: z.string().min(1, 'Company name is required'),
    productName: z.string().min(1, 'Product name is required'),
    companyLogo: z.string().url('Invalid URL').optional().or(z.literal('')),
    productLogo: z.string().url('Invalid URL').optional().or(z.literal('')),
})

type WhiteLabelSettingsInput = z.infer<typeof WhiteLabelSettingsSchema>

interface WhiteLabelSettingsFormProps {
    initialSettings: SystemSettings
}

export function WhiteLabelSettingsForm({ initialSettings }: WhiteLabelSettingsFormProps) {
    const [isPending, startTransition] = useTransition()

    const form = useForm<WhiteLabelSettingsInput>({
        resolver: zodResolver(WhiteLabelSettingsSchema),
        defaultValues: {
            companyName: initialSettings.companyName,
            productName: initialSettings.productName,
            companyLogo: initialSettings.companyLogo || '',
            productLogo: initialSettings.productLogo || '',
        },
    })

    function onSubmit(data: WhiteLabelSettingsInput) {
        startTransition(async () => {
            const result = await updateWhiteLabelSettings(data)
            if (result.success) {
                toast.success('Brand settings updated successfully')
            } else {
                toast.error(result.error || 'Failed to update settings')
            }
        })
    }

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4">
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
                    <Label>Company Logo</Label>
                    <ImageUpload
                        value={form.watch('companyLogo')}
                        onChange={(url) => form.setValue('companyLogo', url, { shouldValidate: true })}
                        disabled={isPending}
                        pathPrefix="system/company"
                    />
                    {form.formState.errors.companyLogo && (
                        <p className="text-sm text-red-500">{form.formState.errors.companyLogo.message}</p>
                    )}
                </div>
                <div className="grid gap-2">
                    <Label>Product Logo</Label>
                    <ImageUpload
                        value={form.watch('productLogo')}
                        onChange={(url) => form.setValue('productLogo', url, { shouldValidate: true })}
                        disabled={isPending}
                        pathPrefix="system/product"
                    />
                    {form.formState.errors.productLogo && (
                        <p className="text-sm text-red-500">{form.formState.errors.productLogo.message}</p>
                    )}
                </div>
            </div>
            <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving...' : 'Save Changes'}
            </Button>
        </form>
    )
}





