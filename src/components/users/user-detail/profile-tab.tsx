'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Copy, Check, Mail, Calendar, Shield, Key } from 'lucide-react'
import { useState, useTransition } from 'react'
import { verifyUserEmail } from '@/features/users/actions'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { isSystemAdminRole } from '@/lib/authorization'

interface ProfileTabProps {
    user: any
    sessionUser: any
}

export function ProfileTab({ user, sessionUser }: ProfileTabProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [copiedId, setCopiedId] = useState(false)
    const isSystemAdmin = isSystemAdminRole(sessionUser.role)

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        setCopiedId(true)
        setTimeout(() => setCopiedId(false), 2000)
    }

    const handleVerifyEmail = () => {
        startTransition(async () => {
            const result = await verifyUserEmail(user.id)
            if (result.success) {
                toast.success('Email verified successfully')
                router.refresh()
            } else {
                toast.error(result.error || 'Failed to verify email')
            }
        })
    }

    const formatDate = (date: Date | string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <div className="grid gap-4 md:grid-cols-2">
            {/* Basic Information */}
            <Card>
                <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                    <CardDescription>User profile and contact details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                        <p className="text-base">{user.name || 'Not set'}</p>
                    </div>
                    
                    <div>
                        <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                        <div className="flex items-center gap-2">
                            <p className="text-base">{user.email}</p>
                            {user.emailVerified ? (
                                <Badge variant="outline" className="text-xs">
                                    <Check className="mr-1 h-3 w-3" />
                                    Verified
                                </Badge>
                            ) : (
                                <>
                                    <Badge variant="secondary" className="text-xs">
                                        Not Verified
                                    </Badge>
                                    {isSystemAdmin && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleVerifyEmail}
                                            disabled={isPending}
                                        >
                                            Verify Email
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                    
                    <div>
                        <label className="text-sm font-medium text-muted-foreground">System Role</label>
                        <div className="mt-1">
                            <Badge variant={user.role === 'system_admin' ? 'destructive' : 'default'}>
                                <Shield className="mr-1 h-3 w-3" />
                                {user.role.replace('_', ' ')}
                            </Badge>
                        </div>
                    </div>
                    
                    <div>
                        <label className="text-sm font-medium text-muted-foreground">Account Status</label>
                        <div className="mt-1">
                            <Badge variant={user.status === 'active' ? 'outline' : 'destructive'}>
                                {user.status}
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Account Details */}
            <Card>
                <CardHeader>
                    <CardTitle>Account Details</CardTitle>
                    <CardDescription>System information and metadata</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-muted-foreground">User ID</label>
                        <div className="flex items-center gap-2 mt-1">
                            <code className="text-sm bg-muted px-2 py-1 rounded">{user.id}</code>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(user.id)}
                            >
                                {copiedId ? (
                                    <Check className="h-4 w-4 text-green-500" />
                                ) : (
                                    <Copy className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>
                    
                    <div>
                        <label className="text-sm font-medium text-muted-foreground">Created Date</label>
                        <div className="flex items-center gap-2 mt-1">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm">{formatDate(user.createdAt)}</p>
                        </div>
                    </div>
                    
                    <div>
                        <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                        <div className="flex items-center gap-2 mt-1">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm">{formatDate(user.updatedAt)}</p>
                        </div>
                    </div>
                    
                    <div>
                        <label className="text-sm font-medium text-muted-foreground">Email Verified</label>
                        <div className="flex items-center gap-2 mt-1">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm">
                                {user.emailVerified ? formatDate(user.emailVerified) : 'Not verified'}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Authentication */}
            <Card>
                <CardHeader>
                    <CardTitle>Authentication</CardTitle>
                    <CardDescription>Login methods and security</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-muted-foreground">Password</label>
                        <div className="flex items-center gap-2 mt-1">
                            <Key className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm">
                                {user.passwordHash ? 'Password set' : 'No password set'}
                            </p>
                        </div>
                    </div>
                    
                    <div>
                        <label className="text-sm font-medium text-muted-foreground">OAuth Accounts</label>
                        <div className="mt-2 space-y-2">
                            {user.accounts && user.accounts.length > 0 ? (
                                user.accounts.map((account: any, idx: number) => (
                                    <Badge key={idx} variant="outline">
                                        {account.provider}
                                    </Badge>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground">No OAuth accounts linked</p>
                            )}
                        </div>
                    </div>
                    
                    <div>
                        <label className="text-sm font-medium text-muted-foreground">Two-Factor Auth</label>
                        <div className="mt-1">
                            <Badge variant="secondary">Disabled</Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Entity Memberships Summary */}
            <Card>
                <CardHeader>
                    <CardTitle>Entity Memberships</CardTitle>
                    <CardDescription>Quick overview of entity access</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {user.memberships && user.memberships.length > 0 ? (
                            <>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Member of {user.memberships.length} {user.memberships.length === 1 ? 'entity' : 'entities'}
                                </p>
                                {user.memberships.slice(0, 3).map((membership: any) => (
                                    <div key={membership.id} className="flex items-center justify-between p-2 border rounded">
                                        <span className="text-sm">{membership.entity.name}</span>
                                        <Badge variant="outline" className="text-xs">
                                            {membership.role}
                                        </Badge>
                                    </div>
                                ))}
                                {user.memberships.length > 3 && (
                                    <p className="text-xs text-muted-foreground text-center pt-2">
                                        And {user.memberships.length - 3} more...
                                    </p>
                                )}
                            </>
                        ) : (
                            <p className="text-sm text-muted-foreground">No entity memberships</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

