// ============================================================================
// OAuth Authorization Page - Consent Screen (if needed in future)
// ============================================================================
// Note: Currently, internal apps auto-approve in route.ts
// This page can be used for external apps requiring explicit consent

import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Shield, User, Building2, Key } from 'lucide-react'

interface AuthorizePageProps {
  searchParams: Promise<{
    client_id?: string
    redirect_uri?: string
    scope?: string
    state?: string
    code_challenge?: string
    code_challenge_method?: string
  }>
}

export default async function AuthorizePage({ searchParams }: AuthorizePageProps) {
  const params = await searchParams
  const session = await auth()

  if (!session?.user) {
    redirect(`/login?callbackUrl=/oauth/authorize?${new URLSearchParams(params as Record<string, string>).toString()}`)
  }

  const { client_id, redirect_uri, scope = 'openid', state } = params

  if (!client_id || !redirect_uri) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Invalid Request</CardTitle>
            <CardDescription>Missing required parameters</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const client = await prisma.oAuthClient.findUnique({
    where: { clientId: client_id },
    include: { app: true },
  })

  if (!client) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Unknown Application</CardTitle>
            <CardDescription>The application requesting access is not registered</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const scopes = scope.split(' ')
  const scopeDescriptions: Record<string, { icon: React.ReactNode; label: string; description: string }> = {
    openid: { icon: <Key className="h-4 w-4" />, label: 'OpenID', description: 'Verify your identity' },
    profile: { icon: <User className="h-4 w-4" />, label: 'Profile', description: 'Access your name and profile picture' },
    email: { icon: <User className="h-4 w-4" />, label: 'Email', description: 'Access your email address' },
    organization: { icon: <Building2 className="h-4 w-4" />, label: 'Organization', description: 'Access your organization info' },
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            {client.app.icon ? (
              <span className="text-3xl">{client.app.icon}</span>
            ) : (
              <Shield className="h-8 w-8 text-primary" />
            )}
          </div>
          <CardTitle>{client.app.name}</CardTitle>
          <CardDescription>
            wants to access your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border p-4">
            <p className="mb-3 text-sm font-medium">This will allow {client.app.name} to:</p>
            <ul className="space-y-2">
              {scopes.map((s) => {
                const info = scopeDescriptions[s]
                if (!info) return null
                return (
                  <li key={s} className="flex items-center gap-3 text-sm">
                    <span className="text-muted-foreground">{info.icon}</span>
                    <span>{info.description}</span>
                  </li>
                )
              })}
            </ul>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>Signed in as {session.user.email}</span>
          </div>
        </CardContent>
        <CardFooter className="flex gap-3">
          <form action={redirect_uri} method="get" className="flex-1">
            <input type="hidden" name="error" value="access_denied" />
            {state && <input type="hidden" name="state" value={state} />}
            <Button type="submit" variant="outline" className="w-full">
              Deny
            </Button>
          </form>
          <form action="/oauth/authorize" method="get" className="flex-1">
            <input type="hidden" name="client_id" value={client_id} />
            <input type="hidden" name="redirect_uri" value={redirect_uri} />
            <input type="hidden" name="response_type" value="code" />
            <input type="hidden" name="scope" value={scope} />
            {state && <input type="hidden" name="state" value={state} />}
            {params.code_challenge && <input type="hidden" name="code_challenge" value={params.code_challenge} />}
            {params.code_challenge_method && <input type="hidden" name="code_challenge_method" value={params.code_challenge_method} />}
            <Button type="submit" className="w-full">
              Allow
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  )
}
