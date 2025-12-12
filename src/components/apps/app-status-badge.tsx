'use client'

import { Badge } from '@/components/ui/badge'
import type { AppStatus } from '@prisma/client'
import { cn } from '@/lib/utils'

interface AppStatusBadgeProps {
  status: AppStatus
  className?: string
}

const statusConfig: Record<AppStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
  DRAFT: {
    label: 'Draft',
    variant: 'secondary',
    className: 'bg-slate-100 text-slate-700 hover:bg-slate-100',
  },
  BETA: {
    label: 'Beta',
    variant: 'outline',
    className: 'border-amber-500 text-amber-600 bg-amber-50 hover:bg-amber-50',
  },
  ACTIVE: {
    label: 'Active',
    variant: 'default',
    className: 'bg-emerald-500 text-white hover:bg-emerald-500',
  },
  SUSPENDED: {
    label: 'Suspended',
    variant: 'destructive',
    className: 'bg-red-500 text-white hover:bg-red-500',
  },
  DEPRECATED: {
    label: 'Deprecated',
    variant: 'outline',
    className: 'border-orange-500 text-orange-600 bg-orange-50 hover:bg-orange-50',
  },
  ARCHIVED: {
    label: 'Archived',
    variant: 'secondary',
    className: 'bg-gray-200 text-gray-500 hover:bg-gray-200',
  },
}

export function AppStatusBadge({ status, className }: AppStatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <Badge
      variant={config.variant}
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  )
}

