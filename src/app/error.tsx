'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Home, RefreshCw } from 'lucide-react'

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('Application error:', error)
    }, [error])

    return (
        <html>
            <body>
                <div className="flex items-center justify-center min-h-screen bg-background">
                    <Card className="w-full max-w-md mx-4">
                        <CardHeader className="text-center">
                            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
                                <AlertCircle className="h-7 w-7 text-destructive" />
                            </div>
                            <CardTitle className="text-xl">Something went wrong</CardTitle>
                            <CardDescription>
                                An unexpected error occurred. Our team has been notified.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground font-mono">
                                {error.message || 'Unknown error occurred'}
                            </div>
                            {error.digest && (
                                <p className="mt-2 text-xs text-muted-foreground text-center">
                                    Reference: {error.digest}
                                </p>
                            )}
                        </CardContent>
                        <CardFooter className="flex justify-center gap-4">
                            <Button variant="outline" onClick={() => window.location.href = '/'}>
                                <Home className="mr-2 h-4 w-4" />
                                Home
                            </Button>
                            <Button onClick={() => reset()}>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Try again
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </body>
        </html>
    )
}

