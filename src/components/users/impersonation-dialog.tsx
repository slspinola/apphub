'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, AlertTriangle } from 'lucide-react'
import { startImpersonation } from '@/features/users/actions'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface ImpersonationDialogProps {
    userId: string
    userName: string
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ImpersonationDialog({ userId, userName, open, onOpenChange }: ImpersonationDialogProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [reason, setReason] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!reason.trim()) {
            toast.error('Please provide a reason for impersonation')
            return
        }

        startTransition(async () => {
            const result = await startImpersonation(userId, reason)
            
            if (result.success) {
                toast.success('Impersonation started')
                onOpenChange(false)
                setReason('')
                // Refresh to load impersonated session
                router.refresh()
                router.push('/')
            } else {
                toast.error(result.error || 'Failed to start impersonation')
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Impersonate User</DialogTitle>
                    <DialogDescription>
                        You are about to impersonate <strong>{userName}</strong>. This action is logged for security and audit purposes.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-950 dark:border-amber-800">
                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <div className="flex-1 text-sm">
                        <p className="font-medium text-amber-900 dark:text-amber-100 mb-1">
                            Important Security Notice
                        </p>
                        <ul className="text-amber-800 dark:text-amber-200 space-y-1 text-xs list-disc list-inside">
                            <li>You will be logged in as this user for up to 1 hour</li>
                            <li>All actions you take will be logged with your admin ID</li>
                            <li>You can end impersonation at any time using the banner</li>
                            <li>This session will automatically expire after 1 hour</li>
                        </ul>
                    </div>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="reason">Reason for Impersonation *</Label>
                        <Textarea
                            id="reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Provide a reason for impersonating this user (e.g., troubleshooting, support request, etc.)"
                            rows={4}
                            disabled={isPending}
                            required
                        />
                        <p className="text-xs text-muted-foreground">
                            This reason will be logged for audit purposes
                        </p>
                    </div>
                    
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isPending}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isPending || !reason.trim()}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Start Impersonation
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

