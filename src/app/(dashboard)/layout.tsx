import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { auth } from "@/auth"
import { getUserEntities, getEntityTreeForNav } from "@/features/entities/actions"
import { getSystemSettings } from "@/features/system/actions"
import { cookies } from "next/headers"
import { isSystemAdminRole } from "@/lib/authorization"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()
    const userRole = session?.user?.role
    const isSystemAdmin = isSystemAdminRole(userRole)

    const result = await getUserEntities()
    const entities = result.success ? result.data : []
    const cookieStore = await cookies()
    let currentEntityId = cookieStore.get('currentEntityId')?.value

    // If no entity is selected, use the first one as default (without persisting)
    if (!currentEntityId && entities.length > 0) {
        currentEntityId = entities[0].id
    }

    // Get the current entity's role for the user
    const currentEntity = entities.find((e) => e.id === currentEntityId)
    const currentEntityRole = currentEntity?.role

    // Get entity tree for navigation
    const entityTreeResult = await getEntityTreeForNav()
    const entityTree = entityTreeResult.success ? entityTreeResult.data : []

    const settingsResult = await getSystemSettings()
    const settings = settingsResult.success ? settingsResult.data : null

    return (
        <SidebarProvider style={{ "--sidebar-width": "19rem" } as React.CSSProperties}>
            <DashboardHeader
                userEmail={session?.user?.email}
                productName={settings?.productName}
                productLogo={settings?.productLogo}
            />
            <div className="flex flex-1 w-full pt-16">
                <AppSidebar
                    className="!top-16 h-[calc(100vh-4rem)]"
                    entities={entities || []}
                    currentEntityId={currentEntityId}
                    currentEntityRole={currentEntityRole}
                    userRole={userRole}
                    isSystemAdmin={isSystemAdmin}
                    entityTree={entityTree}
                    companyLogo={settings?.companyLogo}
                />
                <SidebarInset className="flex-1 min-h-[calc(100vh-4rem)] overflow-y-auto">
                    <div className="p-4 md:p-6 w-full">
                        {children}
                    </div>
                </SidebarInset>
            </div>
        </SidebarProvider>
    )
}
