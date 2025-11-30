import { Skeleton } from "@/components/ui/skeleton"

export default function SettingsLoading() {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-px w-full" />
            <div className="flex flex-col lg:flex-row gap-8">
                <aside className="lg:w-1/5">
                    <nav className="flex flex-col gap-2">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <Skeleton key={i} className="h-10 w-full" />
                        ))}
                    </nav>
                </aside>
                <div className="flex-1">
                    <Skeleton className="h-64 w-full rounded-lg" />
                </div>
            </div>
        </div>
    )
}

