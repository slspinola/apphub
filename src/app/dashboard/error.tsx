'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, RefreshCw } from 'lucide-react'

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Dashboard error:', error)
    }, [error])

    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                        <AlertCircle className="h-6 w-6 text-destructive" />
                    </div>
                    <CardTitle>Something went wrong</CardTitle>
                    <CardDescription>
                        An error occurred while loading this page. Please try again.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
                        <code>{error.message || 'Unknown error'}</code>
                    </div>
                    {error.digest && (
                        <p className="mt-2 text-xs text-muted-foreground text-center">
                            Error ID: {error.digest}
                        </p>
                    )}
                </CardContent>
                <CardFooter className="flex justify-center gap-4">
                    <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>
                        Go to Dashboard
                    </Button>
                    <Button onClick={() => reset()}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Try again
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}

