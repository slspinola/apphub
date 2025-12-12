'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Check, X, Info } from 'lucide-react'
import { useState, useEffect } from 'react'
import { getUserAppAccess } from '@/features/users/actions'
import { isSystemAdminRole } from '@/lib/authorization'

interface PermissionsTabProps {
    user: any
    sessionUser: any
}

export function PermissionsTab({ user, sessionUser }: PermissionsTabProps) {
    const [appAccess, setAppAccess] = useState<any[]>([])
    const [selectedApp, setSelectedApp] = useState<string>('')
    const [loading, setLoading] = useState(true)
    const isSystemAdmin = isSystemAdminRole(sessionUser.role)

    useEffect(() => {
        async function loadAppAccess() {
            const result = await getUserAppAccess(user.id)
            if (result.success) {
                setAppAccess(result.data)
                if (result.data.length > 0) {
                    setSelectedApp(result.data[0].app.id)
                }
            }
            setLoading(false)
        }
        loadAppAccess()
    }, [user.id])

    const selectedAppAccess = appAccess.find(a => a.app.id === selectedApp)

    // Mock permissions data - in real implementation, fetch from app's permission definitions
    const mockPermissions = [
        { resource: 'Vehicles', read: true, write: true, delete: true },
        { resource: 'Drivers', read: true, write: true, delete: false },
        { resource: 'Trips', read: true, write: false, delete: false },
        { resource: 'Reports', read: true, write: false, delete: false },
        { resource: 'Settings', read: false, write: false, delete: false },
    ]

    if (loading) {
        return (
            <Card>
                <CardContent className="py-12">
                    <div className="flex items-center justify-center">
                        <div className="text-muted-foreground">Loading permissions...</div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (appAccess.length === 0) {
        return (
            <Card>
                <CardContent className="py-12">
                    <div className="flex flex-col items-center justify-center text-center">
                        <Info className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-1">No app access</h3>
                        <p className="text-sm text-muted-foreground">
                            This user doesn't have access to any apps yet
                        </p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            {/* App Selector */}
            <Card>
                <CardHeader>
                    <CardTitle>Select Application</CardTitle>
                    <CardDescription>
                        Choose an app to view its permissions and access scope
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Select value={selectedApp} onValueChange={setSelectedApp}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select an app" />
                        </SelectTrigger>
                        <SelectContent>
                            {appAccess.map((access) => (
                                <SelectItem key={access.app.id} value={access.app.id}>
                                    {access.app.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {selectedAppAccess && (
                <>
                    {/* Access Scope */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Access Scope</CardTitle>
                                    <CardDescription>
                                        Defines what data the user can access within the app
                                    </CardDescription>
                                </div>
                                {isSystemAdmin && (
                                    <Button size="sm" variant="outline">
                                        Edit Scope
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                    <div>
                                        <p className="font-medium">Scope Type</p>
                                        <p className="text-sm text-muted-foreground">
                                            {selectedAppAccess.scope?.scopeType || 'Full Access'}
                                        </p>
                                    </div>
                                    <Badge variant="outline">
                                        {selectedAppAccess.scope?.scopeType || 'full_access'}
                                    </Badge>
                                </div>

                                {selectedAppAccess.scope?.scopeValue && (
                                    <div className="p-4 border rounded-lg bg-muted/50">
                                        <p className="font-medium mb-2">Scope Values</p>
                                        <pre className="text-xs overflow-auto">
                                            {JSON.stringify(selectedAppAccess.scope.scopeValue, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Permissions Matrix */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Permissions Matrix</CardTitle>
                            <CardDescription>
                                Permissions are based on entity role and app plan
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-lg overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-muted">
                                        <tr>
                                            <th className="text-left p-3 font-medium">Resource</th>
                                            <th className="text-center p-3 font-medium w-24">Read</th>
                                            <th className="text-center p-3 font-medium w-24">Write</th>
                                            <th className="text-center p-3 font-medium w-24">Delete</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {mockPermissions.map((perm, idx) => (
                                            <tr 
                                                key={idx}
                                                className="border-t hover:bg-muted/50"
                                            >
                                                <td className="p-3 font-medium">{perm.resource}</td>
                                                <td className="p-3 text-center">
                                                    {perm.read ? (
                                                        <Check className="h-5 w-5 text-green-500 mx-auto" />
                                                    ) : (
                                                        <X className="h-5 w-5 text-muted-foreground mx-auto" />
                                                    )}
                                                </td>
                                                <td className="p-3 text-center">
                                                    {perm.write ? (
                                                        <Check className="h-5 w-5 text-green-500 mx-auto" />
                                                    ) : (
                                                        <X className="h-5 w-5 text-muted-foreground mx-auto" />
                                                    )}
                                                </td>
                                                <td className="p-3 text-center">
                                                    {perm.delete ? (
                                                        <Check className="h-5 w-5 text-green-500 mx-auto" />
                                                    ) : (
                                                        <X className="h-5 w-5 text-muted-foreground mx-auto" />
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-4 p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
                                <div className="flex gap-2">
                                    <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm">
                                        <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                                            Permission Information
                                        </p>
                                        <p className="text-blue-700 dark:text-blue-300">
                                            Permissions are determined by the user's role in the entity ({selectedAppAccess.membershipRole}) 
                                            and the license plan ({selectedAppAccess.license.plan.name}). 
                                            Contact the entity administrator to modify permissions.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    )
}

