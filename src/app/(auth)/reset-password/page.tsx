import { ResetPasswordForm } from '@/components/forms/reset-password-form'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

interface ResetPasswordPageProps {
    searchParams: Promise<{ token?: string }>
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
    const { token } = await searchParams

    if (!token) {
        return (
            <Card className="w-full max-w-sm">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                        <AlertCircle className="h-6 w-6 text-destructive" />
                    </div>
                    <CardTitle className="text-2xl">Invalid Link</CardTitle>
                    <CardDescription>
                        This password reset link is invalid or has expired.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center text-sm text-muted-foreground">
                    Please request a new password reset link.
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                    <Button asChild className="w-full">
                        <Link href="/forgot-password">
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

    return <ResetPasswordForm token={token} />
}

