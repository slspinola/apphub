'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProfileTab } from './profile-tab'
import { EntitiesTab } from './entities-tab'
import { AppsTab } from './apps-tab'
import { PermissionsTab } from './permissions-tab'
import { SessionsTab } from './sessions-tab'
import { ActivityTab } from './activity-tab'
import { SettingsTab } from './settings-tab'

interface UserDetailTabsProps {
    user: any
    sessionUser: any
}

export function UserDetailTabs({ user, sessionUser }: UserDetailTabsProps) {
    return (
        <Tabs defaultValue="profile" className="space-y-4">
            <TabsList>
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="entities">Entities</TabsTrigger>
                <TabsTrigger value="apps">Apps</TabsTrigger>
                <TabsTrigger value="permissions">Permissions</TabsTrigger>
                <TabsTrigger value="sessions">Sessions</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4">
                <ProfileTab user={user} sessionUser={sessionUser} />
            </TabsContent>

            <TabsContent value="entities" className="space-y-4">
                <EntitiesTab user={user} sessionUser={sessionUser} />
            </TabsContent>

            <TabsContent value="apps" className="space-y-4">
                <AppsTab user={user} sessionUser={sessionUser} />
            </TabsContent>

            <TabsContent value="permissions" className="space-y-4">
                <PermissionsTab user={user} sessionUser={sessionUser} />
            </TabsContent>

            <TabsContent value="sessions" className="space-y-4">
                <SessionsTab user={user} sessionUser={sessionUser} />
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
                <ActivityTab user={user} sessionUser={sessionUser} />
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
                <SettingsTab user={user} sessionUser={sessionUser} />
            </TabsContent>
        </Tabs>
    )
}

