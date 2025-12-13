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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Loader2, Shield } from 'lucide-react'
import { createPermission, updatePermission, deletePermission } from '@/features/apps/actions'
import { createPermissionSchema, type CreatePermissionInput } from '@/features/apps/schemas'
import type { AppWithDetails } from '@/types/apps'
import type { Permission } from '@prisma/client'

interface AppPermissionsTabProps {
  app: AppWithDetails
}

function PermissionDialog({
  appId,
  permission,
  onSuccess,
}: {
  appId: string
  permission?: Permission
  onSuccess: () => void
}) {
  const [open, setOpen] = useState(false)
  const isEditing = !!permission

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreatePermissionInput>({
    resolver: zodResolver(createPermissionSchema) as any,
    defaultValues: permission
      ? {
          slug: permission.slug,
          name: permission.name,
          description: permission.description || '',
          resource: permission.resource,
          action: permission.action,
          groupName: permission.groupName || '',
          sortOrder: permission.sortOrder,
          isDefault: permission.isDefault,
        }
      : {
          slug: '',
          name: '',
          description: '',
          resource: '',
          action: 'read',
          groupName: '',
          sortOrder: 0,
          isDefault: false,
        },
  })

  const onSubmit = async (data: CreatePermissionInput) => {
    try {
      if (isEditing) {
        const { slug, ...updateData } = data
        await updatePermission(appId, permission.id, updateData)
        toast.success('Permission updated')
      } else {
        await createPermission(appId, data)
        toast.success('Permission created')
      }
      setOpen(false)
      reset()
      onSuccess()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save permission')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEditing ? (
          <Button variant="ghost" size="icon">
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Permission
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Permission' : 'Add Permission'}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Update the permission details'
                : 'Create a new permission for this app'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                placeholder="vehicles:read"
                disabled={isEditing}
                {...register('slug')}
              />
              {errors.slug && (
                <p className="text-sm text-destructive">{errors.slug.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="View Vehicles" {...register('name')} />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Allows viewing vehicle list"
                {...register('description')}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="resource">Resource</Label>
                <Input id="resource" placeholder="vehicles" {...register('resource')} />
                {errors.resource && (
                  <p className="text-sm text-destructive">{errors.resource.message}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="action">Action</Label>
                <Input id="action" placeholder="read" {...register('action')} />
                {errors.action && (
                  <p className="text-sm text-destructive">{errors.action.message}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="groupName">Group</Label>
                <Input id="groupName" placeholder="Vehicles" {...register('groupName')} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sortOrder">Sort Order</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  {...register('sortOrder', { valueAsNumber: true })}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isDefault" {...register('isDefault')} />
              <Label htmlFor="isDefault">Default permission (included in new roles)</Label>
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

export function AppPermissionsTab({ app }: AppPermissionsTabProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDelete = async (permissionId: string) => {
    if (!confirm('Are you sure you want to delete this permission?')) return

    setDeleting(permissionId)
    try {
      await deletePermission(app.id, permissionId)
      toast.success('Permission deleted')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete permission')
    } finally {
      setDeleting(null)
    }
  }

  // Group permissions by groupName
  const groupedPermissions = app.permissions.reduce((acc, permission) => {
    const group = permission.groupName || 'Other'
    if (!acc[group]) acc[group] = []
    acc[group].push(permission)
    return acc
  }, {} as Record<string, Permission[]>)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Permissions</CardTitle>
              <CardDescription>
                Define permissions that this app provides
              </CardDescription>
            </div>
            <PermissionDialog appId={app.id} onSuccess={() => router.refresh()} />
          </div>
        </CardHeader>
        <CardContent>
          {app.permissions.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No permissions defined yet</p>
              <p className="text-sm text-muted-foreground">
                Add permissions to control access to app features
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedPermissions).map(([group, permissions]) => (
                <div key={group}>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    {group}
                    <Badge variant="secondary">{permissions.length}</Badge>
                  </h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Slug</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Resource</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {permissions.map((permission) => (
                        <TableRow key={permission.id}>
                          <TableCell className="font-mono text-sm">
                            {permission.slug}
                          </TableCell>
                          <TableCell>
                            <div>
                              {permission.name}
                              {permission.isDefault && (
                                <Badge variant="outline" className="ml-2">
                                  Default
                                </Badge>
                              )}
                            </div>
                            {permission.description && (
                              <p className="text-xs text-muted-foreground">
                                {permission.description}
                              </p>
                            )}
                          </TableCell>
                          <TableCell>{permission.resource}</TableCell>
                          <TableCell>{permission.action}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <PermissionDialog
                                appId={app.id}
                                permission={permission}
                                onSuccess={() => router.refresh()}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(permission.id)}
                                disabled={deleting === permission.id || permission.isSystem}
                              >
                                {deleting === permission.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

