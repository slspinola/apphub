import { redirect } from 'next/navigation'

interface EntityEditPageProps {
    params: Promise<{ slug: string }>
}

/**
 * Edit page redirects to settings page
 * This consolidates entity editing functionality in one place
 */
export default async function EntityEditPage({ params }: EntityEditPageProps) {
    const { slug } = await params
    redirect(`/entity/${slug}/settings`)
}
