'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CreateInvitationSchema } from '@/features/entities/schemas'
import { createInvitation } from '@/features/entities/actions'
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
import { UserPlus } from 'lucide-react'

type FormData = z.infer<typeof CreateInvitationSchema>

interface InviteMemberDialogProps {
    entityId: string
    triggerText?: string
}

export function InviteMemberDialog({
    entityId,
    triggerText = 'Invite Member',
}: InviteMemberDialogProps) {
    const [open, setOpen] = useState(false)
    const [isPending, setIsPending] = useState(false)

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(CreateInvitationSchema),
        defaultValues: {
            entityId,
            role: 'member',
        },
    })

    const role = watch('role')

    const onSubmit = async (data: FormData) => {
        setIsPending(true)
        try {
            const result = await createInvitation(data)
            if (result.success) {
                toast.success(result.message)
                setOpen(false)
                reset({
                    entityId,
                    role: 'member',
                    email: '',
                })
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
                    <UserPlus className="mr-2 h-4 w-4" />
                    {triggerText}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Invite Member</DialogTitle>
                    <DialogDescription>
                        Invite a new member to this entity via email.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="colleague@example.com"
                                {...register('email')}
                            />
                            {errors.email && (
                                <p className="text-sm text-red-500">{errors.email.message}</p>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="role">Role</Label>
                            <Select
                                value={role}
                                onValueChange={(value: any) => setValue('role', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="member">Member</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="owner">Owner</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.role && (
                                <p className="text-sm text-red-500">{errors.role.message}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                                {role === 'owner' && 'Full access to entity and settings.'}
                                {role === 'admin' && 'Can manage settings and members.'}
                                {role === 'member' && 'Can access apps and resources.'}
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? 'Sending Invite...' : 'Send Invitation'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

