import { redirect } from 'next/navigation'

/**
 * Redirect to the unified entity page with members tab
 * Old route: /entity/members
 * New route: /entity?tab=members
 */
export default function EntityMembersRedirect() {
    redirect('/entity?tab=members')
}
