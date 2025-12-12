import { Suspense } from 'react'
import { Container } from '@/components/ui/container'
import { AppList } from '@/components/apps/app-list'
import { CreateAppDialog } from '@/components/apps/create-app-dialog'
import { getApps } from '@/features/apps/actions'
import { isSystemAdmin } from '@/lib/authorization'
import { redirect } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import type { AppWithStats } from '@/types/apps'

export const metadata = {
  title: 'Apps - AppHub',
  description: 'Manage ecosystem applications',
}

async function AppsContent() {
  const isAdmin = await isSystemAdmin()
  
  if (!isAdmin) {
    redirect('/')
  }

  const result = await getApps()
  const apps = result.data as AppWithStats[]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Apps</h1>
          <p className="text-muted-foreground">
            Manage ecosystem applications and their configurations
          </p>
        </div>
        <CreateAppDialog />
      </div>

      <AppList apps={apps} />

      {result.meta.total > 0 && (
        <div className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Showing {apps.length} of {result.meta.total} apps
          </p>
        </div>
      )}
    </div>
  )
}

function AppsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-5 w-64" />
        </div>
        <Skeleton className="h-10 w-28" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-64" />
        ))}
      </div>
    </div>
  )
}

export default function AppsPage() {
  return (
    <Container>
      <Suspense fallback={<AppsLoading />}>
        <AppsContent />
      </Suspense>
    </Container>
  )
}

