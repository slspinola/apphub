import { getSystemSettings } from '@/features/system/actions'
import { WhiteLabelSettingsForm } from '@/components/forms/white-label-settings-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function WhiteLabelSettingsPage() {
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
    )
}


