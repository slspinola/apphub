import { notFound } from 'next/navigation'
import { getUserDetails } from '@/features/users/actions'
import { auth } from '@/auth'
import { UserDetailHeader } from '@/components/users/user-detail/user-detail-header'
import { UserDetailTabs } from '@/components/users/user-detail/user-detail-tabs'

interface UserDetailPageProps {
    params: Promise<{
        userId: string
    }>
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
    const { userId } = await params
    
    const session = await auth()
    if (!session?.user?.id) {
        notFound()
    }

    const result = await getUserDetails(userId)
    
    if (!result.success || !result.data) {
        notFound()
    }

    const user = result.data

    return (
        <div className="space-y-6">
            <UserDetailHeader user={user} sessionUser={session.user} />
            <UserDetailTabs user={user} sessionUser={session.user} />
        </div>
    )
}

