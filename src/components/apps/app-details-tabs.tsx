'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AppGeneralTab } from './app-general-tab'
import { AppOAuthTab } from './app-oauth-tab'
import { AppPermissionsTab } from './app-permissions-tab'
import { AppPlansTab } from './app-plans-tab'
import { AppWebhooksTab } from './app-webhooks-tab'
import { AppEntitiesTab } from './app-entities-tab'
import { Settings, Key, Shield, CreditCard, Webhook, Building2 } from 'lucide-react'
import type { AppWithDetails, OAuthConfig } from '@/types/apps'

interface AppDetailsTabsProps {
  app: AppWithDetails
  oauthConfig: OAuthConfig | null
}

export function AppDetailsTabs({ app, oauthConfig }: AppDetailsTabsProps) {
  return (
    <Tabs defaultValue="general" className="space-y-6">
      <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid">
        <TabsTrigger value="general" className="gap-2">
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">General</span>
        </TabsTrigger>
        <TabsTrigger value="oauth" className="gap-2">
          <Key className="h-4 w-4" />
          <span className="hidden sm:inline">OAuth</span>
        </TabsTrigger>
        <TabsTrigger value="permissions" className="gap-2">
          <Shield className="h-4 w-4" />
          <span className="hidden sm:inline">Permissions</span>
        </TabsTrigger>
        <TabsTrigger value="plans" className="gap-2">
          <CreditCard className="h-4 w-4" />
          <span className="hidden sm:inline">Plans</span>
        </TabsTrigger>
        <TabsTrigger value="entities" className="gap-2">
          <Building2 className="h-4 w-4" />
          <span className="hidden sm:inline">Entities</span>
        </TabsTrigger>
        <TabsTrigger value="webhooks" className="gap-2">
          <Webhook className="h-4 w-4" />
          <span className="hidden sm:inline">Webhooks</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="general" className="space-y-4">
        <AppGeneralTab app={app} />
      </TabsContent>

      <TabsContent value="oauth" className="space-y-4">
        <AppOAuthTab app={app} oauthConfig={oauthConfig} />
      </TabsContent>

      <TabsContent value="permissions" className="space-y-4">
        <AppPermissionsTab app={app} />
      </TabsContent>

      <TabsContent value="plans" className="space-y-4">
        <AppPlansTab app={app} />
      </TabsContent>

      <TabsContent value="entities" className="space-y-4">
        <AppEntitiesTab app={app} />
      </TabsContent>

      <TabsContent value="webhooks" className="space-y-4">
        <AppWebhooksTab app={app} />
      </TabsContent>
    </Tabs>
  )
}

