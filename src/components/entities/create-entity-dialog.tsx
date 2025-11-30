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

export function CreateEntityDialog() {
    const [open, setOpen] = useState(false)
    const [isPending, setIsPending] = useState(false)
    const [entities, setEntities] = useState<any[]>([])

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
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(CreateEntitySchema),
    })

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

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Entity
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create Entity</DialogTitle>
                    <DialogDescription>
                        Create a new entity or sub-entity to manage your team and projects.
                    </DialogDescription>
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
                            <Label htmlFor="parentId">Parent Entity (Optional)</Label>
                            <Select onValueChange={(value) => setValue('parentId', value === 'none' ? undefined : value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select parent entity" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None (Root Entity)</SelectItem>
                                    {entities.map((entity) => (
                                        <SelectItem key={entity.id} value={entity.id}>
                                            {entity.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? 'Creating...' : 'Create Entity'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
