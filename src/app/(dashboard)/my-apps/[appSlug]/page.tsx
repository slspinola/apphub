import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Container } from '@/components/ui/container'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getAppBySlugForUser } from '@/features/apps/actions'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, ExternalLink, FileText, HelpCircle, Award, Calendar, Check, Sparkles } from 'lucide-react'
import { PlanActivateButton } from '@/components/apps/user-app-card'

export async function generateMetadata({ params }: { params: Promise<{ appSlug: string }> }) {
  const { appSlug } = await params
  try {
    const app = await getAppBySlugForUser(appSlug)
    return {
      title: `${app.name} - AppHub`,
      description: app.description || `Details for ${app.name}`,
    }
  } catch {
    return {
      title: 'App Not Found - AppHub',
    }
  }
}

async function AppDetailContent({ appSlug }: { appSlug: string }) {
  let app
  try {
    app = await getAppBySlugForUser(appSlug)
  } catch {
    notFound()
  }

  const activeLicense = app.activeLicense
  const hasActiveLicense = app.hasActiveLicense
  const availablePlans = app.plans.filter(p => !hasActiveLicense || p.id !== activeLicense?.plan.id)

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/my-apps">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-4 flex-1">
          {app.icon ? (
            <div 
              className="w-16 h-16 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: app.color || '#6366f1' }}
            >
              <span className="text-3xl">{app.icon}</span>
            </div>
          ) : (
            <div 
              className="w-16 h-16 rounded-xl flex items-center justify-center text-white text-2xl font-bold"
              style={{ backgroundColor: app.color || '#6366f1' }}
            >
              {app.name.charAt(0)}
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{app.name}</h1>
              {hasActiveLicense && (
                <Badge variant={activeLicense?.status === 'TRIAL' ? 'secondary' : 'default'} className="flex items-center gap-1">
                  <Award className="h-3 w-3" />
                  {activeLicense?.status === 'TRIAL' ? 'Trial' : 'Licensed'}
                </Badge>
              )}
            </div>
            {activeLicense && (
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  {activeLicense.plan.name}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Since {formatDate(activeLicense.validFrom)}
                </span>
              </div>
            )}
          </div>
          {hasActiveLicense && (
            <Button asChild size="lg">
              <a href={app.baseUrl} target="_blank" rel="noopener noreferrer">
                Open App
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Plan Selection - Only show if no active license */}
      {!hasActiveLicense && availablePlans.length > 0 && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Choose a Plan
            </CardTitle>
            <CardDescription>
              Select a plan to get access to {app.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {availablePlans.map((plan) => {
                const featuresObj = (plan.features || {}) as Record<string, boolean>
                const features = Object.entries(featuresObj).filter(([, v]) => v === true)
                const formatPrice = () => {
                  if (plan.price === null || plan.price === 0) return 'Free'
                  const f = new Intl.NumberFormat('en-US', { style: 'currency', currency: plan.currency || 'EUR' }).format(plan.price)
                  return plan.billingCycle ? `${f} / ${plan.billingCycle}` : f
                }
                return (
                  <div key={plan.id} className="rounded-lg border p-6 bg-background">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-lg">{plan.name}</h3>
                      {plan.isTrial && (
                        <Badge variant="secondary">
                          <Sparkles className="mr-1 h-3 w-3" />
                          {plan.trialDays}d trial
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{plan.description || 'No description'}</p>
                    <div className="text-3xl font-bold mb-4">{formatPrice()}</div>
                    {features.length > 0 && (
                      <ul className="space-y-2 mb-6">
                        {features.slice(0, 4).map(([k]) => (
                          <li key={k} className="flex items-center gap-2 text-sm">
                            <Check className="h-4 w-4 text-green-500" />
                            <span className="capitalize">{k.replace(/_/g, ' ')}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    <PlanActivateButton
                      appId={app.id}
                      planId={plan.id}
                      isTrial={plan.isTrial}
                      isFree={plan.price === null || plan.price === 0}
                    />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-base">
              {app.description || 'No description available'}
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {app.docsUrl && (
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href={app.docsUrl} target="_blank" rel="noopener noreferrer">
                  <FileText className="mr-2 h-4 w-4" />
                  Documentation
                </a>
              </Button>
            )}
            {app.supportUrl && (
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href={app.supportUrl} target="_blank" rel="noopener noreferrer">
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Support
                </a>
              </Button>
            )}
            {!app.docsUrl && !app.supportUrl && (
              <p className="text-sm text-muted-foreground">No additional links available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Current License Details */}
      {hasActiveLicense && activeLicense && (
        <Card>
          <CardHeader>
            <CardTitle>License Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">Plan</p>
                <p className="font-medium">{activeLicense.plan.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={activeLicense.status === 'TRIAL' ? 'secondary' : 'default'}>
                  {activeLicense.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Since</p>
                <p className="font-medium">{formatDate(activeLicense.validFrom)}</p>
              </div>
              {activeLicense.trialEndsAt && (
                <div>
                  <p className="text-sm text-muted-foreground">Trial Ends</p>
                  <p className="font-medium">{formatDate(activeLicense.trialEndsAt)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function AppDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-16 w-16 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-32" />
        </div>
        <Skeleton className="h-11 w-32" />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    </div>
  )
}

export default async function AppDetailPage({ params }: { params: Promise<{ appSlug: string }> }) {
  const { appSlug } = await params
  return (
    <Container>
      <Suspense fallback={<AppDetailLoading />}>
        <AppDetailContent appSlug={appSlug} />
      </Suspense>
    </Container>
  )
}
