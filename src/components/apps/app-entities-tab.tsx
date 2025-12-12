'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getEntitiesForApp, adminRevokeLicense } from '@/features/apps/actions'
import { AssignLicenseDialog } from './grant-entity-access-dialog'
import { Building2, Award, Calendar, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { App } from '@prisma/client'

interface AppEntitiesTabProps {
  app: App
}

interface EntityWithLicense {
  id: string
  name: string
  slug: string
  license: {
    id: string
    status: string
    validFrom: string
    validUntil: string | null
    trialEndsAt: string | null
    cancelledAt: string | null
    plan: { id: string; name: string; slug: string }
  }
}

interface SerializedPlan {
  id: string
  slug: string
  name: string
  price: number | null
  isActive: boolean
}

export function AppEntitiesTab({ app }: AppEntitiesTabProps) {
  const [entitiesWithLicenses, setEntitiesWithLicenses] = useState<EntityWithLicense[]>([])
  const [allEntities, setAllEntities] = useState<{ id: string; name: string; slug: string }[]>([])
  const [plans, setPlans] = useState<SerializedPlan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [revokingId, setRevokingId] = useState<string | null>(null)

  const loadEntities = async () => {
    try {
      setIsLoading(true)
      const data = await getEntitiesForApp(app.id)
      setEntitiesWithLicenses(data.entitiesWithLicenses)
      setAllEntities(data.allEntities)
      setPlans(data.plans)
    } catch (error) {
      toast.error('Failed to load entities')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadEntities()
  }, [app.id])

  const handleRevokeLicense = async (entityId: string) => {
    try {
      setRevokingId(entityId)
      await adminRevokeLicense(entityId, app.id)
      toast.success('License has been revoked successfully')
      loadEntities()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to revoke license')
    } finally {
      setRevokingId(null)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Get entities that don't have an active/trial license
  const availableEntities = allEntities.filter(
    (entity) => !entitiesWithLicenses.some((e) => e.id === entity.id && ['ACTIVE', 'TRIAL'].includes(e.license.status))
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Separate active/trial licenses from cancelled/expired ones
  const activeLicenses = entitiesWithLicenses.filter(e => ['ACTIVE', 'TRIAL'].includes(e.license.status))
  const inactiveLicenses = entitiesWithLicenses.filter(e => !['ACTIVE', 'TRIAL'].includes(e.license.status))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Entity Licenses</h3>
          <p className="text-sm text-muted-foreground">
            Manage which entities can access this application via licenses
          </p>
        </div>
        <AssignLicenseDialog
          appId={app.id}
          availableEntities={availableEntities}
          plans={plans}
          onSuccess={loadEntities}
        />
      </div>

      {/* Active Licensed Entities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Active Licenses
          </CardTitle>
          <CardDescription>
            Entities with active or trial licenses for this app
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeLicenses.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No entities have active licenses for this app
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Entity</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Since</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeLicenses.map((entity) => (
                  <TableRow key={entity.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {entity.name}
                      </div>
                    </TableCell>
                    <TableCell>{entity.license.plan.name}</TableCell>
                    <TableCell>
                      <Badge variant={entity.license.status === 'ACTIVE' ? 'default' : 'secondary'}>
                        {entity.license.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDate(entity.license.validFrom)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevokeLicense(entity.id)}
                        disabled={revokingId === entity.id}
                      >
                        {revokingId === entity.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                        <span className="ml-1">Revoke</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Inactive/Cancelled Licenses (History) */}
      {inactiveLicenses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">License History</CardTitle>
            <CardDescription>
              Cancelled or expired licenses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Entity</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Originally Assigned</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inactiveLicenses.map((entity) => (
                  <TableRow key={entity.id} className="opacity-60">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {entity.name}
                      </div>
                    </TableCell>
                    <TableCell>{entity.license.plan.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{entity.license.status}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(entity.license.validFrom)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
