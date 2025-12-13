'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { UpdateEntitySchema } from '@/features/entities/schemas'
import { updateEntity } from '@/features/entities/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Save, Building2 } from 'lucide-react'
import type { Entity } from '@prisma/client'

type FormData = z.infer<typeof UpdateEntitySchema>

interface EntitySettingsFormProps {
    entity: Entity & {
        parent?: { name: string } | null
        _count?: {
            memberships: number
            children: number
        }
    }
    /** Whether user is accessing as manager of parent entity */
    isManagerAccess?: boolean
}

export function EntitySettingsForm({ entity, isManagerAccess = false }: EntitySettingsFormProps) {
    const router = useRouter()
    const [isPending, setIsPending] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors, isDirty },
    } = useForm<FormData>({
        resolver: zodResolver(UpdateEntitySchema) as any,
        defaultValues: {
            id: entity.id,
            name: entity.name,
            slug: entity.slug,
        },
    })

    const onSubmit = async (data: FormData) => {
        setIsPending(true)
        try {
            const result = await updateEntity(data)
            if (result.success) {
                toast.success(result.message)
                
                // If slug changed, redirect to new URL
                if (data.slug && data.slug !== entity.slug) {
                    router.push(`/entity/${data.slug}/settings`)
                } else {
                    router.refresh()
                }
            } else {
                toast.error(result.error)
            }
        } catch (error) {
            toast.error('Something went wrong')
        } finally {
            setIsPending(false)
        }
    }

    return (
        <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        General Information
                    </CardTitle>
                    <CardDescription>
                        {isManagerAccess
                            ? 'Edit basic information for this sub-entity'
                            : 'Edit the basic information for this entity'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                {...register('name')}
                                placeholder="Entity name"
                            />
                            {errors.name && (
                                <p className="text-sm text-red-500">{errors.name.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="slug">Slug</Label>
                            <Input
                                id="slug"
                                {...register('slug')}
                                placeholder="entity-slug"
                                className="font-mono"
                            />
                            <p className="text-xs text-muted-foreground">
                                The slug is used in URLs to identify this entity
                            </p>
                            {errors.slug && (
                                <p className="text-sm text-red-500">{errors.slug.message}</p>
                            )}
                        </div>
                        {entity.parent && (
                            <div className="space-y-2">
                                <Label>Parent Entity</Label>
                                <Input
                                    value={entity.parent.name}
                                    disabled
                                    className="bg-muted"
                                />
                            </div>
                        )}
                        <div className="pt-4">
                            <Button type="submit" disabled={isPending || !isDirty}>
                                <Save className="mr-2 h-4 w-4" />
                                {isPending ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {entity._count && (
                <Card>
                    <CardHeader>
                        <CardTitle>Statistics</CardTitle>
                        <CardDescription>
                            Overview of this entity&apos;s structure
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="rounded-lg border p-4 text-center">
                                <p className="text-3xl font-bold">{entity._count.memberships}</p>
                                <p className="text-sm text-muted-foreground">Members</p>
                            </div>
                            <div className="rounded-lg border p-4 text-center">
                                <p className="text-3xl font-bold">{entity._count.children}</p>
                                <p className="text-sm text-muted-foreground">Sub-Entities</p>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t">
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Created</span>
                                    <span>{new Date(entity.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Last Updated</span>
                                    <span>{new Date(entity.updatedAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

