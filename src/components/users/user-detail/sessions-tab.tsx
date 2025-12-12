'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Monitor, Smartphone, Tablet, AlertTriangle } from 'lucide-react'
import { useState } from 'react'
import { revokeUserSession, revokeAllUserSessions } from '@/features/users/actions'
import { toast } from 'sonner'
import { isSystemAdminRole } from '@/lib/authorization'

interface SessionsTabProps {
    user: any
    sessionUser: any
}

export function SessionsTab({ user, sessionUser }: SessionsTabProps) {
    const [sessions, setSessions] = useState(user.sessions || [])
    const [revoking, setRevoking] = useState<string | null>(null)
    const canManage = sessionUser.id === user.id || isSystemAdminRole(sessionUser.role)

    const getDeviceIcon = (userAgent: string = '') => {
        if (userAgent.toLowerCase().includes('mobile') || userAgent.toLowerCase().includes('iphone')) {
            return <Smartphone className="h-5 w-5" />
        }
        if (userAgent.toLowerCase().includes('tablet') || userAgent.toLowerCase().includes('ipad')) {
            return <Tablet className="h-5 w-5" />
        }
        return <Monitor className="h-5 w-5" />
    }

    const getDeviceName = (userAgent: string = '') => {
        if (userAgent.toLowerCase().includes('chrome')) return 'Chrome'
        if (userAgent.toLowerCase().includes('firefox')) return 'Firefox'
        if (userAgent.toLowerCase().includes('safari')) return 'Safari'
        if (userAgent.toLowerCase().includes('edge')) return 'Edge'
        return 'Unknown Browser'
    }

    const getPlatform = (userAgent: string = '') => {
        if (userAgent.toLowerCase().includes('windows')) return 'on Windows'
        if (userAgent.toLowerCase().includes('mac')) return 'on macOS'
        if (userAgent.toLowerCase().includes('linux')) return 'on Linux'
        if (userAgent.toLowerCase().includes('android')) return 'on Android'
        if (userAgent.toLowerCase().includes('iphone') || userAgent.toLowerCase().includes('ipad')) return 'on iOS'
        return ''
    }

    const getTimeAgo = (date: Date | string) => {
        const now = new Date()
        const then = new Date(date)
        const seconds = Math.floor((now.getTime() - then.getTime()) / 1000)

        if (seconds < 60) return `${seconds} seconds ago`
        if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
        return `${Math.floor(seconds / 86400)} days ago`
    }

    const handleRevokeSession = async (sessionToken: string) => {
        setRevoking(sessionToken)
        const result = await revokeUserSession(sessionToken)
        if (result.success) {
            setSessions(sessions.filter((s: any) => s.sessionToken !== sessionToken))
            toast.success('Session revoked successfully')
        } else {
            toast.error(result.error)
        }
        setRevoking(null)
    }

    const handleRevokeAll = async () => {
        if (!confirm('Are you sure you want to revoke all sessions? The user will be logged out from all devices.')) {
            return
        }
        
        setRevoking('all')
        const result = await revokeAllUserSessions(user.id)
        if (result.success) {
            setSessions([])
            toast.success('All sessions revoked successfully')
        } else {
            toast.error(result.error)
        }
        setRevoking(null)
    }

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Active Sessions</CardTitle>
                            <CardDescription>
                                Manage active login sessions across all devices
                            </CardDescription>
                        </div>
                        {canManage && sessions.length > 0 && (
                            <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={handleRevokeAll}
                                disabled={revoking === 'all'}
                            >
                                <AlertTriangle className="mr-2 h-4 w-4" />
                                Revoke All Sessions
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {sessions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="rounded-full bg-muted p-3 mb-4">
                                <Monitor className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold mb-1">No active sessions</h3>
                            <p className="text-sm text-muted-foreground">
                                This user has no active sessions
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <p className="text-sm text-muted-foreground mb-4">
                                Current Sessions: <span className="font-semibold">{sessions.length}</span>
                            </p>
                            
                            {sessions.map((session: any, idx: number) => (
                                <Card key={session.sessionToken} className="border-2">
                                    <CardContent className="pt-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-3 flex-1">
                                                <div className="rounded-lg bg-primary/10 p-2">
                                                    {getDeviceIcon('')}
                                                </div>
                                                <div className="space-y-1 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-semibold">
                                                            {getDeviceName('')} {getPlatform('')}
                                                        </h4>
                                                        {idx === 0 && (
                                                            <Badge variant="default" className="text-xs">
                                                                CURRENT SESSION
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        Last Active: {getTimeAgo(session.updatedAt)}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Expires: {new Date(session.expires).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            {canManage && (
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => handleRevokeSession(session.sessionToken)}
                                                    disabled={revoking === session.sessionToken}
                                                >
                                                    {revoking === session.sessionToken ? 'Revoking...' : 'Revoke'}
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {sessions.length > 0 && (
                <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
                    <CardContent className="pt-6">
                        <div className="flex gap-2">
                            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm">
                                <p className="font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                                    Security Notice
                                </p>
                                <p className="text-yellow-700 dark:text-yellow-300">
                                    Revoking a session will immediately log the user out from that device. 
                                    They will need to log in again to regain access.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

