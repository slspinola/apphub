import { Suspense } from 'react'
import { Container } from '@/components/ui/container'
import { UserAppList } from '@/components/apps/user-app-list'
import { getAppsForUser, getAvailableApps } from '@/features/apps/actions'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata = {
  title: 'My Apps - AppHub',
  description: 'Your applications and available apps',
}

async function MyAppsContent() {
  const [userApps, availableApps] = await Promise.all([
    getAppsForUser(),
    getAvailableApps(),
  ])

  const hasLicensedApps = userApps.licensed.length > 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Apps</h1>
        <p className="text-muted-foreground">
          Access your licensed applications and explore available apps
        </p>
      </div>

      {/* Your Licensed Apps Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Your Apps</h2>
        {hasLicensedApps ? (
          <UserAppList 
            apps={userApps.licensed} 
            accessType="licensed"
            emptyMessage="No licensed apps"
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground text-center">
              You don&apos;t have access to any apps yet. Browse the available apps below to get started.
            </p>
          </div>
        )}
      </section>

      {/* Available Apps Section */}
      {availableApps.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Available Apps</h2>
          <p className="text-sm text-muted-foreground">
            Choose a plan to get access to these apps
          </p>
          <UserAppList 
            apps={availableApps} 
            accessType="available"
            emptyMessage="No additional apps available"
          />
        </section>
      )}
    </div>
  )
}

function MyAppsLoading() {
  return (
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
  )
}

export default function MyAppsPage() {
  return (
    <Container>
      <Suspense fallback={<MyAppsLoading />}>
        <MyAppsContent />
      </Suspense>
    </Container>
  )
}
