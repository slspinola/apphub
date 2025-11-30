import { LayoutDashboard, Settings, Users } from 'lucide-react'

export const dashboardConfig = {
    navMain: [
        {
            title: 'Overview',
            url: '/dashboard',
            icon: LayoutDashboard,
        },
        {
            title: 'Users',
            url: '/dashboard/users',
            icon: Users,
        },
        {
            title: 'Settings',
            url: '/dashboard/settings',
            icon: Settings,
        },
    ],
}
