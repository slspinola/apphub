'use client'

import { UserAppCard } from './user-app-card'
import type { App, Plan } from '@prisma/client'

interface SerializedLicense {
  id: string
  status: string
  validFrom: string
  plan: Pick<Plan, 'id' | 'name' | 'slug'>
}

interface SerializedPlan {
  id: string
  name: string
  slug: string
  price: number | null
  isTrial: boolean
  trialDays: number | null
}

interface UserAppListProps {
  apps: (App & {
    licenses?: SerializedLicense[]
    plans?: SerializedPlan[]
  })[]
  accessType: 'licensed' | 'available'
  emptyMessage?: string
}

export function UserAppList({ apps, accessType, emptyMessage }: UserAppListProps) {
  if (apps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed rounded-lg">
        <p className="text-muted-foreground text-center">
          {emptyMessage || 'No apps available'}
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {apps.map((app) => (
        <UserAppCard key={app.id} app={app} accessType={accessType} />
      ))}
    </div>
  )
}
