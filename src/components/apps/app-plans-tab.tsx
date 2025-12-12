'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Loader2, CreditCard, Users, Check, X } from 'lucide-react'
import { createPlan, updatePlan, deletePlan } from '@/features/apps/actions'
import { createPlanSchema, type CreatePlanInput } from '@/features/apps/schemas'
import type { AppWithDetails } from '@/types/apps'
import type { Plan } from '@prisma/client'

interface AppPlansTabProps {
  app: AppWithDetails
}

function PlanDialog({
  appId,
  plan,
  onSuccess,
}: {
  appId: string
  plan?: Plan & { _count: { licenses: number } }
  onSuccess: () => void
}) {
  const [open, setOpen] = useState(false)
  const isEditing = !!plan

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreatePlanInput>({
    resolver: zodResolver(createPlanSchema),
    defaultValues: plan
      ? {
          slug: plan.slug,
          name: plan.name,
          description: plan.description || '',
          price: plan.price ? Number(plan.price) : undefined,
          currency: plan.currency || 'EUR',
          billingCycle: plan.billingCycle as 'monthly' | 'yearly' | 'one-time' | undefined,
          limits: (plan.limits as Record<string, number>) || {},
          features: (plan.features as Record<string, boolean>) || {},
          isPublic: plan.isPublic,
          isTrial: plan.isTrial,
          trialDays: plan.trialDays || undefined,
          sortOrder: plan.sortOrder,
        }
      : {
          slug: '',
          name: '',
          description: '',
          currency: 'EUR',
          billingCycle: 'monthly',
          limits: {},
          features: {},
          isPublic: true,
          isTrial: false,
          sortOrder: 0,
        },
  })

  const isTrial = watch('isTrial')

  const onSubmit = async (data: CreatePlanInput) => {
    try {
      if (isEditing) {
        const { slug, ...updateData } = data
        await updatePlan(appId, plan.id, updateData)
        toast.success('Plan updated')
      } else {
        await createPlan(appId, data)
        toast.success('Plan created')
      }
      setOpen(false)
      reset()
      onSuccess()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save plan')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEditing ? (
          <Button variant="ghost" size="sm">
            <Pencil className="h-4 w-4 mr-1" />
            Edit
          </Button>
        ) : (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Plan
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Plan' : 'Add Plan'}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'Update the plan details' : 'Create a new licensing plan'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  placeholder="basic"
                  disabled={isEditing}
                  {...register('slug')}
                />
                {errors.slug && (
                  <p className="text-sm text-destructive">{errors.slug.message}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="Basic" {...register('name')} />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="For small teams"
                {...register('description')}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  placeholder="49.99"
                  {...register('price', { valueAsNumber: true })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="currency">Currency</Label>
                <Input id="currency" placeholder="EUR" {...register('currency')} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="billingCycle">Billing</Label>
                <Select
                  value={watch('billingCycle') || ''}
                  onValueChange={(v) => setValue('billingCycle', v as 'monthly' | 'yearly' | 'one-time')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                    <SelectItem value="one-time">One-time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isPublic" {...register('isPublic')} />
                <Label htmlFor="isPublic">Publicly visible</Label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isTrial" {...register('isTrial')} />
                <Label htmlFor="isTrial">Trial plan</Label>
              </div>
            </div>

            {isTrial && (
              <div className="grid gap-2">
                <Label htmlFor="trialDays">Trial Duration (days)</Label>
                <Input
                  id="trialDays"
                  type="number"
                  placeholder="14"
                  {...register('trialDays', { valueAsNumber: true })}
                />
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="sortOrder">Sort Order</Label>
              <Input
                id="sortOrder"
                type="number"
                {...register('sortOrder', { valueAsNumber: true })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function AppPlansTab({ app }: AppPlansTabProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDelete = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) return

    setDeleting(planId)
    try {
      await deletePlan(app.id, planId)
      toast.success('Plan deleted')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete plan')
    } finally {
      setDeleting(null)
    }
  }

  const formatPrice = (price: number | null, currency: string | null) => {
    if (price === null) return 'Free'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'EUR',
    }).format(price)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Plans</CardTitle>
              <CardDescription>
                Define licensing plans for this app
              </CardDescription>
            </div>
            <PlanDialog appId={app.id} onSuccess={() => router.refresh()} />
          </div>
        </CardHeader>
        <CardContent>
          {app.plans.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No plans defined yet</p>
              <p className="text-sm text-muted-foreground">
                Add plans to enable licensing for this app
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {app.plans.map((plan) => {
                const limits = plan.limits as Record<string, number>
                const features = plan.features as Record<string, boolean>

                return (
                  <Card key={plan.id} className="relative">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{plan.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">{plan.slug}</p>
                        </div>
                        <div className="flex gap-1">
                          {plan.isTrial && <Badge variant="outline">Trial</Badge>}
                          {!plan.isPublic && <Badge variant="secondary">Hidden</Badge>}
                          {!plan.isActive && <Badge variant="destructive">Inactive</Badge>}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-2xl font-bold">
                          {formatPrice(plan.price ? Number(plan.price) : null, plan.currency)}
                        </p>
                        {plan.billingCycle && (
                          <p className="text-sm text-muted-foreground">/{plan.billingCycle}</p>
                        )}
                        {plan.isTrial && plan.trialDays && (
                          <p className="text-sm text-muted-foreground">
                            {plan.trialDays} day trial
                          </p>
                        )}
                      </div>

                      {plan.description && (
                        <p className="text-sm text-muted-foreground">{plan.description}</p>
                      )}

                      {Object.keys(limits).length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground uppercase">
                            Limits
                          </p>
                          {Object.entries(limits).map(([key, value]) => (
                            <div key={key} className="flex justify-between text-sm">
                              <span>{key}</span>
                              <span className="font-medium">
                                {value === -1 ? 'Unlimited' : value}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {Object.keys(features).length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground uppercase">
                            Features
                          </p>
                          {Object.entries(features).map(([key, enabled]) => (
                            <div key={key} className="flex items-center gap-2 text-sm">
                              {enabled ? (
                                <Check className="h-4 w-4 text-emerald-500" />
                              ) : (
                                <X className="h-4 w-4 text-muted-foreground" />
                              )}
                              <span className={!enabled ? 'text-muted-foreground' : ''}>
                                {key}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
                        <Users className="h-4 w-4" />
                        <span>{plan._count.licenses} licenses</span>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <PlanDialog appId={app.id} plan={plan} onSuccess={() => router.refresh()} />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(plan.id)}
                          disabled={deleting === plan.id || plan._count.licenses > 0}
                        >
                          {deleting === plan.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 mr-1" />
                          )}
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

