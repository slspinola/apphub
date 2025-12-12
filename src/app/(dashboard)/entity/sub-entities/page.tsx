import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { isSystemAdminRole, canViewSubEntities, getPermissionsForRole } from '@/lib/authorization'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { CreateEntityDialog } from '@/components/entities/create-entity-dialog'
import { FolderTree, Building2, Settings, Users, Info } from 'lucide-react'
import Link from 'next/link'

export default async function SubEntitiesPage() {
    const session = await auth()
    if (!session?.user?.id) {
        redirect('/login')
    }

    const cookieStore = await cookies()
    const currentEntityId = cookieStore.get('currentEntityId')?.value

    if (!currentEntityId) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Sub-Entities</h1>
                    <p className="text-muted-foreground mt-2">
                        No entity selected. Please select an entity from the sidebar.
                    </p>
                </div>
            </div>
        )
    }

    // Get entity and check permissions
    const entity = await prisma.entity.findUnique({
        where: { id: currentEntityId },
    })

    if (!entity) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Sub-Entities</h1>
                    <p className="text-muted-foreground mt-2">Entity not found.</p>
                </div>
            </div>
        )
    }

    // Check permission
    let membershipRole: string | null = null
    let permissions = {
        canViewSubEntities: true,
        canEditSubEntities: true,
        canCreateSubEntities: true,
        canDeleteSubEntities: true,
    }

    if (!isSystemAdminRole(session.user.role)) {
        const membership = await prisma.membership.findUnique({
            where: {
                userId_entityId: {
                    userId: session.user.id,
                    entityId: currentEntityId,
                },
            },
        })
        membershipRole = membership?.role || null

        if (!canViewSubEntities(session.user.role, membershipRole)) {
            return (
                <div className="space-y-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Sub-Entities</h1>
                        <p className="text-muted-foreground mt-2">
                            You do not have permission to view sub-entities.
                        </p>
                    </div>
                </div>
            )
        }

        const rolePerms = getPermissionsForRole(membershipRole)
        permissions = {
            canViewSubEntities: rolePerms.canViewSubEntities,
            canEditSubEntities: rolePerms.canEditSubEntities,
            canCreateSubEntities: rolePerms.canCreateSubEntities,
            canDeleteSubEntities: rolePerms.canDeleteSubEntities,
        }
    }

    // Get sub-entities
    const subEntities = await prisma.entity.findMany({
        where: { parentId: currentEntityId },
        include: {
            _count: {
                select: {
                    children: true,
                    memberships: true,
                },
            },
        },
        orderBy: { name: 'asc' },
    })

    const isManager = membershipRole === 'manager'

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Sub-Entities</h1>
                    <p className="text-muted-foreground mt-2">
                        {permissions.canCreateSubEntities
                            ? `Manage sub-entities of ${entity.name}`
                            : `View sub-entities of ${entity.name}`}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-sm">
                        <FolderTree className="mr-1 h-3 w-3" />
                        {subEntities.length} sub-entities
                    </Badge>
                    {permissions.canCreateSubEntities && (
                        <CreateEntityDialog
                            parentEntityId={currentEntityId}
                            triggerText="Create Sub-Entity"
                        />
                    )}
                </div>
            </div>

            {/* Manager info banner */}
            {isManager && (
                <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
                    <CardContent className="flex items-center gap-3 py-4">
                        <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <div>
                            <p className="font-medium text-blue-900 dark:text-blue-100">
                                Manager Access
                            </p>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                You can view and edit sub-entities. Contact an admin to create or delete sub-entities.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Sub-Entities</CardTitle>
                    <CardDescription>
                        {permissions.canCreateSubEntities
                            ? 'Organizations and divisions under this entity'
                            : 'View organizations and divisions under this entity'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {subEntities.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="rounded-full bg-muted p-3 mb-4">
                                <Building2 className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold mb-1">No sub-entities</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                {permissions.canCreateSubEntities
                                    ? 'Create your first sub-entity to organize your structure'
                                    : 'This entity has no sub-entities yet'}
                            </p>
                            {permissions.canCreateSubEntities && (
                                <CreateEntityDialog
                                    parentEntityId={currentEntityId}
                                    triggerText="Create Sub-Entity"
                                />
                            )}
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Slug</TableHead>
                                        <TableHead>Members</TableHead>
                                        <TableHead>Children</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {subEntities.map((subEntity) => (
                                        <TableRow key={subEntity.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-medium">{subEntity.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-mono text-sm text-muted-foreground">
                                                {subEntity.slug}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    <Users className="mr-1 h-3 w-3" />
                                                    {subEntity._count.memberships}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {subEntity._count.children > 0 && (
                                                    <Badge variant="secondary">
                                                        <FolderTree className="mr-1 h-3 w-3" />
                                                        {subEntity._count.children}
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {permissions.canEditSubEntities && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            asChild
                                                        >
                                                            <Link href={`/entity/${subEntity.slug}/settings`}>
                                                                <Settings className="h-4 w-4" />
                                                                <span className="sr-only">Settings</span>
                                                            </Link>
                                                        </Button>
                                                    )}
                                                </div>
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

