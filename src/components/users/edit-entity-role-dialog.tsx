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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { updateUserEntityRole } from '@/features/users/actions'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface EditEntityRoleDialogProps {
    membership: any
    userName: string
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function EditEntityRoleDialog({ 
    membership,
    userName, 
    open, 
    onOpenChange 
}: EditEntityRoleDialogProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [selectedRole, setSelectedRole] = useState(membership?.role || 'member')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!membership?.id) {
            toast.error('Invalid membership')
            return
        }

        if (selectedRole === membership.role) {
            toast.info('No changes to save')
            onOpenChange(false)
            return
        }

        startTransition(async () => {
            const result = await updateUserEntityRole(membership.id, selectedRole)
            
            if (result.success) {
                toast.success('Role updated successfully')
                onOpenChange(false)
                router.refresh()
            } else {
                toast.error(result.error || 'Failed to update role')
            }
        })
    }

    const handleOpenChange = (newOpen: boolean) => {
        if (!isPending) {
            onOpenChange(newOpen)
            if (!newOpen) {
                setSelectedRole(membership?.role || 'member')
            }
        }
    }

    if (!membership) return null

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle>Edit Entity Role</DialogTitle>
                    <DialogDescription>
                        Change <strong>{userName}</strong>'s role in <strong>{membership.entity.name}</strong>
                    </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="role">New Role *</Label>
                        <Select 
                            value={selectedRole} 
                            onValueChange={setSelectedRole}
                            disabled={isPending}
                        >
                            <SelectTrigger id="role">
                                <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="owner">Owner</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="manager">Manager</SelectItem>
                                <SelectItem value="member">Member</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            Current role: <strong>{membership.role}</strong>
                        </p>
                    </div>
                    
                    <div className="rounded-lg bg-muted p-3 text-sm">
                        <p className="font-medium mb-1">Role Permissions:</p>
                        <ul className="text-xs text-muted-foreground space-y-1">
                            <li><strong>Owner:</strong> Full control including entity deletion</li>
                            <li><strong>Admin:</strong> Manage members and settings</li>
                            <li><strong>Manager:</strong> Limited administrative access</li>
                            <li><strong>Member:</strong> Basic access to entity resources</li>
                        </ul>
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
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Update Role
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

