'use client'

import * as React from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { LayoutDashboard, Settings, Users, UserPlus } from 'lucide-react'

export type EntityTabId = 'overview' | 'settings' | 'members' | 'invitations'

interface EntityDetailsTabsProps {
    /** Current membership role */
    membershipRole: string
    /** Whether user is system admin */
    isSystemAdmin: boolean
    /** Member count for badge */
    memberCount?: number
    /** Pending invitations count for badge */
    pendingInvitesCount?: number
    /** Tab content components */
    children: {
        overview: React.ReactNode
        settings: React.ReactNode
        members: React.ReactNode
        invitations: React.ReactNode
    }
}

export function EntityDetailsTabs({
    membershipRole,
    isSystemAdmin,
    memberCount = 0,
    pendingInvitesCount = 0,
    children,
}: EntityDetailsTabsProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const currentTab = (searchParams.get('tab') as EntityTabId) || 'overview'

    const canManage = isSystemAdmin || ['owner', 'admin'].includes(membershipRole)

    const handleTabChange = (tab: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (tab === 'overview') {
            params.delete('tab')
        } else {
            params.set('tab', tab)
        }
        const queryString = params.toString()
        router.push(queryString ? `${pathname}?${queryString}` : pathname)
    }

    // Determine visible tabs based on role
    const visibleTabs = React.useMemo(() => {
        const tabs: { id: EntityTabId; label: string; icon: typeof LayoutDashboard; badge?: number }[] = [
            { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        ]

        if (canManage) {
            tabs.push(
                { id: 'settings', label: 'Settings', icon: Settings },
                { id: 'members', label: 'Members', icon: Users, badge: memberCount },
                { id: 'invitations', label: 'Invitations', icon: UserPlus, badge: pendingInvitesCount }
            )
        }

        return tabs
    }, [canManage, memberCount, pendingInvitesCount])

    // If current tab is not visible, redirect to overview
    React.useEffect(() => {
        const isValidTab = visibleTabs.some((t) => t.id === currentTab)
        if (!isValidTab && currentTab !== 'overview') {
            handleTabChange('overview')
        }
    }, [currentTab, visibleTabs])

    return (
        <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className={`grid w-full max-w-2xl mb-6 ${canManage ? 'grid-cols-4' : 'grid-cols-1'}`}>
                {visibleTabs.map((tab) => {
                    const Icon = tab.icon
                    return (
                        <TabsTrigger
                            key={tab.id}
                            value={tab.id}
                            className="flex items-center gap-2 cursor-pointer transition-all hover:bg-accent hover:text-accent-foreground active:scale-[0.98]"
                        >
                            <Icon className="h-4 w-4" />
                            <span className="hidden sm:inline">{tab.label}</span>
                            {tab.badge !== undefined && tab.badge > 0 && (
                                <Badge
                                    variant={tab.id === 'invitations' ? 'default' : 'secondary'}
                                    className="ml-1 h-5 min-w-5 px-1.5 text-xs"
                                >
                                    {tab.badge}
                                </Badge>
                            )}
                        </TabsTrigger>
                    )
                })}
            </TabsList>

            <TabsContent value="overview" className="mt-0">
                {children.overview}
            </TabsContent>

            {canManage && (
                <>
                    <TabsContent value="settings" className="mt-0">
                        {children.settings}
                    </TabsContent>
                    <TabsContent value="members" className="mt-0">
                        {children.members}
                    </TabsContent>
                    <TabsContent value="invitations" className="mt-0">
                        {children.invitations}
                    </TabsContent>
                </>
            )}
        </Tabs>
    )
}

