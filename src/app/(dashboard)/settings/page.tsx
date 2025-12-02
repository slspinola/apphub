import { getSystemSettings } from '@/features/system/actions'
import { WhiteLabelSettingsForm } from '@/components/forms/white-label-settings-form'
import { GeneralSettingsForm } from '@/components/forms/general-settings-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SettingsTabs } from '@/components/dashboard/settings/settings-tabs'
import ThemesPage from './themes/page'

export default async function SettingsPage() {
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
        <SettingsTabs>
            {{
                whiteLabel: (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-medium">White Label</h3>
                            <p className="text-sm text-muted-foreground">
                                Customize your application branding and appearance
                            </p>
                        </div>
                        <Card>
                            <CardHeader>
                                <CardTitle>Brand Settings</CardTitle>
                                <CardDescription>
                                    Configure your product name, company information, and logos
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <WhiteLabelSettingsForm initialSettings={result.data} />
                            </CardContent>
                        </Card>
                    </div>
                ),
                general: (
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
                ),
                themes: <ThemesPage />,
            }}
        </SettingsTabs>
    )
}
