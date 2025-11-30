'use client'

import { useActionState } from 'react'
import { register } from '@/features/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { CheckCircle, Mail, User, Lock } from 'lucide-react'

export function RegisterForm() {
    const [state, dispatch, isPending] = useActionState(register, undefined)

    if (state?.success) {
        return (
            <Card className="w-full max-w-sm">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <CardTitle className="text-2xl">Account Created!</CardTitle>
                    <CardDescription>
                        {state.message}
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                    <p className="text-sm text-muted-foreground">
                        We sent a verification link to:
                    </p>
                    <p className="font-medium mt-1">{state.email}</p>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                    <Button asChild className="w-full">
                        <Link href="/login">
                            Continue to Login
                        </Link>
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                        Didn&apos;t receive the email?{' '}
                        <Link href={`/resend-verification?email=${encodeURIComponent(state.email || '')}`} className="underline">
                            Resend
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        )
    }

    return (
        <Card className="w-full max-w-sm">
            <CardHeader>
                <CardTitle className="text-2xl">Register</CardTitle>
                <CardDescription>
                    Create a new account to get started.
                </CardDescription>
            </CardHeader>
            <form action={dispatch}>
                <CardContent className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="name"
                                name="name"
                                placeholder="John Doe"
                                className="pl-10"
                                required
                            />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="email"
                                type="email"
                                name="email"
                                placeholder="m@example.com"
                                className="pl-10"
                                required
                            />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password">Password</Label>
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
                        <p className="text-xs text-muted-foreground">
                            Must be at least 6 characters
                        </p>
                    </div>
                    {state?.message && !state.success && (
                        <div className="text-sm text-red-500">{state.message}</div>
                    )}
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                    <Button className="w-full" disabled={isPending}>
                        {isPending ? 'Creating account...' : 'Create account'}
                    </Button>
                    <div className="text-center text-sm">
                        Already have an account?{' '}
                        <Link href="/login" className="underline">
                            Sign in
                        </Link>
                    </div>
                </CardFooter>
            </form>
        </Card>
    )
}
