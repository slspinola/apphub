'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Shield, Bell, Globe } from 'lucide-react'

interface SettingsTabProps {
    user: any
    sessionUser: any
}

export function SettingsTab({ user, sessionUser }: SettingsTabProps) {
    const canEdit = sessionUser.id === user.id

    return (
        <div className="grid gap-4 md:grid-cols-2">
            {/* Account Preferences */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Globe className="h-5 w-5" />
                        <CardTitle>Account Preferences</CardTitle>
                    </div>
                    <CardDescription>
                        Language, timezone, and regional settings
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="language">Language</Label>
                        <Select defaultValue="en" disabled={!canEdit}>
                            <SelectTrigger id="language">
                                <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="en">English</SelectItem>
                                <SelectItem value="pt">Português</SelectItem>
                                <SelectItem value="es">Español</SelectItem>
                                <SelectItem value="fr">Français</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="timezone">Timezone</Label>
                        <Select defaultValue="utc" disabled={!canEdit}>
                            <SelectTrigger id="timezone">
                                <SelectValue placeholder="Select timezone" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="utc">UTC</SelectItem>
                                <SelectItem value="america/new_york">America/New York (EST)</SelectItem>
                                <SelectItem value="europe/london">Europe/London (GMT)</SelectItem>
                                <SelectItem value="europe/lisbon">Europe/Lisbon (WET)</SelectItem>
                                <SelectItem value="asia/tokyo">Asia/Tokyo (JST)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="dateFormat">Date Format</Label>
                        <Select defaultValue="mdy" disabled={!canEdit}>
                            <SelectTrigger id="dateFormat">
                                <SelectValue placeholder="Select date format" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="mdy">MM/DD/YYYY</SelectItem>
                                <SelectItem value="dmy">DD/MM/YYYY</SelectItem>
                                <SelectItem value="ymd">YYYY-MM-DD</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {canEdit && (
                        <Button className="w-full">
                            Save Changes
                        </Button>
                    )}
                </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        <CardTitle>Notification Settings</CardTitle>
                    </div>
                    <CardDescription>
                        Manage email and in-app notifications
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="email-notifications">Email Notifications</Label>
                            <p className="text-sm text-muted-foreground">
                                Receive email updates about your account
                            </p>
                        </div>
                        <Switch 
                            id="email-notifications" 
                            defaultChecked 
                            disabled={!canEdit}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="entity-invitations">Entity Invitations</Label>
                            <p className="text-sm text-muted-foreground">
                                Get notified when invited to entities
                            </p>
                        </div>
                        <Switch 
                            id="entity-invitations" 
                            defaultChecked 
                            disabled={!canEdit}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="marketing-emails">Marketing Emails</Label>
                            <p className="text-sm text-muted-foreground">
                                Receive news and product updates
                            </p>
                        </div>
                        <Switch 
                            id="marketing-emails" 
                            disabled={!canEdit}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="security-alerts">Security Alerts</Label>
                            <p className="text-sm text-muted-foreground">
                                Important security notifications
                            </p>
                        </div>
                        <Switch 
                            id="security-alerts" 
                            defaultChecked 
                            disabled={!canEdit}
                        />
                    </div>

                    {canEdit && (
                        <Button className="w-full">
                            Update Preferences
                        </Button>
                    )}
                </CardContent>
            </Card>

            {/* Security Settings */}
            <Card className="md:col-span-2">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        <CardTitle>Security Settings</CardTitle>
                    </div>
                    <CardDescription>
                        Two-factor authentication and login security
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                            <h4 className="font-medium">Two-Factor Authentication</h4>
                            <p className="text-sm text-muted-foreground">
                                Add an extra layer of security to your account
                            </p>
                            <div className="pt-2">
                                <span className="inline-flex items-center gap-2 text-sm">
                                    Status: 
                                    <span className="px-2 py-1 bg-muted rounded text-xs font-medium">
                                        Disabled
                                    </span>
                                </span>
                            </div>
                        </div>
                        {canEdit && (
                            <Button variant="outline">
                                Enable MFA
                            </Button>
                        )}
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                            <h4 className="font-medium">Login Alerts</h4>
                            <p className="text-sm text-muted-foreground">
                                Get notified when someone logs into your account from a new device
                            </p>
                            <div className="pt-2">
                                <span className="inline-flex items-center gap-2 text-sm">
                                    Status: 
                                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded text-xs font-medium">
                                        Enabled
                                    </span>
                                </span>
                            </div>
                        </div>
                        {canEdit && (
                            <Switch defaultChecked disabled={!canEdit} />
                        )}
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                            <h4 className="font-medium">Active Sessions</h4>
                            <p className="text-sm text-muted-foreground">
                                Manage your active login sessions
                            </p>
                            <div className="pt-2">
                                <span className="inline-flex items-center gap-2 text-sm">
                                    Current sessions: 
                                    <span className="px-2 py-1 bg-muted rounded text-xs font-medium">
                                        {user.sessions?.length || 0}
                                    </span>
                                </span>
                            </div>
                        </div>
                        <Button variant="outline" asChild>
                            <a href="#sessions">View Sessions</a>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

