'use client'

import * as React from 'react'
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    SidebarSeparator,
    SidebarTrigger,
} from '@/components/ui/sidebar'
import { dashboardConfig } from '@/config/dashboard'
import { shouldShowNavItem } from '@/lib/authorization'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Building2 } from 'lucide-react'

import { EntitySwitcher } from '@/components/entities/entity-switcher'
import { EntityTreeNav } from '@/components/entities/entity-tree-nav'
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible'
import type { EntityNode } from '@/types/entities'

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
    entities: { id: string; name: string; slug: string; role: string }[]
    currentEntityId?: string
    currentEntityRole?: string
    userRole?: string
    isSystemAdmin?: boolean
    entityTree?: EntityNode[]
    companyLogo?: string | null
}

export function AppSidebar({
    entities,
    currentEntityId,
    currentEntityRole,
    userRole,
    isSystemAdmin = false,
    entityTree = [],
    companyLogo,
    ...props
}: AppSidebarProps) {
    const pathname = usePathname()

    // Determine if user can see entity management section
    const canSeeEntityManagement =
        isSystemAdmin ||
        (currentEntityRole &&
            dashboardConfig.entityManagement.requiredRoles?.includes(currentEntityRole))

    // Determine if user can create sub-entities
    const canCreateSubEntities =
        isSystemAdmin ||
        currentEntityRole === 'owner' ||
        currentEntityRole === 'admin'

    // Filter entity management items based on role
    const visibleEntityManagementItems = dashboardConfig.entityManagement.items.filter(
        (item) => shouldShowNavItem(item, userRole, currentEntityRole)
    )

    // Check if sub-entities section should be shown
    const showSubEntitiesSection =
        canSeeEntityManagement &&
        (isSystemAdmin ||
            currentEntityRole === 'owner' ||
            currentEntityRole === 'admin' ||
            currentEntityRole === 'manager')

    // Get current entity's children from entityTree
    const currentEntityChildren = React.useMemo(() => {
        if (!currentEntityId || !entityTree.length) return []

        const findEntity = (nodes: EntityNode[]): EntityNode | null => {
            for (const node of nodes) {
                if (node.id === currentEntityId) return node
                if (node.children.length) {
                    const found = findEntity(node.children)
                    if (found) return found
                }
            }
            return null
        }

        const current = findEntity(entityTree)
        return current?.children || []
    }, [currentEntityId, entityTree])

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <div className="flex items-center justify-between px-4 py-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 min-w-0">
                    <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden min-w-0 flex-1">
                        <EntitySwitcher entities={entities} currentEntityId={currentEntityId} />
                    </div>
                    <SidebarTrigger className="ml-auto group-data-[collapsible=icon]:ml-0 shrink-0" />
                </div>
            </SidebarHeader>
            <SidebarContent>
                {/* Platform Navigation */}
                <SidebarGroup>
                    <SidebarGroupLabel>Platform</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {dashboardConfig.navMain.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild isActive={pathname === item.url}>
                                        <Link href={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* Entity Management Section */}
                {canSeeEntityManagement && visibleEntityManagementItems.length > 0 && (
                    <>
                        <SidebarSeparator />
                        <SidebarGroup>
                            <SidebarGroupLabel>
                                <Building2 className="mr-2 h-4 w-4" />
                                Entity Management
                            </SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {visibleEntityManagementItems.map((item) => (
                                        <SidebarMenuItem key={item.title}>
                                            <SidebarMenuButton
                                                asChild
                                                isActive={pathname === item.url || pathname.startsWith(item.url + '/')}
                                            >
                                                <Link href={item.url}>
                                                    <item.icon />
                                                    <span>{item.title}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    ))}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    </>
                )}

                {/* Sub-Entities Tree */}
                {showSubEntitiesSection && currentEntityChildren.length > 0 && (
                    <SidebarGroup>
                        <Collapsible defaultOpen className="group/collapsible">
                            <SidebarGroupLabel asChild>
                                <CollapsibleTrigger className="flex w-full items-center min-w-0">
                                    <ChevronRight className="mr-2 h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90 shrink-0" />
                                    <span className="truncate">Sub-Entities</span>
                                    <span className="ml-auto text-xs text-muted-foreground shrink-0">
                                        {currentEntityChildren.length}
                                    </span>
                                </CollapsibleTrigger>
                            </SidebarGroupLabel>
                            <CollapsibleContent>
                                <SidebarGroupContent>
                                    <EntityTreeNav
                                        entities={currentEntityChildren}
                                        currentEntityId={currentEntityId}
                                        canCreate={canCreateSubEntities}
                                        maxDepth={3}
                                    />
                                </SidebarGroupContent>
                            </CollapsibleContent>
                        </Collapsible>
                    </SidebarGroup>
                )}

                {/* System Administration Section (system_admin only) */}
                {isSystemAdmin && (() => {
                    const SystemAdminIcon = dashboardConfig.systemAdmin.icon
                    return (
                        <>
                            <SidebarSeparator />
                            <SidebarGroup>
                                <SidebarGroupLabel>
                                    {SystemAdminIcon && <SystemAdminIcon className="mr-2 h-4 w-4" />}
                                    {dashboardConfig.systemAdmin.label}
                                </SidebarGroupLabel>
                                <SidebarGroupContent>
                                    <SidebarMenu>
                                        {dashboardConfig.systemAdmin.items.map((item) => {
                                            const ItemIcon = item.icon
                                            return (
                                                <SidebarMenuItem key={item.title}>
                                                    <SidebarMenuButton
                                                        asChild
                                                        isActive={pathname === item.url || pathname.startsWith(item.url + '/')}
                                                    >
                                                        <Link href={item.url}>
                                                            <ItemIcon />
                                                            <span>{item.title}</span>
                                                        </Link>
                                                    </SidebarMenuButton>
                                                </SidebarMenuItem>
                                            )
                                        })}
                                    </SidebarMenu>
                                </SidebarGroupContent>
                            </SidebarGroup>
                        </>
                    )
                })()}
            </SidebarContent>

            {companyLogo && (
                <div className="p-4 mt-auto group-data-[collapsible=icon]:hidden">
                    <img src={companyLogo} alt="Company Logo" className="max-h-12 w-auto mx-auto" />
                </div>
            )}
            <SidebarRail />
        </Sidebar>
    )
}
