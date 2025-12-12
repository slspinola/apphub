import { Container } from '@/components/ui/container'
import { Skeleton } from '@/components/ui/skeleton'

export default function MyAppsLoading() {
  return (
    <Container>
      <div className="space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-5 w-64" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-7 w-24" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      </div>
    </Container>
  )
}
