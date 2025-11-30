'use client'

import { useActionState } from 'react'
import { resendVerificationEmail } from '@/features/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { CheckCircle, Mail } from 'lucide-react'

interface ResendVerificationFormProps {
    defaultEmail?: string
}

export function ResendVerificationForm({ defaultEmail }: ResendVerificationFormProps) {
    const [state, dispatch, isPending] = useActionState(
        resendVerificationEmail,
        undefined
    )

    if (state?.success) {
        return (
            <Card className="w-full max-w-sm">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <CardTitle className="text-2xl">Email Sent!</CardTitle>
                    <CardDescription>
                        {state.message}
                    </CardDescription>
                </CardHeader>
                <CardFooter className="flex flex-col gap-4">
                    <Button asChild variant="outline" className="w-full">
                        <Link href="/login">
                            Back to Login
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        )
    }

    return (
        <Card className="w-full max-w-sm">
            <CardHeader>
                <CardTitle className="text-2xl">Resend Verification</CardTitle>
                <CardDescription>
                    Enter your email to receive a new verification link.
                </CardDescription>
            </CardHeader>
            <form action={dispatch}>
                <CardContent className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="email"
                                type="email"
                                name="email"
                                placeholder="m@example.com"
                                defaultValue={defaultEmail}
                                className="pl-10"
                                required
                            />
                        </div>
                    </div>
                    {state?.message && !state.success && (
                        <div className="text-sm text-red-500">{state.message}</div>
                    )}
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                    <Button className="w-full" disabled={isPending}>
                        {isPending ? 'Sending...' : 'Send Verification Email'}
                    </Button>
                    <div className="text-center text-sm">
                        <Link href="/login" className="underline">
                            Back to Login
                        </Link>
                    </div>
                </CardFooter>
            </form>
        </Card>
    )
}

