import { Separator } from "@/components/ui/separator"
import { SidebarNav } from "@/components/dashboard/settings/sidebar-nav"

const sidebarNavItems = [
    {
        title: "System",
        href: "/dashboard/settings/system",
    },
    // Add more settings links here as needed
]

interface SettingsLayoutProps {
    children: React.ReactNode
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
    return (
        <div className="space-y-6 w-full">
            <div className="space-y-0.5">
                <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground">
                    Manage your application settings and preferences.
                </p>
            </div>
            <Separator className="my-6" />
            <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
                <aside className="lg:w-1/5">
                    <SidebarNav items={sidebarNavItems} />
                </aside>
                <div className="flex-1">{children}</div>
            </div>
        </div>
    )
}
