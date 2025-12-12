import { Suspense } from 'react'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { isSystemAdminRole } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { BulkOperationsContent } from '@/components/users/bulk-operations-content'

export const metadata = {
    title: 'Bulk Operations | Users',
    description: 'Perform bulk operations on multiple users',
}

async function getSelectedUsers(ids: string[]) {
    if (ids.length === 0) return []

    const users = await prisma.user.findMany({
        where: {
            id: { in: ids }
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            createdAt: true,
            memberships: {
                select: {
                    entity: {
                        select: {
                            name: true
                        }
                    }
                }
            }
        },
        orderBy: { name: 'asc' }
    })

    return users
}

export default async function BulkOperationsPage({
    searchParams,
}: {
    searchParams: { ids?: string }
}) {
    const session = await auth()

    if (!session?.user) {
        redirect('/login')
    }

    // Only system admins can perform bulk operations
    if (!isSystemAdminRole(session.user.role)) {
        redirect('/users')
    }

    const idsParam = searchParams.ids || ''
    const userIds = idsParam.split(',').filter(Boolean)

    if (userIds.length === 0) {
        redirect('/users')
    }

    const selectedUsers = await getSelectedUsers(userIds)

    return (
        <div className="container mx-auto py-8">
            <Suspense fallback={<div>Loading...</div>}>
                <BulkOperationsContent users={selectedUsers} userIds={userIds} />
            </Suspense>
        </div>
    )
}

