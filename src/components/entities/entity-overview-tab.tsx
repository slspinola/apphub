import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Building2, Users, FolderTree, Settings, Calendar, Info, Pencil } from 'lucide-react'
import Link from 'next/link'
import type { Entity } from '@prisma/client'

interface EntityOverviewTabProps {
    entity: Entity & {
        parent?: Entity | null
        _count: {
            memberships: number
            children: number
        }
    }
    membershipRole: string
    isSystemAdmin: boolean
}

export function EntityOverviewTab({
    entity,
    membershipRole,
    isSystemAdmin,
}: EntityOverviewTabProps) {
    const canManage = isSystemAdmin || ['owner', 'admin'].includes(membershipRole)
    const isManager = membershipRole === 'manager'

    return (
        <div className="space-y-6">
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
                                You have manager access to this entity&apos;s sub-entities.
                                Contact an admin for additional permissions.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Entity Info Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Entity Information
                    </CardTitle>
                    <CardDescription>
                        Basic information about this entity
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                    <div>
                        <label className="text-sm font-medium text-muted-foreground">Name</label>
                        <p className="text-lg font-medium">{entity.name}</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-muted-foreground">Slug</label>
                        <p className="font-mono text-sm">{entity.slug}</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-muted-foreground">Type</label>
                        <p className="flex items-center gap-2">
                            <Badge variant={entity.parent ? 'secondary' : 'default'}>
                                {entity.parent ? 'Sub-Entity' : 'Root Entity'}
                            </Badge>
                        </p>
                    </div>
                    {entity.parent && (
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Parent Entity</label>
                            <p>{entity.parent.name}</p>
                        </div>
                    )}
                    <div>
                        <label className="text-sm font-medium text-muted-foreground">Created</label>
                        <p className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {new Date(entity.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Members</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{entity._count.memberships}</div>
                        {canManage && (
                            <Button variant="link" className="p-0 h-auto text-xs" asChild>
                                <Link href="/entity?tab=members">Manage members →</Link>
                            </Button>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Sub-Entities</CardTitle>
                        <FolderTree className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{entity._count.children}</div>
                        <Button variant="link" className="p-0 h-auto text-xs" asChild>
                            <Link href="/entity/sub-entities">View sub-entities →</Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Settings</CardTitle>
                        <Settings className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-muted-foreground">—</div>
                        {canManage && (
                            <Button variant="link" className="p-0 h-auto text-xs" asChild>
                                <Link href="/entity?tab=settings">Configure settings →</Link>
                            </Button>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>
                        Common actions for this entity
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        {canManage && (
                            <>
                                <Button asChild>
                                    <Link href={`/entity/${entity.slug}/edit`}>
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Edit Entity
                                    </Link>
                                </Button>
                                <Button variant="outline" asChild>
                                    <Link href="/entity?tab=settings">
                                        <Settings className="mr-2 h-4 w-4" />
                                        Settings
                                    </Link>
                                </Button>
                                <Button variant="outline" asChild>
                                    <Link href="/entity?tab=members">
                                        <Users className="mr-2 h-4 w-4" />
                                        Manage Members
                                    </Link>
                                </Button>
                            </>
                        )}
                        <Button variant="outline" asChild>
                            <Link href="/entity/sub-entities">
                                <FolderTree className="mr-2 h-4 w-4" />
                                Sub-Entities
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

