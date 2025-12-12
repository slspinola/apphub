'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Mail, Clock, CheckCircle, UserPlus, XCircle, Trash2 } from 'lucide-react'
import type { Entity, EntityInvite } from '@prisma/client'
import { Button } from '@/components/ui/button'
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
import { revokeInvitation } from '@/features/entities/actions'
import { toast } from 'sonner'
import { useState } from 'react'

interface EntityInvitationsTabProps {
    entity: Entity
    invitations: EntityInvite[]
}

export function EntityInvitationsTab({ entity, invitations }: EntityInvitationsTabProps) {
    const pendingInvitations = invitations.filter(
        (inv) => !inv.acceptedAt && new Date(inv.expiresAt) > new Date()
    )
    const acceptedInvitations = invitations.filter((inv) => inv.acceptedAt)
    const expiredInvitations = invitations.filter(
        (inv) => !inv.acceptedAt && new Date(inv.expiresAt) <= new Date()
    )

    const getStatusBadge = (invitation: EntityInvite) => {
        if (invitation.acceptedAt) {
            return (
                <Badge variant="default" className="bg-green-600">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Accepted
                </Badge>
            )
        }
        if (new Date(invitation.expiresAt) <= new Date()) {
            return (
                <Badge variant="destructive">
                    <Clock className="mr-1 h-3 w-3" />
                    Expired
                </Badge>
            )
        }
        return (
            <Badge variant="secondary">
                <Mail className="mr-1 h-3 w-3" />
                Pending
            </Badge>
        )
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Pending
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{pendingInvitations.length}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Accepted
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-green-600">{acceptedInvitations.length}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Expired
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-muted-foreground">{expiredInvitations.length}</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Invitations</CardTitle>
                    <CardDescription>
                        History of all invitations sent for {entity.name}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {invitations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="rounded-full bg-muted p-3 mb-4">
                                <UserPlus className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold mb-1">No invitations</h3>
                            <p className="text-sm text-muted-foreground">
                                No invitations have been sent for this entity yet.
                            </p>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Sent</TableHead>
                                        <TableHead>Expires</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {invitations.map((invitation) => (
                                        <TableRow key={invitation.id}>
                                            <TableCell className="font-medium">
                                                {invitation.email}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{invitation.role}</Badge>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(invitation)}</TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {new Date(invitation.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {new Date(invitation.expiresAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {!invitation.acceptedAt && (
                                                    <RevokeButton invitationId={invitation.id} />
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

function RevokeButton({ invitationId }: { invitationId: string }) {
    const [isPending, setIsPending] = useState(false)

    const handleRevoke = async () => {
        setIsPending(true)
        try {
            const result = await revokeInvitation(invitationId)
            if (result.success) {
                toast.success(result.message)
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
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Revoke
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Revoke Invitation?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete the invitation. The user will no longer be able to join using this link.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleRevoke}
                        className="bg-red-600 hover:bg-red-700"
                        disabled={isPending}
                    >
                        {isPending ? 'Revoking...' : 'Revoke Invitation'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
