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
    SidebarTrigger,
} from '@/components/ui/sidebar'
import { dashboardConfig } from '@/config/dashboard'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { EntitySwitcher } from '@/components/entities/entity-switcher'

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
    entities: { id: string; name: string; slug: string; role: string }[]
    currentEntityId?: string
    companyLogo?: string | null
}

export function AppSidebar({ entities, currentEntityId, companyLogo, ...props }: AppSidebarProps) {
    const pathname = usePathname()

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <div className="flex items-center justify-between px-4 py-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
                    <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
                        <EntitySwitcher entities={entities} currentEntityId={currentEntityId} />
                    </div>
                    <SidebarTrigger className="ml-auto group-data-[collapsible=icon]:ml-0" />
                </div>
            </SidebarHeader>
            <SidebarContent>
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
