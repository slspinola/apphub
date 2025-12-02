import { auth } from '@/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { isSystemAdminRole, canManageEntity } from '@/lib/authorization'
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Users, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface EntityMembersPageProps {
    params: Promise<{ slug: string }>
}

export default async function EntityMembersPage({ params }: EntityMembersPageProps) {
    const { slug } = await params
    const session = await auth()
    
    if (!session?.user?.id) {
        redirect('/login')
    }

    // Get entity by slug
    const entity = await prisma.entity.findUnique({
        where: { slug },
    })

    if (!entity) {
        notFound()
    }

    // Check permission
    let membershipRole: string | null = null
    let hasAccess = false

    if (isSystemAdminRole(session.user.role)) {
        hasAccess = true
        membershipRole = 'system_admin'
    } else {
        const membership = await prisma.membership.findUnique({
            where: {
                userId_entityId: {
                    userId: session.user.id,
                    entityId: entity.id,
                },
            },
        })
        membershipRole = membership?.role || null
        hasAccess = canManageEntity(session.user.role, membershipRole)
    }

    if (!hasAccess) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Access Denied</h1>
                    <p className="text-muted-foreground mt-2">
                            You do not have permission to manage this entity&apos;s members.
                    </p>
                </div>
            </div>
        )
    }

    // Get members
    const memberships = await prisma.membership.findMany({
        where: { entityId: entity.id },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                },
            },
        },
        orderBy: [
            { role: 'asc' },
            { createdAt: 'asc' },
        ],
    })

    const roleOrder = { owner: 0, admin: 1, manager: 2, member: 3 }
    const sortedMemberships = memberships.sort((a, b) => {
        const aOrder = roleOrder[a.role as keyof typeof roleOrder] ?? 4
        const bOrder = roleOrder[b.role as keyof typeof roleOrder] ?? 4
        return aOrder - bOrder
    })

    const getRoleBadgeVariant = (role: string) => {
        switch (role) {
            case 'owner':
                return 'default'
            case 'admin':
                return 'secondary'
            case 'manager':
                return 'outline'
            default:
                return 'outline'
        }
    }

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
                            <h1 className="text-3xl font-bold tracking-tight">Entity Members</h1>
                            <p className="text-muted-foreground mt-1">
                                Manage members of {entity.name}
                            </p>
                        </div>
                        <Badge variant="secondary" className="text-sm">
                            <Users className="mr-1 h-3 w-3" />
                            {memberships.length} members
                        </Badge>
                    </div>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Members</CardTitle>
                    <CardDescription>
                        All users who have access to this entity
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {sortedMemberships.length === 0 ? (
                        <div className="text-center py-8">
                            <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-semibold">No members</h3>
                            <p className="text-sm text-muted-foreground">
                                This entity has no members yet.
                            </p>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Joined</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedMemberships.map((membership) => (
                                        <TableRow key={membership.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={membership.user.image || undefined} />
                                                        <AvatarFallback>
                                                            {membership.user.name?.[0]?.toUpperCase() ||
                                                                membership.user.email[0].toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-medium">
                                                        {membership.user.name || 'Unnamed User'}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {membership.user.email}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={getRoleBadgeVariant(membership.role)}>
                                                    {membership.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {new Date(membership.createdAt).toLocaleDateString()}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Role Permissions</CardTitle>
                    <CardDescription>
                        Understanding what each role can do
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-lg border p-4">
                            <Badge className="mb-2">owner</Badge>
                            <p className="text-sm text-muted-foreground">
                                Full control including entity deletion and all member management
                            </p>
                        </div>
                        <div className="rounded-lg border p-4">
                            <Badge variant="secondary" className="mb-2">admin</Badge>
                            <p className="text-sm text-muted-foreground">
                                Manage settings, members, and sub-entities
                            </p>
                        </div>
                        <div className="rounded-lg border p-4">
                            <Badge variant="outline" className="mb-2">manager</Badge>
                            <p className="text-sm text-muted-foreground">
                                View and edit sub-entities only
                            </p>
                        </div>
                        <div className="rounded-lg border p-4">
                            <Badge variant="outline" className="mb-2">member</Badge>
                            <p className="text-sm text-muted-foreground">
                                Basic view access to the entity
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

