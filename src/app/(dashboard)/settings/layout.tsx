import { Settings as SettingsIcon } from 'lucide-react'

interface SettingsLayoutProps {
    children: React.ReactNode
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
    return (
        <div className="space-y-6 w-full">
            <div className="flex items-center gap-3">
                <SettingsIcon className="h-8 w-8 text-muted-foreground" />
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
                    <p className="text-muted-foreground">
                        Manage your application settings and preferences
                    </p>
                </div>
            </div>
            {children}
        </div>
    )
}
