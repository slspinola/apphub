import { redirect } from 'next/navigation'

/**
 * Redirect to the unified entity page with settings tab
 * Old route: /entity/settings
 * New route: /entity?tab=settings
 */
export default function EntitySettingsRedirect() {
    redirect('/entity?tab=settings')
}
