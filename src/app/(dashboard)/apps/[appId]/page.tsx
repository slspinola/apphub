import { Suspense } from 'react'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Container } from '@/components/ui/container'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AppDetailsTabs } from '@/components/apps/app-details-tabs'
import { AppStatusBadge } from '@/components/apps/app-status-badge'
import { getAppById, getOAuthConfig } from '@/features/apps/actions'
import { isSystemAdmin } from '@/lib/authorization'
import { ChevronLeft, ExternalLink } from 'lucide-react'
import type { AppWithDetails, OAuthConfig } from '@/types/apps'

interface AppPageProps {
  params: Promise<{ appId: string }>
}

export async function generateMetadata({ params }: AppPageProps) {
  const { appId } = await params
  try {
    const app = await getAppById(appId)
    return {
      title: `${app.name} - AppHub`,
      description: app.description || `Configure ${app.name}`,
    }
  } catch {
    return {
      title: 'App - AppHub',
    }
  }
}

async function AppContent({ appId }: { appId: string }) {
  const isAdmin = await isSystemAdmin()
  
  if (!isAdmin) {
    redirect('/')
  }

  const appResult = await getAppById(appId)
  
  if (!appResult) {
    notFound()
  }
  
  const app = appResult as AppWithDetails
  const oauthConfig = await getOAuthConfig(appId)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button asChild variant="ghost" size="icon" className="mt-1">
            <Link href="/apps">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-4">
            {app.icon ? (
              <img
                src={app.icon}
                alt={app.name}
                className="h-16 w-16 rounded-xl object-contain"
              />
            ) : (
              <div
                className="flex h-16 w-16 items-center justify-center rounded-xl text-3xl font-semibold text-white"
                style={{ backgroundColor: app.color || '#6366f1' }}
              >
                {app.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{app.name}</h1>
                <AppStatusBadge status={app.status} />
              </div>
              <p className="text-muted-foreground">{app.slug}</p>
              {app.description && (
                <p className="text-sm text-muted-foreground mt-1">{app.description}</p>
              )}
            </div>
          </div>
        </div>
        {app.baseUrl && (
          <Button asChild variant="outline">
            <a href={app.baseUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open App
            </a>
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Permissions</p>
          <p className="text-2xl font-bold">{app._count?.permissions || 0}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Scope Types</p>
          <p className="text-2xl font-bold">{app._count?.scopeTypes || 0}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Plans</p>
          <p className="text-2xl font-bold">{app._count?.plans || 0}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Active Licenses</p>
          <p className="text-2xl font-bold">{app._count?.licenses || 0}</p>
        </div>
      </div>

      {/* Tabs */}
      <AppDetailsTabs app={app} oauthConfig={oauthConfig} />
    </div>
  )
}

function AppLoading() {
  return (
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
  )
}

export default async function AppPage({ params }: AppPageProps) {
  const { appId } = await params
  
  return (
    <Container>
      <Suspense fallback={<AppLoading />}>
        <AppContent appId={appId} />
      </Suspense>
    </Container>
  )
}

