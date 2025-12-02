import { redirect } from 'next/navigation'

/**
 * Redirect to the unified entity page with invitations tab
 * Old route: /entity/invitations
 * New route: /entity?tab=invitations
 */
export default function EntityInvitationsRedirect() {
    redirect('/entity?tab=invitations')
}
