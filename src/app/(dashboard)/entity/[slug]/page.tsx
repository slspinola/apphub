import { auth } from '@/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { isSystemAdminRole } from '@/lib/authorization'
import { Building2 } from 'lucide-react'
import { EntityDetailsTabs } from '@/components/entities/entity-details-tabs'
import { EntityOverviewTab } from '@/components/entities/entity-overview-tab'
import { EntitySettingsTab } from '@/components/entities/entity-settings-tab'
import { EntityMembersTab } from '@/components/entities/entity-members-tab'
import { EntityInvitationsTab } from '@/components/entities/entity-invitations-tab'

interface EntityPageProps {
    params: Promise<{ slug: string }>
}

export default async function EntityPage({ params }: EntityPageProps) {
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

    // Check access
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

        if (membership) {
            hasAccess = true
            membershipRole = membership.role
        }
    }

    if (!hasAccess) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Access Denied</h1>
                    <p className="text-muted-foreground mt-2">
                        You do not have access to this entity.
                    </p>
                </div>
            </div>
        )
    }

    const isSystemAdmin = isSystemAdminRole(session.user.role)

    // Get pending invitations count
    const pendingInvitesCount = await prisma.entityInvite.count({
        where: {
            entityId: entity.id,
            acceptedAt: null,
            expiresAt: { gt: new Date() },
        },
    })

    // Get members for members tab
    const members = await prisma.membership.findMany({
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
        orderBy: { createdAt: 'asc' },
    })

    // Get invitations for invitations tab
    const invitations = await prisma.entityInvite.findMany({
        where: { entityId: entity.id },
        orderBy: { createdAt: 'desc' },
    })

    return (
        <div className="space-y-6">
            {/* Page Header - no role badge */}
            <div className="flex items-center gap-3">
                <Building2 className="h-8 w-8 text-muted-foreground" />
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{entity.name}</h1>
                    <p className="text-muted-foreground">
                        {entity.parent ? `Sub-entity of ${entity.parent.name}` : 'Root entity'}
                    </p>
                </div>
            </div>

            {/* Tabbed Content - same as /entity page */}
            <EntityDetailsTabs
                membershipRole={membershipRole || 'member'}
                isSystemAdmin={isSystemAdmin}
                memberCount={entity._count.memberships}
                pendingInvitesCount={pendingInvitesCount}
            >
                {{
                    overview: (
                        <EntityOverviewTab
                            entity={entity}
                            membershipRole={membershipRole || 'member'}
                            isSystemAdmin={isSystemAdmin}
                        />
                    ),
                    settings: <EntitySettingsTab entity={entity} />,
                    members: <EntityMembersTab entity={entity} members={members} />,
                    invitations: <EntityInvitationsTab entity={entity} invitations={invitations} />,
                }}
            </EntityDetailsTabs>
        </div>
    )
}
