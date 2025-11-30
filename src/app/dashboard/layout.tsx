import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { auth } from "@/auth"
import { getUserEntities } from "@/features/entities/actions"
import { getSystemSettings } from "@/features/system/actions"
import { cookies } from "next/headers"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()
    const result = await getUserEntities()
    const entities = result.success ? result.data : []
    const cookieStore = await cookies()
    let currentEntityId = cookieStore.get('currentEntityId')?.value

    if (!currentEntityId && entities.length > 0) {
        currentEntityId = entities[0].id
        cookieStore.set('currentEntityId', currentEntityId)
    }

    const settingsResult = await getSystemSettings()
    const settings = settingsResult.success ? settingsResult.data : null

    return (
        <SidebarProvider style={{ "--sidebar-width": "19rem" } as React.CSSProperties}>
            <div className="flex min-h-svh w-full flex-col">
                <DashboardHeader
                    userEmail={session?.user?.email}
                    productName={settings?.productName}
                    productLogo={settings?.productLogo}
                />
                <div className="flex flex-1 overflow-hidden">
                    <AppSidebar
                        className="top-16 h-[calc(100svh-4rem)]"
                        entities={entities || []}
                        currentEntityId={currentEntityId}
                        companyLogo={settings?.companyLogo}
                    />
                    <SidebarInset>
                        <main className="flex flex-1 flex-col gap-4 p-4">
                            {children}
                        </main>
                    </SidebarInset>
                </div>
            </div>
        </SidebarProvider>
    )
}
