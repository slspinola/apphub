import { auth } from '@/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { isSystemAdminRole, canManageEntity, canEditSubEntity } from '@/lib/authorization'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Building2, ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

interface EntityEditPageProps {
    params: Promise<{ slug: string }>
}

export default async function EntityEditPage({ params }: EntityEditPageProps) {
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

    // Check access - need admin/owner or system admin
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
            hasAccess = canManageEntity(session.user.role, membershipRole) || membershipRole === 'owner'
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
                        You do not have permission to edit this entity.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/entity/${slug}`}>
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div className="flex items-center gap-3">
                    <Building2 className="h-8 w-8 text-muted-foreground" />
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Edit Entity</h1>
                        <p className="text-muted-foreground">
                            {entity.parent ? `Sub-entity of ${entity.parent.name}` : 'Root entity'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Edit Form */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5" />
                            General Information
                        </CardTitle>
                        <CardDescription>
                            Edit the basic information for this entity
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                defaultValue={entity.name}
                                placeholder="Entity name"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="slug">Slug</Label>
                            <Input
                                id="slug"
                                defaultValue={entity.slug}
                                placeholder="entity-slug"
                                className="font-mono"
                            />
                            <p className="text-xs text-muted-foreground">
                                The slug is used in URLs to identify this entity
                            </p>
                        </div>
                        {entity.parent && (
                            <div className="space-y-2">
                                <Label>Parent Entity</Label>
                                <Input
                                    value={entity.parent.name}
                                    disabled
                                    className="bg-muted"
                                />
                            </div>
                        )}
                        <div className="pt-4">
                            <Button>
                                <Save className="mr-2 h-4 w-4" />
                                Save Changes
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Statistics</CardTitle>
                        <CardDescription>
                            Overview of this entity&apos;s structure
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="rounded-lg border p-4 text-center">
                                <p className="text-3xl font-bold">{entity._count.memberships}</p>
                                <p className="text-sm text-muted-foreground">Members</p>
                            </div>
                            <div className="rounded-lg border p-4 text-center">
                                <p className="text-3xl font-bold">{entity._count.children}</p>
                                <p className="text-sm text-muted-foreground">Sub-Entities</p>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t">
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Created</span>
                                    <span>{new Date(entity.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Last Updated</span>
                                    <span>{new Date(entity.updatedAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Additional Settings</CardTitle>
                    <CardDescription>
                        Configure additional entity options
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Additional configuration options will be available here. This includes
                        branding, notifications, and other entity-specific settings.
                    </p>
                </CardContent>
            </Card>

            {/* Danger Zone - only for owners */}
            {(membershipRole === 'owner' || membershipRole === 'system_admin') && (
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
                                </p>
                            </div>
                            <Button variant="destructive">
                                Delete Entity
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

