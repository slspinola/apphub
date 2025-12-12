import { auth } from '@/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { isSystemAdminRole, canManageEntity, canEditSubEntity } from '@/lib/authorization'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building2, ArrowLeft, Info } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { EntitySettingsForm } from '@/components/entities/entity-settings-form'
import { DeleteEntityDialog } from '@/components/entities/delete-entity-dialog'

interface EntitySettingsPageProps {
    params: Promise<{ slug: string }>
}

export default async function EntitySettingsPage({ params }: EntitySettingsPageProps) {
    const { slug } = await params
    const session = await auth()
    
    if (!session?.user?.id) {
        redirect('/login')
    }

    // Get entity by slug
    const entity = await prisma.entity.findUnique({
        where: { slug },
        include: {
            parent: true,
            _count: {
                select: {
                    children: true,
                    memberships: true,
                },
            },
        },
    })

    if (!entity) {
        notFound()
    }

    // Check access - for sub-entity settings, manager can also edit
    let membershipRole: string | null = null
    let hasAccess = false

    if (isSystemAdminRole(session.user.role)) {
        hasAccess = true
        membershipRole = 'system_admin'
    } else {
        // Check direct membership on this entity
        const directMembership = await prisma.membership.findUnique({
            where: {
                userId_entityId: {
                    userId: session.user.id,
                    entityId: entity.id,
                },
            },
        })
        
        if (directMembership) {
            membershipRole = directMembership.role
            hasAccess = canManageEntity(session.user.role, membershipRole)
        }
        
        // If this is a sub-entity, check parent membership for manager access
        if (!hasAccess && entity.parentId) {
            const parentMembership = await prisma.membership.findUnique({
                where: {
                    userId_entityId: {
                        userId: session.user.id,
                        entityId: entity.parentId,
                    },
                },
            })
            
            if (parentMembership && canEditSubEntity(session.user.role, parentMembership.role)) {
                hasAccess = true
                membershipRole = parentMembership.role
            }
        }
    }

    if (!hasAccess) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Access Denied</h1>
                    <p className="text-muted-foreground mt-2">
                            You do not have permission to manage this entity&apos;s settings.
                    </p>
                </div>
            </div>
        )
    }

    const isManager = membershipRole === 'manager'
    const canDelete = membershipRole === 'owner' || membershipRole === 'system_admin'

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/entity/${slug}`}>
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div className="flex-1">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Entity Settings</h1>
                            <p className="text-muted-foreground mt-1">
                                Manage settings for {entity.name}
                            </p>
                        </div>
                        <Badge variant="outline" className="text-sm">
                            {entity.parent ? 'Sub-Entity' : 'Root Entity'}
                        </Badge>
                    </div>
                </div>
            </div>

            {/* Manager notice */}
            {isManager && (
                <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
                    <CardContent className="flex items-center gap-3 py-4">
                        <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <div>
                            <p className="font-medium text-blue-900 dark:text-blue-100">
                                Manager Access
                            </p>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                You can edit this sub-entity&apos;s settings as a manager of the parent entity.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            <EntitySettingsForm entity={entity} isManagerAccess={isManager} />

            <Card>
                <CardHeader>
                    <CardTitle>Entity Configuration</CardTitle>
                    <CardDescription>
                        Configure entity-specific settings and preferences
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Entity configuration options will be available here. This includes
                        branding, notifications, and other entity-specific settings.
                    </p>
                </CardContent>
            </Card>

            {/* Danger Zone - only for owners */}
            {canDelete && (
                <Card className="border-destructive">
                    <CardHeader>
                        <CardTitle className="text-destructive">Danger Zone</CardTitle>
                        <CardDescription>
                            Irreversible and destructive actions
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Delete this entity</p>
                                <p className="text-sm text-muted-foreground">
                                    Once deleted, this entity and all its data will be permanently removed.
                                    {entity._count.children > 0 && (
                                        <span className="text-destructive font-medium">
                                            {' '}This entity has {entity._count.children} sub-entities that must be deleted first.
                                        </span>
                                    )}
                                </p>
                            </div>
                            <DeleteEntityDialog
                                entityId={entity.id}
                                entityName={entity.name}
                                childrenCount={entity._count.children}
                                redirectTo={entity.parent ? `/entity/${entity.parent.slug}` : '/entities'}
                            />
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

