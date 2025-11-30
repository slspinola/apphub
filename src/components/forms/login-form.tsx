'use client'

import { useActionState } from 'react'
import { authenticate } from '@/features/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export function LoginForm() {
    const [errorMessage, dispatch, isPending] = useActionState(
        authenticate,
        undefined
    )

    return (
        <Card className="w-full max-w-sm">
            <CardHeader>
                <CardTitle className="text-2xl">Login</CardTitle>
                <CardDescription>
                    Enter your email below to login to your account.
                </CardDescription>
            </CardHeader>
            <form action={dispatch}>
                <CardContent className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            name="email"
                            placeholder="m@example.com"
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password">Password</Label>
                            <Link href="/forgot-password" className="text-sm text-muted-foreground hover:underline">
                                Forgot password?
                            </Link>
                        </div>
                        <Input id="password" type="password" name="password" required />
                    </div>
                    {errorMessage && (
                        <div className="text-sm text-red-500">{errorMessage}</div>
                    )}
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                    <Button className="w-full" disabled={isPending}>
                        {isPending ? 'Logging in...' : 'Sign in'}
                    </Button>
                    <div className="text-center text-sm">
                        Don&apos;t have an account?{' '}
                        <Link href="/register" className="underline">
                            Sign up
                        </Link>
                    </div>
                </CardFooter>
            </form>
        </Card>
    )
}
