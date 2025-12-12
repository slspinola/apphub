'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Building2, Plus, Trash2, Edit } from 'lucide-react'
import { isSystemAdminRole } from '@/lib/authorization'
import { useState } from 'react'
import { AddToEntityDialog } from '../add-to-entity-dialog'
import { EditEntityRoleDialog } from '../edit-entity-role-dialog'
import { RemoveFromEntityDialog } from '../remove-from-entity-dialog'

interface EntitiesTabProps {
    user: any
    sessionUser: any
}

export function EntitiesTab({ user, sessionUser }: EntitiesTabProps) {
    const isSystemAdmin = isSystemAdminRole(sessionUser.role)
    const memberships = user.memberships || []
    
    const [showAddDialog, setShowAddDialog] = useState(false)
    const [showEditDialog, setShowEditDialog] = useState(false)
    const [showRemoveDialog, setShowRemoveDialog] = useState(false)
    const [selectedMembership, setSelectedMembership] = useState<any>(null)

    const getRoleBadgeVariant = (role: string) => {
        if (role === 'owner') return 'default'
        if (role === 'admin') return 'secondary'
        return 'outline'
    }

    const handleEditRole = (membership: any) => {
        setSelectedMembership(membership)
        setShowEditDialog(true)
    }

    const handleRemove = (membership: any) => {
        setSelectedMembership(membership)
        setShowRemoveDialog(true)
    }

    const existingEntityIds = memberships.map((m: any) => m.entityId)

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Entity Memberships</CardTitle>
                            <CardDescription>
                                Entities and sub-entities this user has access to
                            </CardDescription>
                        </div>
                        {isSystemAdmin && (
                            <Button size="sm" onClick={() => setShowAddDialog(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add to Entity
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {memberships.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="rounded-full bg-muted p-3 mb-4">
                                <Building2 className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold mb-1">No entity memberships</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                This user is not a member of any entities yet
                            </p>
                            {isSystemAdmin && (
                                <Button size="sm" onClick={() => setShowAddDialog(true)}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add to Entity
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {memberships.map((membership: any) => (
                                <Card key={membership.id} className="border-2">
                                    <CardContent className="pt-6">
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-3 flex-1">
                                                <div className="flex items-center gap-3">
                                                    <div className="rounded-lg bg-primary/10 p-2">
                                                        <Building2 className="h-5 w-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-lg">
                                                            {membership.entity.name}
                                                        </h3>
                                                        <p className="text-sm text-muted-foreground">
                                                            {membership.entity.slug}
                                                        </p>
                                                    </div>
                                                    <Badge variant={getRoleBadgeVariant(membership.role)}>
                                                        {membership.role}
                                                    </Badge>
                                                </div>

                                                {/* Parent Entity */}
                                                {membership.entity.parent && (
                                                    <div className="ml-12 text-sm text-muted-foreground">
                                                        <span className="font-medium">Parent:</span>{' '}
                                                        {membership.entity.parent.name}
                                                    </div>
                                                )}

                                                {/* Sub-Entities */}
                                                {membership.entity.children && membership.entity.children.length > 0 && (
                                                    <div className="ml-12 space-y-2">
                                                        <p className="text-sm font-medium">Sub-Entities:</p>
                                                        <div className="space-y-1">
                                                            {membership.entity.children.map((child: any) => (
                                                                <div 
                                                                    key={child.id}
                                                                    className="flex items-center gap-2 text-sm text-muted-foreground"
                                                                >
                                                                    <div className="h-1 w-1 rounded-full bg-muted-foreground" />
                                                                    {child.name}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* App Scopes */}
                                                {membership.scopes && membership.scopes.length > 0 && (
                                                    <div className="ml-12 space-y-2">
                                                        <p className="text-sm font-medium">App Scopes:</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {membership.scopes.map((scope: any) => (
                                                                <Badge key={scope.id} variant="outline" className="text-xs">
                                                                    {scope.scopeType}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {isSystemAdmin && (
                                                <div className="flex gap-2">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm"
                                                        onClick={() => handleEditRole(membership)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm"
                                                        onClick={() => handleRemove(membership)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <AddToEntityDialog
                userId={user.id}
                userName={user.name || user.email}
                existingEntityIds={existingEntityIds}
                open={showAddDialog}
                onOpenChange={setShowAddDialog}
            />

            <EditEntityRoleDialog
                membership={selectedMembership}
                userName={user.name || user.email}
                open={showEditDialog}
                onOpenChange={setShowEditDialog}
            />

            <RemoveFromEntityDialog
                membership={selectedMembership}
                userName={user.name || user.email}
                open={showRemoveDialog}
                onOpenChange={setShowRemoveDialog}
            />
        </div>
    )
}

