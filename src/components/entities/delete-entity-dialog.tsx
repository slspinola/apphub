'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteEntity } from '@/features/entities/actions'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'

interface DeleteEntityDialogProps {
    entityId: string
    entityName: string
    childrenCount?: number
    /** URL to redirect to after successful deletion */
    redirectTo?: string
}

export function DeleteEntityDialog({
    entityId,
    entityName,
    childrenCount = 0,
    redirectTo = '/entities',
}: DeleteEntityDialogProps) {
    const router = useRouter()
    const [isPending, setIsPending] = useState(false)
    const [open, setOpen] = useState(false)

    const handleDelete = async () => {
        setIsPending(true)
        try {
            const result = await deleteEntity(entityId)
            if (result.success) {
                toast.success(result.message)
                setOpen(false)
                router.push(redirectTo)
                router.refresh()
            } else {
                toast.error(result.error)
            }
        } catch (error) {
            toast.error('Something went wrong')
        } finally {
            setIsPending(false)
        }
    }

    const canDelete = childrenCount === 0

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={!canDelete}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Entity
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription className="space-y-2">
                        <p>
                            This action cannot be undone. This will permanently delete the entity{' '}
                            <span className="font-semibold text-foreground">{entityName}</span> and
                            remove all associated data including:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                            <li>All memberships and user associations</li>
                            <li>All pending invitations</li>
                            <li>All licenses and app configurations</li>
                        </ul>
                        {childrenCount > 0 && (
                            <p className="text-destructive font-medium mt-4">
                                ⚠️ This entity has {childrenCount} sub-entities. You must delete all
                                sub-entities before deleting this entity.
                            </p>
                        )}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault()
                            handleDelete()
                        }}
                        disabled={isPending || !canDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isPending ? 'Deleting...' : 'Delete Entity'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

