'use client'

import { useActionState } from 'react'
import { resetPassword } from '@/features/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { CheckCircle, Lock, AlertCircle } from 'lucide-react'

interface ResetPasswordFormProps {
    token: string
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
    const [state, dispatch, isPending] = useActionState(
        resetPassword,
        undefined
    )

    if (state?.success) {
        return (
            <Card className="w-full max-w-sm">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <CardTitle className="text-2xl">Password Reset</CardTitle>
                    <CardDescription>
                        {state.message}
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
            <CardHeader>
                <CardTitle className="text-2xl">Reset Password</CardTitle>
                <CardDescription>
                    Enter your new password below.
                </CardDescription>
            </CardHeader>
            <form action={dispatch}>
                <input type="hidden" name="token" value={token} />
                <CardContent className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="password">New Password</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="password"
                                type="password"
                                name="password"
                                placeholder="••••••••"
                                className="pl-10"
                                minLength={6}
                                required
                            />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="confirmPassword"
                                type="password"
                                name="confirmPassword"
                                placeholder="••••••••"
                                className="pl-10"
                                minLength={6}
                                required
                            />
                        </div>
                    </div>
                    {state?.message && !state.success && (
                        <div className="flex items-center gap-2 text-sm text-red-500">
                            <AlertCircle className="h-4 w-4" />
                            {state.message}
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                    <Button className="w-full" disabled={isPending}>
                        {isPending ? 'Resetting...' : 'Reset Password'}
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

