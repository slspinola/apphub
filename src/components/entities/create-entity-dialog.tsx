'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CreateEntitySchema } from '@/features/entities/schemas'
import { createEntity, getUserEntities } from '@/features/entities/actions'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { z } from 'zod'
import { Plus } from 'lucide-react'

type FormData = z.infer<typeof CreateEntitySchema>

interface CreateEntityDialogProps {
    /** Pre-selected parent entity ID (for creating sub-entities) */
    parentEntityId?: string
    /** Custom trigger button text */
    triggerText?: string
    /** Custom dialog title */
    dialogTitle?: string
    /** Custom dialog description */
    dialogDescription?: string
}

export function CreateEntityDialog({
    parentEntityId,
    triggerText = 'Create Entity',
    dialogTitle,
    dialogDescription,
}: CreateEntityDialogProps = {}) {
    const [open, setOpen] = useState(false)
    const [isPending, setIsPending] = useState(false)
    const [entities, setEntities] = useState<any[]>([])

    const isSubEntityMode = !!parentEntityId
    const title = dialogTitle || (isSubEntityMode ? 'Create Sub-Entity' : 'Create Entity')
    const description = dialogDescription || (isSubEntityMode
        ? 'Create a new sub-entity under the current entity.'
        : 'Create a new entity or sub-entity to manage your team and projects.')

    useEffect(() => {
        if (open) {
            getUserEntities().then((result) => {
                if (result.success) {
                    setEntities(result.data)
                }
            })
        }
    }, [open])

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(CreateEntitySchema) as any,
        defaultValues: {
            parentId: parentEntityId,
        },
    })

    // Set parent entity when dialog opens in sub-entity mode
    useEffect(() => {
        if (open && parentEntityId) {
            setValue('parentId', parentEntityId)
        }
    }, [open, parentEntityId, setValue])

    const selectedParentId = watch('parentId')

    const onSubmit = async (data: FormData) => {
        setIsPending(true)
        try {
            const result = await createEntity(data)
            if (result.success) {
                toast.success(result.message)
                setOpen(false)
                reset()
            } else {
                toast.error(result.error)
            }
        } catch (error) {
            toast.error('Something went wrong')
        } finally {
            setIsPending(false)
        }
    }

    // Find selected parent entity name for display
    const selectedParentEntity = entities.find((e) => e.id === selectedParentId)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    {triggerText}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" {...register('name')} placeholder="Acme Corp" />
                            {errors.name && (
                                <p className="text-sm text-red-500">{errors.name.message}</p>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="slug">Slug</Label>
                            <Input id="slug" {...register('slug')} placeholder="acme-corp" />
                            {errors.slug && (
                                <p className="text-sm text-red-500">{errors.slug.message}</p>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="parentId">
                                Parent Entity {isSubEntityMode ? '' : '(Optional)'}
                            </Label>
                            <Select
                                value={selectedParentId || 'none'}
                                onValueChange={(value) =>
                                    setValue('parentId', value === 'none' ? undefined : value)
                                }
                                disabled={isSubEntityMode}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select parent entity">
                                        {selectedParentEntity?.name || (selectedParentId ? 'Loading...' : 'None (Root Entity)')}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {!isSubEntityMode && (
                                        <SelectItem value="none">None (Root Entity)</SelectItem>
                                    )}
                                    {entities.map((entity) => (
                                        <SelectItem key={entity.id} value={entity.id}>
                                            {entity.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {isSubEntityMode && selectedParentEntity && (
                                <p className="text-xs text-muted-foreground">
                                    This sub-entity will be created under {selectedParentEntity.name}
                                </p>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? 'Creating...' : isSubEntityMode ? 'Create Sub-Entity' : 'Create Entity'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
