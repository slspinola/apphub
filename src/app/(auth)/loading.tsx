import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function AuthLoading() {
    return (
        <Card className="w-full max-w-sm">
            <CardHeader>
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-4 w-56" />
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-4 w-48 mx-auto" />
            </CardContent>
        </Card>
    )
}

