import { getSystemSettings } from '@/features/system/actions'
import { GeneralSettingsForm } from '@/components/forms/general-settings-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function GeneralSettingsPage() {
    const result = await getSystemSettings()

    if (!result.success) {
        return (
            <Card>
                <CardContent className="py-12">
                    <p className="text-center text-muted-foreground">Failed to load settings</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">General Settings</h3>
                <p className="text-sm text-muted-foreground">
                    Configure regional preferences and localization options
                </p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Regional Settings</CardTitle>
                    <CardDescription>
                        Set default language, country, and timezone for your application
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <GeneralSettingsForm initialSettings={result.data} />
                </CardContent>
            </Card>
        </div>
    )
}


