import { ResendVerificationForm } from '@/components/forms/resend-verification-form'

interface ResendVerificationPageProps {
    searchParams: Promise<{ email?: string }>
}

export default async function ResendVerificationPage({ searchParams }: ResendVerificationPageProps) {
    const { email } = await searchParams

    return <ResendVerificationForm defaultEmail={email} />
}

