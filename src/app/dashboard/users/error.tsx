'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, RefreshCw } from 'lucide-react'

export default function UsersError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('Users page error:', error)
    }, [error])

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Users</h2>
            </div>
            <Card className="w-full">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                        <AlertCircle className="h-6 w-6 text-destructive" />
                    </div>
                    <CardTitle>Failed to load users</CardTitle>
                    <CardDescription>
                        We couldn&apos;t load the user list. This might be a temporary issue.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
                        <code>{error.message || 'Failed to fetch users'}</code>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <Button onClick={() => reset()}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Try again
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}

