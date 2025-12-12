'use client'

import { useState, useTransition, useEffect } from 'react'
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
import { addUserToEntity } from '@/features/users/actions'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { prisma } from '@/lib/prisma'

interface AddToEntityDialogProps {
    userId: string
    userName: string
    existingEntityIds: string[]
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function AddToEntityDialog({ 
    userId, 
    userName, 
    existingEntityIds,
    open, 
    onOpenChange 
}: AddToEntityDialogProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [entities, setEntities] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedEntityId, setSelectedEntityId] = useState('')
    const [selectedRole, setSelectedRole] = useState('member')

    useEffect(() => {
        async function loadEntities() {
            try {
                // Fetch all entities
                const response = await fetch('/api/entities')
                if (response.ok) {
                    const data = await response.json()
                    // Filter out entities user is already a member of
                    const available = data.filter((e: any) => !existingEntityIds.includes(e.id))
                    setEntities(available)
                }
            } catch (error) {
                console.error('Failed to load entities:', error)
                toast.error('Failed to load entities')
            } finally {
                setLoading(false)
            }
        }

        if (open) {
            loadEntities()
        }
    }, [open, existingEntityIds])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!selectedEntityId) {
            toast.error('Please select an entity')
            return
        }

        startTransition(async () => {
            const result = await addUserToEntity(userId, selectedEntityId, selectedRole)
            
            if (result.success) {
                toast.success('User added to entity successfully')
                onOpenChange(false)
                setSelectedEntityId('')
                setSelectedRole('member')
                router.refresh()
            } else {
                toast.error(result.error || 'Failed to add user to entity')
            }
        })
    }

    const handleOpenChange = (newOpen: boolean) => {
        if (!isPending) {
            onOpenChange(newOpen)
            if (!newOpen) {
                setSelectedEntityId('')
                setSelectedRole('member')
            }
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Add to Entity</DialogTitle>
                    <DialogDescription>
                        Add <strong>{userName}</strong> to an entity with a specific role
                    </DialogDescription>
                </DialogHeader>
                
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : entities.length === 0 ? (
                    <div className="py-8 text-center">
                        <p className="text-muted-foreground">
                            No available entities. User is already a member of all entities.
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="entity">Entity *</Label>
                            <Select 
                                value={selectedEntityId} 
                                onValueChange={setSelectedEntityId}
                                disabled={isPending}
                            >
                                <SelectTrigger id="entity">
                                    <SelectValue placeholder="Select an entity" />
                                </SelectTrigger>
                                <SelectContent>
                                    {entities.map(entity => (
                                        <SelectItem key={entity.id} value={entity.id}>
                                            {entity.name}
                                            {entity.parent && (
                                                <span className="text-xs text-muted-foreground ml-2">
                                                    (Sub-entity of {entity.parent.name})
                                                </span>
                                            )}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="role">Role *</Label>
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
                                The role determines the user's permissions within the entity
                            </p>
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
                            <Button type="submit" disabled={isPending || !selectedEntityId}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Add to Entity
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    )
}

