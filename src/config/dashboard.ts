import {
    LayoutDashboard,
    Settings,
    Users,
    Building2,
    Network,
    FolderTree,
    Shield,
    AppWindow,
    LayoutGrid,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/**
 * Navigation item configuration
 */
export interface NavItem {
    title: string
    url: string
    icon: LucideIcon
    badge?: string | number
    requiredRoles?: string[]
    requiresSystemAdmin?: boolean
}

/**
 * Navigation group configuration
 */
export interface NavGroup {
    label: string
    icon?: LucideIcon
    items: NavItem[]
    requiredRoles?: string[]
    requiresSystemAdmin?: boolean
}

/**
 * Dashboard navigation configuration
 */
export const dashboardConfig = {
    // Main platform navigation (visible to all authenticated users)
    navMain: [
        {
            title: 'Overview',
            url: '/',
            icon: LayoutDashboard,
        },
    ] as NavItem[],

    // Applications section (visible to all authenticated users)
    applications: {
        label: 'Applications',
        icon: LayoutGrid,
        items: [
            {
                title: 'My Apps',
                url: '/my-apps',
                icon: AppWindow,
            },
        ] as NavItem[],
    } as NavGroup,

    // Entity management section (role-based visibility) - Simplified with tabs
    entityManagement: {
        label: 'Entity Management',
        icon: Building2,
        // Include manager role - they see limited items
        requiredRoles: ['owner', 'admin', 'manager'],
        items: [
            {
                title: 'All Entities',
                url: '/entities',
                icon: Network,
                requiresSystemAdmin: true,
            },
            {
                title: 'Current Entity',
                url: '/entity',
                icon: Building2,
                requiredRoles: ['owner', 'admin'],
                // Settings, Members, Invitations are now tabs in this page
            },
            {
                title: 'Sub-Entities',
                url: '/entity/sub-entities',
                icon: FolderTree,
                // Manager can VIEW and EDIT sub-entities
                requiredRoles: ['owner', 'admin', 'manager'],
            },
        ] as NavItem[],
    } as NavGroup,

    // System administration (system_admin only)
    systemAdmin: {
        label: 'System Administration',
        icon: Shield,
        requiresSystemAdmin: true,
        items: [
            {
                title: 'Apps',
                url: '/apps',
                icon: AppWindow,
            },
            {
                title: 'System Settings',
                url: '/settings',
                icon: Settings,
            },
            {
                title: 'All Users',
                url: '/users',
                icon: Users,
            },
            {
                title: 'Entity Tree',
                url: '/admin/entities',
                icon: Network,
            },
        ] as NavItem[],
    } as NavGroup,
}

/**
 * Role-based navigation visibility
 * Determines which nav items each role can see
 */
export const ROLE_NAV_VISIBILITY = {
    system_admin: {
        entityManagement: true,
        allEntities: true,
        entitySettings: true,
        members: true,
        invitations: true,
        subEntities: true,
        systemAdmin: true,
    },
    owner: {
        entityManagement: true,
        allEntities: false,
        entitySettings: true,
        members: true,
        invitations: true,
        subEntities: true,
        systemAdmin: false,
    },
    admin: {
        entityManagement: true,
        allEntities: false,
        entitySettings: true,
        members: true,
        invitations: true,
        subEntities: true,
        systemAdmin: false,
    },
    manager: {
        entityManagement: true,
        allEntities: false,
        entitySettings: false,
        members: false,
        invitations: false,
        subEntities: true,
        systemAdmin: false,
    },
    member: {
        entityManagement: false,
        allEntities: false,
        entitySettings: false,
        members: false,
        invitations: false,
        subEntities: false,
        systemAdmin: false,
    },
} as const

export type RoleNavVisibility = typeof ROLE_NAV_VISIBILITY
export type UserRole = keyof typeof ROLE_NAV_VISIBILITY
