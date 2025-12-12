'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Copy, RefreshCw, Plus, X, Loader2, Key, AlertTriangle } from 'lucide-react'
import { generateOAuthCredentials, updateOAuthConfig } from '@/features/apps/actions'
import { oauthConfigSchema, type OAuthConfigInput } from '@/features/apps/schemas'
import type { AppWithDetails, OAuthConfig } from '@/types/apps'

interface AppOAuthTabProps {
  app: AppWithDetails
  oauthConfig: OAuthConfig | null
}

export function AppOAuthTab({ app, oauthConfig }: AppOAuthTabProps) {
  const router = useRouter()
  const [newSecret, setNewSecret] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [newUri, setNewUri] = useState('')

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<OAuthConfigInput>({
    resolver: zodResolver(oauthConfigSchema),
    defaultValues: {
      redirectUris: oauthConfig?.redirectUris || [],
      tokenLifetime: oauthConfig?.tokenLifetime || 3600,
      refreshTokenLifetime: oauthConfig?.refreshTokenLifetime || 604800,
    },
  })

  const redirectUris = watch('redirectUris')

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

  const handleGenerateCredentials = async (regenerate: boolean = false) => {
    if (regenerate && !confirm('Are you sure you want to regenerate the client secret? Existing integrations will stop working.')) {
      return
    }

    setIsGenerating(true)
    try {
      const result = await generateOAuthCredentials(app.id, regenerate)
      setNewSecret(result.clientSecret)
      toast.success(regenerate ? 'Client secret regenerated' : 'OAuth credentials generated')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate credentials')
    } finally {
      setIsGenerating(false)
    }
  }

  const addRedirectUri = () => {
    if (!newUri.trim()) return
    try {
      new URL(newUri) // Validate URL
      setValue('redirectUris', [...redirectUris, newUri.trim()], { shouldDirty: true })
      setNewUri('')
    } catch {
      toast.error('Invalid URL format')
    }
  }

  const removeRedirectUri = (index: number) => {
    setValue(
      'redirectUris',
      redirectUris.filter((_, i) => i !== index),
      { shouldDirty: true }
    )
  }

  const onSubmit = async (data: OAuthConfigInput) => {
    try {
      await updateOAuthConfig(app.id, data)
      toast.success('OAuth configuration updated')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update configuration')
    }
  }

  if (!oauthConfig) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>OAuth Credentials</CardTitle>
          <CardDescription>
            Generate OAuth credentials to enable authentication for this app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 p-4 rounded-lg bg-muted">
            <Key className="h-8 w-8 text-muted-foreground" />
            <div className="flex-1">
              <p className="font-medium">No credentials generated</p>
              <p className="text-sm text-muted-foreground">
                Generate OAuth credentials to allow this app to authenticate users through AppHub
              </p>
            </div>
            <Button onClick={() => handleGenerateCredentials(false)} disabled={isGenerating}>
              {isGenerating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Generate Credentials
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Credentials Card */}
      <Card>
        <CardHeader>
          <CardTitle>OAuth Credentials</CardTitle>
          <CardDescription>
            Client credentials for OAuth 2.0 authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {newSecret && (
            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-950 dark:border-amber-800">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <p className="font-medium text-amber-800 dark:text-amber-200">
                    Save your client secret now!
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    This is the only time you will see the complete client secret. Copy it and store it securely.
                  </p>
                  <div className="flex items-center gap-2 p-2 bg-white dark:bg-amber-900 rounded border border-amber-300 dark:border-amber-700">
                    <code className="flex-1 text-sm font-mono break-all">{newSecret}</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(newSecret, 'Client secret')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Client ID</Label>
              <div className="flex items-center gap-2">
                <Input value={oauthConfig.clientId} readOnly className="font-mono bg-muted" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(oauthConfig.clientId, 'Client ID')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Client Secret</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={oauthConfig.clientSecretHint}
                  readOnly
                  className="font-mono bg-muted"
                />
                <Button
                  variant="outline"
                  onClick={() => handleGenerateCredentials(true)}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Regenerate
                </Button>
              </div>
              {oauthConfig.secretRotatedAt && (
                <p className="text-xs text-muted-foreground">
                  Last rotated: {new Date(oauthConfig.secretRotatedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle>OAuth Configuration</CardTitle>
          <CardDescription>
            Configure redirect URIs and token settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <Label>Redirect URIs</Label>
              <div className="space-y-2">
                {redirectUris.map((uri, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input value={uri} readOnly className="font-mono text-sm" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRedirectUri(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="https://yourapp.com/api/auth/callback/apphub"
                    value={newUri}
                    onChange={(e) => setNewUri(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addRedirectUri())}
                  />
                  <Button type="button" variant="outline" onClick={addRedirectUri}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {errors.redirectUris && (
                <p className="text-sm text-destructive">{errors.redirectUris.message}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tokenLifetime">Access Token Lifetime (seconds)</Label>
                <Input
                  id="tokenLifetime"
                  type="number"
                  {...register('tokenLifetime', { valueAsNumber: true })}
                />
                <p className="text-xs text-muted-foreground">
                  Default: 3600 (1 hour)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="refreshTokenLifetime">Refresh Token Lifetime (seconds)</Label>
                <Input
                  id="refreshTokenLifetime"
                  type="number"
                  {...register('refreshTokenLifetime', { valueAsNumber: true })}
                />
                <p className="text-xs text-muted-foreground">
                  Default: 604800 (7 days)
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting || !isDirty}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Configuration
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

