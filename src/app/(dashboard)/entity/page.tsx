import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { isSystemAdminRole } from '@/lib/authorization'
import { Building2 } from 'lucide-react'
import { EntityDetailsTabs } from '@/components/entities/entity-details-tabs'
import { EntityOverviewTab } from '@/components/entities/entity-overview-tab'
import { EntitySettingsTab } from '@/components/entities/entity-settings-tab'
import { EntityMembersTab } from '@/components/entities/entity-members-tab'
import { EntityInvitationsTab } from '@/components/entities/entity-invitations-tab'

export default async function EntityPage() {
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
                    <h1 className="text-3xl font-bold tracking-tight">Current Entity</h1>
                    <p className="text-muted-foreground mt-2">
                        No entity selected. Please select an entity from the sidebar.
                    </p>
                </div>
            </div>
        )
    }

    // Fetch entity with all related data
    const entity = await prisma.entity.findUnique({
        where: { id: currentEntityId },
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
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Current Entity</h1>
                    <p className="text-muted-foreground mt-2">Entity not found.</p>
                </div>
            </div>
        )
    }

    // Get membership role
    let membershipRole = 'system_admin'
    const isSystemAdmin = isSystemAdminRole(session.user.role)

    if (!isSystemAdmin) {
        const membership = await prisma.membership.findUnique({
            where: {
                userId_entityId: {
                    userId: session.user.id,
                    entityId: currentEntityId,
                },
            },
        })
        membershipRole = membership?.role || 'member'
    }

    // Get pending invitations count
    const pendingInvitesCount = await prisma.entityInvite.count({
        where: {
            entityId: currentEntityId,
            acceptedAt: null,
            expiresAt: { gt: new Date() },
        },
    })

    // Get members for members tab
    const members = await prisma.membership.findMany({
        where: { entityId: currentEntityId },
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
        where: { entityId: currentEntityId },
        orderBy: { createdAt: 'desc' },
    })

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center gap-3">
                <Building2 className="h-8 w-8 text-muted-foreground" />
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{entity.name}</h1>
                    <p className="text-muted-foreground">
                        {entity.parent ? `Sub-entity of ${entity.parent.name}` : 'Root entity'}
                    </p>
                </div>
            </div>

            {/* Tabbed Content */}
            <EntityDetailsTabs
                membershipRole={membershipRole}
                isSystemAdmin={isSystemAdmin}
                memberCount={entity._count.memberships}
                pendingInvitesCount={pendingInvitesCount}
            >
                {{
                    overview: (
                        <EntityOverviewTab
                            entity={entity}
                            membershipRole={membershipRole}
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

