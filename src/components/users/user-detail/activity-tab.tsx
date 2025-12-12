'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { 
    Activity, 
    Key, 
    UserPlus, 
    UserMinus, 
    LogIn, 
    Shield,
    Search,
    Download
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { getUserActivityLog } from '@/features/users/actions'

interface ActivityTabProps {
    user: any
    sessionUser: any
}

const ACTION_ICONS: Record<string, any> = {
    'login': LogIn,
    'password_reset': Key,
    'entity_access_added': UserPlus,
    'entity_access_removed': UserMinus,
    'entity_role_changed': Shield,
    'app_scope_changed': Activity,
    'session_revoked': Activity,
    'impersonation_started': Shield,
    'impersonation_ended': Shield,
}

const ACTION_LABELS: Record<string, string> = {
    'login': 'Login successful',
    'password_reset': 'Password reset',
    'entity_access_added': 'Added to entity',
    'entity_access_removed': 'Removed from entity',
    'entity_role_changed': 'Entity role changed',
    'app_scope_changed': 'App scope changed',
    'session_revoked': 'Session revoked',
    'all_sessions_revoked': 'All sessions revoked',
    'impersonation_started': 'Impersonation started',
    'impersonation_ended': 'Impersonation ended',
    'profile_updated': 'Profile updated',
}

export function ActivityTab({ user, sessionUser }: ActivityTabProps) {
    const [logs, setLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [filterAction, setFilterAction] = useState<string>('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [isExporting, setIsExporting] = useState(false)

    useEffect(() => {
        async function loadActivityLog() {
            const result = await getUserActivityLog(user.id, { limit: 50 })
            if (result.success) {
                setLogs(result.data)
            }
            setLoading(false)
        }
        loadActivityLog()
    }, [user.id])

    const getActionIcon = (action: string) => {
        const Icon = ACTION_ICONS[action] || Activity
        return <Icon className="h-4 w-4" />
    }

    const getActionLabel = (action: string) => {
        return ACTION_LABELS[action] || action.replace('_', ' ')
    }

    const formatDate = (date: Date | string) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const filteredLogs = logs.filter(log => {
        if (filterAction !== 'all' && log.action !== filterAction) return false
        if (searchQuery && !getActionLabel(log.action).toLowerCase().includes(searchQuery.toLowerCase())) {
            return false
        }
        return true
    })

    const uniqueActions = Array.from(new Set(logs.map(log => log.action)))

    const exportToCSV = () => {
        setIsExporting(true)
        
        try {
            // Prepare CSV headers
            const headers = ['Date', 'Action', 'Details', 'IP Address', 'User Agent']
            
            // Prepare CSV rows
            const rows = filteredLogs.map(log => {
                const date = formatDate(log.createdAt)
                const action = getActionLabel(log.action)
                
                // Build details from metadata
                let details = ''
                if (log.metadata) {
                    const metaParts = []
                    if (log.metadata.addedBy) metaParts.push(`By: ${log.metadata.addedBy}`)
                    if (log.metadata.changedBy) metaParts.push(`By: ${log.metadata.changedBy}`)
                    if (log.metadata.resetBy) metaParts.push(`By: ${log.metadata.resetBy}`)
                    if (log.metadata.role) metaParts.push(`Role: ${log.metadata.role}`)
                    if (log.metadata.newRole) metaParts.push(`New Role: ${log.metadata.newRole}`)
                    details = metaParts.join(', ')
                }
                
                const ip = log.ipAddress || ''
                const userAgent = log.userAgent || ''
                
                // Escape CSV values (wrap in quotes if they contain commas, quotes, or newlines)
                const escapeCSV = (value: string) => {
                    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                        return `"${value.replace(/"/g, '""')}"`
                    }
                    return value
                }
                
                return [date, action, details, ip, userAgent].map(escapeCSV).join(',')
            })
            
            // Combine headers and rows
            const csv = [headers.join(','), ...rows].join('\n')
            
            // Create blob and download
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
            const link = document.createElement('a')
            const url = URL.createObjectURL(blob)
            
            link.setAttribute('href', url)
            link.setAttribute('download', `activity-log-${user.email}-${new Date().toISOString().split('T')[0]}.csv`)
            link.style.visibility = 'hidden'
            
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            
            URL.revokeObjectURL(url)
        } catch (error) {
            console.error('Export error:', error)
        } finally {
            setIsExporting(false)
        }
    }

    if (loading) {
        return (
            <Card>
                <CardContent className="py-12">
                    <div className="flex items-center justify-center">
                        <div className="text-muted-foreground">Loading activity log...</div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>User Activity Log</CardTitle>
                            <CardDescription>
                                Complete audit trail of user actions and events
                            </CardDescription>
                        </div>
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={exportToCSV}
                            disabled={isExporting || filteredLogs.length === 0}
                        >
                            <Download className="mr-2 h-4 w-4" />
                            {isExporting ? 'Exporting...' : 'Export CSV'}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Filters */}
                    <div className="flex gap-4 mb-6">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search activity..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>
                        <Select value={filterAction} onValueChange={setFilterAction}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="All Actions" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Actions</SelectItem>
                                {uniqueActions.map(action => (
                                    <SelectItem key={action} value={action}>
                                        {getActionLabel(action)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Activity List */}
                    {filteredLogs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="rounded-full bg-muted p-3 mb-4">
                                <Activity className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold mb-1">No activity found</h3>
                            <p className="text-sm text-muted-foreground">
                                {searchQuery || filterAction !== 'all' 
                                    ? 'Try adjusting your filters' 
                                    : 'No activity has been logged yet'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredLogs.map((log) => (
                                <Card key={log.id} className="border-l-4 border-l-primary">
                                    <CardContent className="pt-6">
                                        <div className="flex items-start gap-3">
                                            <div className="rounded-lg bg-primary/10 p-2 mt-1">
                                                {getActionIcon(log.action)}
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <h4 className="font-semibold">
                                                            {getActionLabel(log.action)}
                                                        </h4>
                                                        <p className="text-sm text-muted-foreground">
                                                            {formatDate(log.createdAt)}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Metadata */}
                                                {log.metadata && Object.keys(log.metadata).length > 0 && (
                                                    <div className="mt-2 space-y-1">
                                                        {log.metadata.addedBy && (
                                                            <p className="text-sm text-muted-foreground">
                                                                By: <span className="font-medium">{log.metadata.addedBy}</span>
                                                            </p>
                                                        )}
                                                        {log.metadata.changedBy && (
                                                            <p className="text-sm text-muted-foreground">
                                                                By: <span className="font-medium">{log.metadata.changedBy}</span>
                                                            </p>
                                                        )}
                                                        {log.metadata.resetBy && (
                                                            <p className="text-sm text-muted-foreground">
                                                                By: <span className="font-medium">{log.metadata.resetBy}</span>
                                                            </p>
                                                        )}
                                                        {log.metadata.role && (
                                                            <p className="text-sm text-muted-foreground">
                                                                Role: <span className="font-medium">{log.metadata.role}</span>
                                                            </p>
                                                        )}
                                                        {log.metadata.newRole && (
                                                            <p className="text-sm text-muted-foreground">
                                                                New Role: <span className="font-medium">{log.metadata.newRole}</span>
                                                            </p>
                                                        )}
                                                    </div>
                                                )}

                                                {/* IP and User Agent */}
                                                {(log.ipAddress || log.userAgent) && (
                                                    <div className="mt-2 pt-2 border-t text-xs text-muted-foreground space-y-1">
                                                        {log.ipAddress && (
                                                            <p>IP: {log.ipAddress}</p>
                                                        )}
                                                        {log.userAgent && (
                                                            <p>Device: {log.userAgent.substring(0, 50)}...</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}

                            {filteredLogs.length >= 50 && (
                                <div className="text-center pt-4">
                                    <Button variant="outline">
                                        Load More
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

