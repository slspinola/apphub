'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Loader2, AlertTriangle } from 'lucide-react'
import { removeUserFromEntity } from '@/features/users/actions'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface RemoveFromEntityDialogProps {
    membership: any
    userName: string
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function RemoveFromEntityDialog({ 
    membership,
    userName, 
    open, 
    onOpenChange 
}: RemoveFromEntityDialogProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    const handleConfirm = async () => {
        if (!membership?.id) {
            toast.error('Invalid membership')
            return
        }

        startTransition(async () => {
            const result = await removeUserFromEntity(membership.id)
            
            if (result.success) {
                toast.success('User removed from entity successfully')
                onOpenChange(false)
                router.refresh()
            } else {
                toast.error(result.error || 'Failed to remove user from entity')
            }
        })
    }

    const handleOpenChange = (newOpen: boolean) => {
        if (!isPending) {
            onOpenChange(newOpen)
        }
    }

    if (!membership) return null

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Remove from Entity</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to remove <strong>{userName}</strong> from <strong>{membership.entity.name}</strong>?
                    </DialogDescription>
                </DialogHeader>
                
                <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                    <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                    <div className="flex-1 text-sm">
                        <p className="font-medium text-destructive mb-1">
                            This action cannot be undone
                        </p>
                        <ul className="text-destructive/90 space-y-1 text-xs list-disc list-inside">
                            <li>User will lose access to this entity</li>
                            <li>All app scopes for this entity will be removed</li>
                            <li>User data and activity logs will be preserved</li>
                            <li>User can be re-added later if needed</li>
                        </ul>
                    </div>
                </div>

                <div className="space-y-2 text-sm bg-muted p-3 rounded-lg">
                    <p><strong>Entity:</strong> {membership.entity.name}</p>
                    <p><strong>Current Role:</strong> {membership.role}</p>
                    {membership.scopes && membership.scopes.length > 0 && (
                        <p><strong>App Scopes:</strong> {membership.scopes.length} scope(s) will be removed</p>
                    )}
                </div>
                
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleOpenChange(false)}
                        disabled={isPending}
                    >
                        Cancel
                    </Button>
                    <Button 
                        variant="destructive" 
                        onClick={handleConfirm}
                        disabled={isPending}
                    >
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Remove from Entity
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

