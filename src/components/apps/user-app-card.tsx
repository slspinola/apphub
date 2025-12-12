'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, Award, Calendar, Sparkles, Loader2 } from 'lucide-react'
import { requestLicenseForCurrentEntity } from '@/features/apps/actions'
import type { App, Plan } from '@prisma/client'

// Plan Activate Button Component - exported for use in other files
export function PlanActivateButton({ 
  appId, 
  planId, 
  isTrial, 
  isFree 
}: { 
  appId: string
  planId: string
  isTrial: boolean
  isFree: boolean 
}) {
  const router = useRouter()
  const [isActivating, setIsActivating] = useState(false)

  const handleActivate = async () => {
    setIsActivating(true)
    try {
      await requestLicenseForCurrentEntity(appId, planId)
      toast.success('Plan activated successfully!')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to activate plan')
    } finally {
      setIsActivating(false)
    }
  }

  return (
    <Button className="w-full" onClick={handleActivate} disabled={isActivating}>
      {isActivating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isActivating 
        ? 'Activating...' 
        : isTrial 
          ? 'Start Free Trial' 
          : isFree 
            ? 'Activate Free Plan' 
            : 'Choose Plan'}
    </Button>
  )
}

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

interface UserAppCardProps {
  app: App & {
    licenses?: SerializedLicense[]
    plans?: SerializedPlan[]
  }
  accessType: 'licensed' | 'available'
}

export function UserAppCard({ app, accessType }: UserAppCardProps) {
  const license = app.licenses && app.licenses.length > 0 ? app.licenses[0] : null
  const hasLicense = accessType === 'licensed' && license
  const hasFreeOrTrialPlan = app.plans?.some(p => p.price === null || p.price === 0 || p.isTrial)

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {app.icon ? (
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: app.color || '#6366f1' }}
              >
                <span className="text-2xl">{app.icon}</span>
              </div>
            ) : (
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0"
                style={{ backgroundColor: app.color || '#6366f1' }}
              >
                {app.name.charAt(0)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <CardTitle className="truncate">{app.name}</CardTitle>
              {hasLicense && (
                <>
                  <div className="flex items-center gap-1 mt-1">
                    <Award className="h-3 w-3 text-primary" />
                    <span className="text-xs text-muted-foreground">{license.plan.name}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Since {formatDate(license.validFrom)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
          {hasLicense && (
            <Badge variant={license.status === 'TRIAL' ? 'secondary' : 'default'}>
              {license.status === 'TRIAL' ? 'Trial' : 'Active'}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <CardDescription className="line-clamp-3">
          {app.description || 'No description available'}
        </CardDescription>
      </CardContent>
      <CardFooter className="flex gap-2">
        {hasLicense ? (
          <>
            <Button asChild className="flex-1">
              <a href={app.baseUrl} target="_blank" rel="noopener noreferrer">
                Open App
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/my-apps/${app.slug}`}>Details</Link>
            </Button>
          </>
        ) : (
          <>
            <Button asChild className="flex-1">
              <Link href={`/my-apps/${app.slug}`}>
                {hasFreeOrTrialPlan ? (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Get Access
                  </>
                ) : (
                  'Choose Plan'
                )}
              </Link>
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  )
}
