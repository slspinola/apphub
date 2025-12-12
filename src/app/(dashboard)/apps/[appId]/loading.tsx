import { Container } from '@/components/ui/container'
import { Skeleton } from '@/components/ui/skeleton'

export default function AppLoading() {
  return (
    <Container>
      <div className="space-y-6">
        <div className="flex items-start gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-5 w-32" />
            </div>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    </Container>
  )
}

