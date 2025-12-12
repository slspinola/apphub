'use client'

import { AppCard } from './app-card'
import type { AppWithStats } from '@/types/apps'
import { cn } from '@/lib/utils'

interface AppListProps {
  apps: AppWithStats[]
  className?: string
}

export function AppList({ apps, className }: AppListProps) {
  if (apps.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No apps found</p>
      </div>
    )
  }

  return (
    <div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-3', className)}>
      {apps.map((app) => (
        <AppCard key={app.id} app={app} />
      ))}
    </div>
  )
}

