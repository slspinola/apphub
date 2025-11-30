import { getSystemSettings } from '@/features/system/actions'
import { SystemSettingsForm } from '@/components/forms/system-settings-form'

export default async function SystemSettingsPage() {
    const result = await getSystemSettings()

    if (!result.success) {
        return <div>Failed to load settings</div>
    }

    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-bold">White Labeling</h1>
            <SystemSettingsForm initialSettings={result.data} />
        </div>
    )
}
