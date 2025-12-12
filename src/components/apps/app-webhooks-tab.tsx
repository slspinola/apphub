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
import { Plus, Pencil, Trash2, Loader2, Webhook, Play, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { createWebhook, updateWebhook, deleteWebhook, testWebhook } from '@/features/apps/actions'
import { createWebhookSchema, type CreateWebhookInput } from '@/features/apps/schemas'
import { WEBHOOK_EVENTS } from '@/types/apps'
import type { AppWithDetails } from '@/types/apps'
import type { AppWebhook } from '@prisma/client'

interface AppWebhooksTabProps {
  app: AppWithDetails
}

function WebhookDialog({
  appId,
  webhook,
  onSuccess,
}: {
  appId: string
  webhook?: AppWebhook
  onSuccess: (secret?: string) => void
}) {
  const [open, setOpen] = useState(false)
  const isEditing = !!webhook

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateWebhookInput>({
    resolver: zodResolver(createWebhookSchema),
    defaultValues: webhook
      ? {
          url: webhook.url,
          events: webhook.events as typeof WEBHOOK_EVENTS[number][],
          isActive: webhook.isActive,
        }
      : {
          url: '',
          events: [],
          isActive: true,
        },
  })

  const selectedEvents = watch('events')

  const toggleEvent = (event: typeof WEBHOOK_EVENTS[number]) => {
    const current = selectedEvents || []
    if (current.includes(event)) {
      setValue('events', current.filter((e) => e !== event), { shouldDirty: true })
    } else {
      setValue('events', [...current, event], { shouldDirty: true })
    }
  }

  const onSubmit = async (data: CreateWebhookInput) => {
    try {
      if (isEditing) {
        await updateWebhook(appId, webhook.id, data)
        toast.success('Webhook updated')
        onSuccess()
      } else {
        const result = await createWebhook(appId, data)
        toast.success('Webhook created')
        onSuccess(result.secret)
      }
      setOpen(false)
      reset()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save webhook')
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
            Add Webhook
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Webhook' : 'Add Webhook'}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Update the webhook configuration'
                : 'Create a new webhook to receive event notifications'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid gap-2">
              <Label htmlFor="url">Webhook URL</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://yourapp.com/api/webhooks/apphub"
                {...register('url')}
              />
              {errors.url && (
                <p className="text-sm text-destructive">{errors.url.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label>Events</Label>
              <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto border rounded-md p-3">
                {WEBHOOK_EVENTS.map((event) => (
                  <label key={event} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedEvents?.includes(event)}
                      onChange={() => toggleEvent(event)}
                      className="rounded"
                    />
                    <span className="text-sm">{event}</span>
                  </label>
                ))}
              </div>
              {errors.events && (
                <p className="text-sm text-destructive">{errors.events.message}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="isActive" {...register('isActive')} />
              <Label htmlFor="isActive">Active</Label>
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

export function AppWebhooksTab({ app }: AppWebhooksTabProps) {
  const router = useRouter()
  const [newSecret, setNewSecret] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [testing, setTesting] = useState<string | null>(null)

  const handleDelete = async (webhookId: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return

    setDeleting(webhookId)
    try {
      await deleteWebhook(app.id, webhookId)
      toast.success('Webhook deleted')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete webhook')
    } finally {
      setDeleting(null)
    }
  }

  const handleTest = async (webhookId: string) => {
    setTesting(webhookId)
    try {
      const result = await testWebhook(app.id, webhookId)
      if (result.success) {
        toast.success(`Webhook test successful (${result.statusCode})`)
      } else {
        toast.error(`Webhook test failed: ${result.error || `Status ${result.statusCode}`}`)
      }
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to test webhook')
    } finally {
      setTesting(null)
    }
  }

  const handleSuccess = (secret?: string) => {
    if (secret) {
      setNewSecret(secret)
    }
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {newSecret && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="flex-1 space-y-2">
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  Save your webhook secret now!
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Use this secret to verify webhook signatures. You won&apos;t see it again.
                </p>
                <code className="block p-2 bg-white dark:bg-amber-900 rounded border text-sm font-mono break-all">
                  {newSecret}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(newSecret)
                    toast.success('Secret copied to clipboard')
                  }}
                >
                  Copy to Clipboard
                </Button>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setNewSecret(null)}>
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Webhooks</CardTitle>
              <CardDescription>
                Receive event notifications when things happen in AppHub
              </CardDescription>
            </div>
            <WebhookDialog appId={app.id} onSuccess={handleSuccess} />
          </div>
        </CardHeader>
        <CardContent>
          {app.webhooks.length === 0 ? (
            <div className="text-center py-8">
              <Webhook className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No webhooks configured</p>
              <p className="text-sm text-muted-foreground">
                Add webhooks to receive event notifications
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>URL</TableHead>
                  <TableHead>Events</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Triggered</TableHead>
                  <TableHead className="w-[150px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {app.webhooks.map((webhook) => (
                  <TableRow key={webhook.id}>
                    <TableCell className="font-mono text-sm max-w-[200px] truncate">
                      {webhook.url}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {webhook.events.slice(0, 2).map((event) => (
                          <Badge key={event} variant="secondary" className="text-xs">
                            {event}
                          </Badge>
                        ))}
                        {webhook.events.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{webhook.events.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {webhook.isActive ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-emerald-500" />
                            <span className="text-sm">Active</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Inactive</span>
                          </>
                        )}
                        {webhook.failureCount > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {webhook.failureCount} failures
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {webhook.lastTriggeredAt ? (
                        <div>
                          <p className="text-sm">
                            {new Date(webhook.lastTriggeredAt).toLocaleDateString()}
                          </p>
                          {webhook.lastStatus && (
                            <p className="text-xs text-muted-foreground">
                              Status: {webhook.lastStatus}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Never</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleTest(webhook.id)}
                          disabled={testing === webhook.id}
                          title="Test webhook"
                        >
                          {testing === webhook.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <WebhookDialog
                          appId={app.id}
                          webhook={webhook}
                          onSuccess={handleSuccess}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(webhook.id)}
                          disabled={deleting === webhook.id}
                        >
                          {deleting === webhook.id ? (
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}

