'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ArrowLeft, Shield, Key, UserCog } from 'lucide-react'
import Link from 'next/link'
import { PasswordResetDialog } from '../password-reset-dialog'
import { EditProfileDialog } from '../edit-profile-dialog'
import { ImpersonationDialog } from '../impersonation-dialog'
import { isSystemAdminRole } from '@/lib/authorization'
import { useState } from 'react'

interface UserDetailHeaderProps {
    user: any
    sessionUser: any
}

export function UserDetailHeader({ user, sessionUser }: UserDetailHeaderProps) {
    const [showPasswordReset, setShowPasswordReset] = useState(false)
    const [showEditProfile, setShowEditProfile] = useState(false)
    const [showImpersonation, setShowImpersonation] = useState(false)
    const isSystemAdmin = isSystemAdminRole(sessionUser.role)
    const canResetPassword = isSystemAdmin && !isSystemAdminRole(user.role)
    const canImpersonate = isSystemAdmin && !isSystemAdminRole(user.role) && sessionUser.id !== user.id

    const getInitials = (name: string | null) => {
        if (!name) return '?'
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }

    const getRoleBadgeVariant = (role: string) => {
        if (role === 'system_admin') return 'destructive'
        if (role === 'admin') return 'default'
        return 'secondary'
    }

    const getStatusBadgeVariant = (status: string) => {
        if (status === 'active') return 'outline'
        if (status === 'inactive') return 'secondary'
        return 'destructive'
    }

    return (
        <>
            <div className="flex items-center justify-between">
                <Link href="/users">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Users
                    </Button>
                </Link>
            </div>

            <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                    <Avatar className="h-20 w-20">
                        <AvatarImage src={user.image || undefined} alt={user.name || user.email} />
                        <AvatarFallback className="text-2xl">
                            {getInitials(user.name)}
                        </AvatarFallback>
                    </Avatar>
                    
                    <div className="space-y-2">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">
                                {user.name || 'Unnamed User'}
                            </h1>
                            <p className="text-muted-foreground">{user.email}</p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <Badge variant={getRoleBadgeVariant(user.role)}>
                                {user.role.replace('_', ' ')}
                            </Badge>
                            <span className="text-muted-foreground">•</span>
                            <Badge variant={getStatusBadgeVariant(user.status)}>
                                {user.status}
                            </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground">
                            Member since {new Date(user.createdAt).toLocaleDateString('en-US', { 
                                month: 'long', 
                                year: 'numeric' 
                            })}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {canImpersonate && (
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setShowImpersonation(true)}
                        >
                            <Shield className="mr-2 h-4 w-4" />
                            Impersonate
                        </Button>
                    )}
                    
                    {canResetPassword && (
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setShowPasswordReset(true)}
                        >
                            <Key className="mr-2 h-4 w-4" />
                            Reset Password
                        </Button>
                    )}
                    
                    <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowEditProfile(true)}
                    >
                        <UserCog className="mr-2 h-4 w-4" />
                        Edit Profile
                    </Button>
                </div>
            </div>

            <PasswordResetDialog
                userId={user.id}
                userName={user.name || user.email}
                open={showPasswordReset}
                onOpenChange={setShowPasswordReset}
            />

            <EditProfileDialog
                user={user}
                open={showEditProfile}
                onOpenChange={setShowEditProfile}
            />

            <ImpersonationDialog
                userId={user.id}
                userName={user.name || user.email}
                open={showImpersonation}
                onOpenChange={setShowImpersonation}
            />
        </>
    )
}

