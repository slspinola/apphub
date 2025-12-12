'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Users, Loader2, CheckCircle2, XCircle, Download } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { bulkAddToEntity, bulkUpdateStatus, bulkExportUsers } from '@/features/users/actions'

interface BulkOperationsContentProps {
    users: any[]
    userIds: string[]
}

type OperationType = 'add_to_entity' | 'update_status' | 'export_csv' | null

export function BulkOperationsContent({ users, userIds }: BulkOperationsContentProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [operationType, setOperationType] = useState<OperationType>(null)
    const [selectedEntityId, setSelectedEntityId] = useState('')
    const [selectedRole, setSelectedRole] = useState('member')
    const [selectedStatus, setSelectedStatus] = useState('active')
    const [results, setResults] = useState<any>(null)
    const [entities, setEntities] = useState<any[]>([])
    const [loadingEntities, setLoadingEntities] = useState(false)

    const loadEntities = async () => {
        setLoadingEntities(true)
        try {
            const response = await fetch('/api/entities')
            if (response.ok) {
                const data = await response.json()
                setEntities(data)
            }
        } catch (error) {
            console.error('Failed to load entities:', error)
            toast.error('Failed to load entities')
        } finally {
            setLoadingEntities(false)
        }
    }

    const handleOperationChange = (value: OperationType) => {
        setOperationType(value)
        setResults(null)
        
        if (value === 'add_to_entity' && entities.length === 0) {
            loadEntities()
        }
    }

    const handleExecute = async () => {
        if (!operationType) return

        startTransition(async () => {
            let result

            switch (operationType) {
                case 'add_to_entity':
                    if (!selectedEntityId) {
                        toast.error('Please select an entity')
                        return
                    }
                    result = await bulkAddToEntity(userIds, selectedEntityId, selectedRole)
                    break

                case 'update_status':
                    result = await bulkUpdateStatus(userIds, selectedStatus)
                    break

                case 'export_csv':
                    result = await bulkExportUsers(userIds)
                    if (result.success && result.data) {
                        // Download CSV
                        const blob = new Blob([result.data], { type: 'text/csv;charset=utf-8;' })
                        const link = document.createElement('a')
                        const url = URL.createObjectURL(blob)
                        link.setAttribute('href', url)
                        link.setAttribute('download', `users-export-${new Date().toISOString().split('T')[0]}.csv`)
                        link.style.visibility = 'hidden'
                        document.body.appendChild(link)
                        link.click()
                        document.body.removeChild(link)
                        URL.revokeObjectURL(url)
                        
                        toast.success('CSV exported successfully')
                        setResults({ success: true, message: 'CSV exported successfully' })
                        return
                    }
                    break

                default:
                    return
            }

            if (result) {
                setResults(result)
                if (result.success) {
                    toast.success(result.message || 'Operation completed successfully')
                    // Refresh after a delay to show results
                    setTimeout(() => {
                        router.push('/users')
                        router.refresh()
                    }, 2000)
                } else {
                    toast.error(result.error || 'Operation failed')
                }
            }
        })
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <Link href="/users">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Users
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight mt-4">Bulk Operations</h1>
                    <p className="text-muted-foreground">
                        Perform actions on {users.length} selected user{users.length !== 1 ? 's' : ''}
                    </p>
                </div>
            </div>

            {/* Selected Users */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Selected Users ({users.length})
                    </CardTitle>
                    <CardDescription>
                        Review the users that will be affected by the bulk operation
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {users.map((user) => (
                            <div 
                                key={user.id} 
                                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                            >
                                <div className="flex items-center gap-3">
                                    <div>
                                        <p className="font-medium">{user.name || 'N/A'}</p>
                                        <p className="text-sm text-muted-foreground">{user.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline">{user.role}</Badge>
                                    <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                                        {user.status}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Operation Selection */}
            <Card>
                <CardHeader>
                    <CardTitle>Select Operation</CardTitle>
                    <CardDescription>
                        Choose the action you want to perform on the selected users
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Operation Type</Label>
                        <Select 
                            value={operationType || ''} 
                            onValueChange={(value) => handleOperationChange(value as OperationType)}
                            disabled={isPending}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select an operation" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="add_to_entity">Add to Entity</SelectItem>
                                <SelectItem value="update_status">Update Status</SelectItem>
                                <SelectItem value="export_csv">Export to CSV</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Add to Entity Options */}
                    {operationType === 'add_to_entity' && (
                        <div className="space-y-4 pt-4 border-t">
                            <div className="space-y-2">
                                <Label>Entity</Label>
                                {loadingEntities ? (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Loading entities...
                                    </div>
                                ) : (
                                    <Select 
                                        value={selectedEntityId} 
                                        onValueChange={setSelectedEntityId}
                                        disabled={isPending}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select an entity" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {entities.map((entity) => (
                                                <SelectItem key={entity.id} value={entity.id}>
                                                    {entity.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label>Role</Label>
                                <Select 
                                    value={selectedRole} 
                                    onValueChange={setSelectedRole}
                                    disabled={isPending}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="owner">Owner</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                        <SelectItem value="manager">Manager</SelectItem>
                                        <SelectItem value="member">Member</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}

                    {/* Update Status Options */}
                    {operationType === 'update_status' && (
                        <div className="space-y-2 pt-4 border-t">
                            <Label>New Status</Label>
                            <Select 
                                value={selectedStatus} 
                                onValueChange={setSelectedStatus}
                                disabled={isPending}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                    <SelectItem value="suspended">Suspended</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Export CSV Info */}
                    {operationType === 'export_csv' && (
                        <div className="pt-4 border-t">
                            <div className="rounded-lg bg-muted p-4 text-sm">
                                <p className="font-medium mb-2">Export will include:</p>
                                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                                    <li>User name and email</li>
                                    <li>Role and status</li>
                                    <li>Created date</li>
                                    <li>Entity memberships</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Execute Button */}
                    <div className="flex justify-end pt-4">
                        <Button
                            onClick={handleExecute}
                            disabled={!operationType || isPending}
                            size="lg"
                        >
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {operationType === 'export_csv' ? (
                                <>
                                    <Download className="mr-2 h-4 w-4" />
                                    Export CSV
                                </>
                            ) : (
                                'Execute Operation'
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Results */}
            {results && (
                <Card className={results.success ? 'border-green-500' : 'border-red-500'}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            {results.success ? (
                                <>
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                    Success
                                </>
                            ) : (
                                <>
                                    <XCircle className="h-5 w-5 text-red-500" />
                                    Error
                                </>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className={results.success ? 'text-green-700' : 'text-red-700'}>
                            {results.message || results.error}
                        </p>
                        {results.success && operationType !== 'export_csv' && (
                            <p className="text-sm text-muted-foreground mt-2">
                                Redirecting back to users list...
                            </p>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

