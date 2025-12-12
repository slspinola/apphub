'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2, Trash2 } from 'lucide-react'
import { updateApp, changeAppStatus, deleteApp } from '@/features/apps/actions'
import { updateAppSchema, type UpdateAppInput } from '@/features/apps/schemas'
import { AppStatusBadge } from './app-status-badge'
import { ColorPicker } from '@/components/ui/color-picker'
import { ImageUpload } from '@/components/ui/image-upload'
import type { AppWithDetails } from '@/types/apps'
import type { AppStatus } from '@prisma/client'

interface AppGeneralTabProps {
  app: AppWithDetails
}

const APP_STATUSES: { value: AppStatus; label: string; description: string }[] = [
  { value: 'DRAFT', label: 'Draft', description: 'In development, not visible' },
  { value: 'BETA', label: 'Beta', description: 'In testing, limited visibility' },
  { value: 'ACTIVE', label: 'Active', description: 'Active and available' },
  { value: 'SUSPENDED', label: 'Suspended', description: 'Temporarily suspended' },
  { value: 'DEPRECATED', label: 'Deprecated', description: 'Marked for discontinuation' },
  { value: 'ARCHIVED', label: 'Archived', description: 'Archived, non-functional' },
]

export function AppGeneralTab({ app }: AppGeneralTabProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UpdateAppInput>({
    resolver: zodResolver(updateAppSchema),
    defaultValues: {
      name: app.name,
      description: app.description || '',
      icon: app.icon || '',
      color: app.color || '#6366f1',
      baseUrl: app.baseUrl,
      loginUrl: app.loginUrl || '',
      docsUrl: app.docsUrl || '',
      supportUrl: app.supportUrl || '',
      isPublic: app.isPublic,
    },
  })

  const onSubmit = async (data: UpdateAppInput) => {
    try {
      await updateApp(app.id, data)
      toast.success('App updated successfully')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update app')
    }
  }

  const handleStatusChange = async (status: AppStatus) => {
    try {
      await changeAppStatus(app.id, { status })
      toast.success(`App status changed to ${status.toLowerCase()}`)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to change status')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this app? This action cannot be undone.')) {
      return
    }

    setIsDeleting(true)
    try {
      await deleteApp(app.id)
      toast.success('App deleted successfully')
      router.push('/apps')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete app')
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle>App Status</CardTitle>
          <CardDescription>
            Control the visibility and availability of this app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium">Current Status:</span>
                <AppStatusBadge status={app.status} />
              </div>
              {app.publishedAt && (
                <p className="text-sm text-muted-foreground">
                  Published on {new Date(app.publishedAt).toLocaleDateString()}
                </p>
              )}
            </div>
            <Select value={app.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Change status" />
              </SelectTrigger>
              <SelectContent>
                {APP_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    <div>
                      <div>{status.label}</div>
                      <div className="text-xs text-muted-foreground">{status.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* General Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>General Information</CardTitle>
          <CardDescription>
            Basic information about this app
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" {...register('name')} />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input value={app.slug} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">
                  Slug cannot be changed after creation
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" {...register('description')} />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>App Icon</Label>
                <Controller
                  name="icon"
                  control={control}
                  render={({ field }) => (
                    <ImageUpload
                      value={field.value || ''}
                      onChange={field.onChange}
                      bucket="app-icons"
                      pathPrefix={app.slug}
                    />
                  )}
                />
                {errors.icon && (
                  <p className="text-sm text-destructive">{errors.icon.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Primary Color</Label>
                <Controller
                  name="color"
                  control={control}
                  render={({ field }) => (
                    <ColorPicker
                      value={field.value || '#6366f1'}
                      onChange={field.onChange}
                    />
                  )}
                />
                {errors.color && (
                  <p className="text-sm text-destructive">{errors.color.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="baseUrl">Base URL</Label>
              <Input id="baseUrl" type="url" {...register('baseUrl')} />
              {errors.baseUrl && (
                <p className="text-sm text-destructive">{errors.baseUrl.message}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="loginUrl">Login URL</Label>
                <Input id="loginUrl" type="url" {...register('loginUrl')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="docsUrl">Documentation URL</Label>
                <Input id="docsUrl" type="url" {...register('docsUrl')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supportUrl">Support URL</Label>
                <Input id="supportUrl" type="url" {...register('supportUrl')} />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting || !isDirty}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible and destructive actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Delete this app</p>
              <p className="text-sm text-muted-foreground">
                Once deleted, all data associated with this app will be permanently removed.
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete App
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

