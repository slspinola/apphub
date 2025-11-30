import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { FileQuestion, Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <Card className="w-full max-w-md mx-4">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                        <FileQuestion className="h-7 w-7 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-xl">Page not found</CardTitle>
                    <CardDescription>
                        The page you&apos;re looking for doesn&apos;t exist or has been moved.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center text-sm text-muted-foreground">
                    <p>Error 404</p>
                </CardContent>
                <CardFooter className="flex justify-center gap-4">
                    <Button variant="outline" asChild>
                        <Link href="/">
                            <Home className="mr-2 h-4 w-4" />
                            Home
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link href="/dashboard">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Dashboard
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}

