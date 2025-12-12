'use client'

import Link from 'next/link'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AppStatusBadge } from './app-status-badge'
import { Settings, ExternalLink, Key, Shield, CreditCard } from 'lucide-react'
import type { AppWithStats } from '@/types/apps'
import { cn } from '@/lib/utils'

interface AppCardProps {
  app: AppWithStats
  className?: string
}

export function AppCard({ app, className }: AppCardProps) {
  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {app.icon ? (
              <img
                src={app.icon}
                alt={app.name}
                className="h-12 w-12 rounded-lg object-contain"
              />
            ) : (
              <div
                className="flex h-12 w-12 items-center justify-center rounded-lg text-2xl font-semibold text-white"
                style={{ backgroundColor: app.color || '#6366f1' }}
              >
                {app.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <h3 className="font-semibold truncate">{app.name}</h3>
              <p className="text-sm text-muted-foreground truncate">{app.slug}</p>
            </div>
          </div>
          <AppStatusBadge status={app.status} />
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        {app.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {app.description}
          </p>
        )}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Shield className="h-4 w-4" />
            <span>{app._count.permissions} permissions</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CreditCard className="h-4 w-4" />
            <span>{app._count.plans} plans</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Key className="h-4 w-4" />
            <span>{app._count.licenses} licenses</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-3 border-t gap-2">
        <Button asChild variant="outline" size="sm" className="flex-1">
          <Link href={`/apps/${app.id}`}>
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Link>
        </Button>
        {app.baseUrl && (
          <Button asChild variant="ghost" size="sm">
            <a href={app.baseUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

