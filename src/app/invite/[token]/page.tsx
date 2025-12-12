import { acceptInvitation } from '@/features/entities/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, XCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'

interface InvitePageProps {
    params: Promise<{ token: string }>
}

export default async function InvitePage({ params }: InvitePageProps) {
    const { token } = await params
    const session = await auth()

    if (!session) {
        redirect(`/auth/login?callbackUrl=/invite/${token}`)
    }

    const result = await acceptInvitation(token)

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        {result.success ? (
                            <CheckCircle className="h-6 w-6 text-green-600" />
                        ) : (
                            <XCircle className="h-6 w-6 text-red-600" />
                        )}
                    </div>
                    <CardTitle>{result.success ? 'Invitation Accepted' : 'Invitation Failed'}</CardTitle>
                    <CardDescription>
                        {result.message || result.error}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild className="w-full">
                        <Link href="/">
                            {result.success ? 'Go to Dashboard' : 'Back to Home'}
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}

