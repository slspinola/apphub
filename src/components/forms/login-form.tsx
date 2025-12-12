'use client'

import { useActionState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { authenticate } from '@/features/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'

export function LoginForm() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const sessionError = searchParams.get('error')
    const sessionMessage = searchParams.get('message')
    const callbackUrl = searchParams.get('callbackUrl') || '/'

    const [result, dispatch, isPending] = useActionState(
        authenticate,
        undefined
    )

    // Handle successful login redirect
    useEffect(() => {
        if (result?.success && result?.redirectTo) {
            // Use window.location for external/complex URLs
            window.location.href = result.redirectTo
        }
    }, [result, router])

    return (
        <Card className="w-full max-w-sm">
            <CardHeader>
                <CardTitle className="text-2xl">Login</CardTitle>
                <CardDescription>
                    Enter your email below to login to your account.
                </CardDescription>
            </CardHeader>
            <form action={dispatch}>
                <input type="hidden" name="callbackUrl" value={callbackUrl} />
                <CardContent className="grid gap-4">
                    {sessionError === 'SessionExpired' && sessionMessage && (
                        <Alert variant="destructive">
                            <AlertDescription>{sessionMessage}</AlertDescription>
                        </Alert>
                    )}
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
                    {result?.error && (
                        <div className="text-sm text-red-500">{result.error}</div>
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
