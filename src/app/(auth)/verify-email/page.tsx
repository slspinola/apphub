import { verifyEmail } from '@/features/auth/actions'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react'

interface VerifyEmailPageProps {
    searchParams: Promise<{ token?: string }>
}

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
    const { token } = await searchParams

    if (!token) {
        return (
            <Card className="w-full max-w-sm">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                        <XCircle className="h-6 w-6 text-destructive" />
                    </div>
                    <CardTitle className="text-2xl">Invalid Link</CardTitle>
                    <CardDescription>
                        This verification link is missing or invalid.
                    </CardDescription>
                </CardHeader>
                <CardFooter className="flex flex-col gap-4">
                    <Button asChild className="w-full">
                        <Link href="/login">
                            Go to Login
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        )
    }

    const result = await verifyEmail(token)

    if (result.success) {
        return (
            <Card className="w-full max-w-sm">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <CardTitle className="text-2xl">Email Verified!</CardTitle>
                    <CardDescription>
                        {result.message}
                    </CardDescription>
                </CardHeader>
                <CardFooter>
                    <Button asChild className="w-full">
                        <Link href="/login">
                            Continue to Login
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        )
    }

    return (
        <Card className="w-full max-w-sm">
            <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                    <AlertCircle className="h-6 w-6 text-destructive" />
                </div>
                <CardTitle className="text-2xl">Verification Failed</CardTitle>
                <CardDescription>
                    {result.message}
                </CardDescription>
            </CardHeader>
            <CardContent className="text-center text-sm text-muted-foreground">
                The link may have expired. Please request a new verification email.
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
                <Button asChild className="w-full">
                    <Link href="/resend-verification">
                        Request New Link
                    </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                    <Link href="/login">
                        Back to Login
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    )
}

