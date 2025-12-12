'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Package, ArrowRight, Filter, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getUserAppAccess } from '@/features/users/actions'

interface AppsTabProps {
    user: any
    sessionUser: any
}

interface Filters {
    entity: string
    app: string
    status: string
}

export function AppsTab({ user, sessionUser }: AppsTabProps) {
    const [appAccess, setAppAccess] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [filters, setFilters] = useState<Filters>({
        entity: 'all',
        app: 'all',
        status: 'all'
    })
    const [showFilterPopover, setShowFilterPopover] = useState(false)

    useEffect(() => {
        async function loadAppAccess() {
            const result = await getUserAppAccess(user.id)
            if (result.success) {
                setAppAccess(result.data)
            }
            setLoading(false)
        }
        loadAppAccess()
    }, [user.id])

    const getStatusBadgeVariant = (status: string) => {
        if (status === 'ACTIVE') return 'default'
        if (status === 'TRIAL') return 'secondary'
        if (status === 'SUSPENDED') return 'destructive'
        return 'outline'
    }

    // Get unique values for filters
    const uniqueEntities = Array.from(new Set(appAccess.map(a => a.entity.name)))
    const uniqueApps = Array.from(new Set(appAccess.map(a => a.app.name)))
    const uniqueStatuses = Array.from(new Set(appAccess.map(a => a.license.status)))

    // Apply filters
    const filteredAppAccess = appAccess.filter(access => {
        if (filters.entity !== 'all' && access.entity.name !== filters.entity) return false
        if (filters.app !== 'all' && access.app.name !== filters.app) return false
        if (filters.status !== 'all' && access.license.status !== filters.status) return false
        return true
    })

    const hasActiveFilters = filters.entity !== 'all' || filters.app !== 'all' || filters.status !== 'all'

    const clearFilters = () => {
        setFilters({
            entity: 'all',
            app: 'all',
            status: 'all'
        })
    }

    if (loading) {
        return (
            <Card>
                <CardContent className="py-12">
                    <div className="flex items-center justify-center">
                        <div className="text-muted-foreground">Loading app access...</div>
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
                            <CardTitle>App Access Overview</CardTitle>
                            <CardDescription>
                                Applications this user can access through entity licenses
                                {hasActiveFilters && ` (${filteredAppAccess.length} of ${appAccess.length})`}
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            {hasActiveFilters && (
                                <Button variant="ghost" size="sm" onClick={clearFilters}>
                                    <X className="mr-2 h-4 w-4" />
                                    Clear Filters
                                </Button>
                            )}
                            <Popover open={showFilterPopover} onOpenChange={setShowFilterPopover}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        <Filter className="mr-2 h-4 w-4" />
                                        Filter
                                        {hasActiveFilters && (
                                            <Badge variant="secondary" className="ml-2 px-1 min-w-[20px]">
                                                {Object.values(filters).filter(f => f !== 'all').length}
                                            </Badge>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80" align="end">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <h4 className="font-medium text-sm">Filter Apps</h4>
                                            <p className="text-xs text-muted-foreground">
                                                Narrow down the list of applications
                                            </p>
                                        </div>
                                        
                                        <div className="space-y-3">
                                            <div className="space-y-2">
                                                <Label className="text-xs">Entity</Label>
                                                <Select 
                                                    value={filters.entity} 
                                                    onValueChange={(value) => setFilters(prev => ({ ...prev, entity: value }))}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="All entities" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All entities</SelectItem>
                                                        {uniqueEntities.map(entity => (
                                                            <SelectItem key={entity} value={entity}>
                                                                {entity}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-xs">Application</Label>
                                                <Select 
                                                    value={filters.app} 
                                                    onValueChange={(value) => setFilters(prev => ({ ...prev, app: value }))}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="All apps" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All apps</SelectItem>
                                                        {uniqueApps.map(app => (
                                                            <SelectItem key={app} value={app}>
                                                                {app}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-xs">License Status</Label>
                                                <Select 
                                                    value={filters.status} 
                                                    onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="All statuses" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All statuses</SelectItem>
                                                        {uniqueStatuses.map(status => (
                                                            <SelectItem key={status} value={status}>
                                                                {status}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="flex justify-end gap-2 pt-2 border-t">
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                onClick={clearFilters}
                                                disabled={!hasActiveFilters}
                                            >
                                                Clear
                                            </Button>
                                            <Button 
                                                size="sm" 
                                                onClick={() => setShowFilterPopover(false)}
                                            >
                                                Apply
                                            </Button>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {filteredAppAccess.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="rounded-full bg-muted p-3 mb-4">
                                <Package className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold mb-1">
                                {hasActiveFilters ? 'No matching apps' : 'No app access'}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                {hasActiveFilters 
                                    ? 'Try adjusting your filters' 
                                    : "This user doesn't have access to any apps yet"
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {filteredAppAccess.map((access, idx) => (
                                <Card key={idx} className="border-2">
                                    <CardContent className="pt-6">
                                        <div className="space-y-4">
                                            {/* App Header */}
                                            <div className="flex items-start gap-3">
                                                <div 
                                                    className="rounded-lg p-2 flex items-center justify-center h-12 w-12"
                                                    style={{ 
                                                        backgroundColor: access.app.color ? `${access.app.color}20` : '#f3f4f6' 
                                                    }}
                                                >
                                                    {access.app.icon ? (
                                                        <span className="text-2xl">{access.app.icon}</span>
                                                    ) : (
                                                        <Package className="h-6 w-6" style={{ color: access.app.color || '#6b7280' }} />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-lg">{access.app.name}</h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        {access.app.description || 'No description'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* License Info */}
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-muted-foreground">License Plan:</span>
                                                    <Badge variant="outline">{access.license.plan.name}</Badge>
                                                </div>
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-muted-foreground">Status:</span>
                                                    <Badge variant={getStatusBadgeVariant(access.license.status)}>
                                                        {access.license.status}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-muted-foreground">Entity:</span>
                                                    <span className="font-medium">{access.entity.name}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-muted-foreground">Role:</span>
                                                    <Badge variant="secondary">{access.membershipRole}</Badge>
                                                </div>
                                            </div>

                                            {/* Access Scope */}
                                            {access.scope && (
                                                <div className="pt-2 border-t">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-muted-foreground">Access Scope:</span>
                                                        <Badge variant="outline" className="text-xs">
                                                            {access.scope.scopeType}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Actions */}
                                            <Button variant="ghost" size="sm" className="w-full">
                                                View Permissions
                                                <ArrowRight className="ml-2 h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

