'use client'

import { useState } from 'react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { UserActions } from "./user-actions"
import { Eye, Users, X } from "lucide-react"
import Link from "next/link"
import { useRouter } from 'next/navigation'

interface User {
    id: string
    name: string | null
    email: string
    role: string
    status: string
    createdAt: Date
}

interface UserListProps {
    users: User[]
}

export function UserList({ users }: UserListProps) {
    const router = useRouter()
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])

    const toggleUser = (userId: string) => {
        setSelectedUserIds(prev => 
            prev.includes(userId) 
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        )
    }

    const toggleAll = () => {
        if (selectedUserIds.length === users.length) {
            setSelectedUserIds([])
        } else {
            setSelectedUserIds(users.map(u => u.id))
        }
    }

    const clearSelection = () => {
        setSelectedUserIds([])
    }

    const handleBulkAction = () => {
        // Navigate to bulk operations page with selected user IDs
        const ids = selectedUserIds.join(',')
        router.push(`/users/bulk?ids=${ids}`)
    }

    const isAllSelected = selectedUserIds.length === users.length && users.length > 0
    const isSomeSelected = selectedUserIds.length > 0 && selectedUserIds.length < users.length
    if (users.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-muted p-3 mb-4">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-6 w-6 text-muted-foreground"
                    >
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold mb-1">No users found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                    Get started by adding your first user
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Bulk Action Toolbar */}
            {selectedUserIds.length > 0 && (
                <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            <span className="font-semibold">
                                {selectedUserIds.length} user{selectedUserIds.length !== 1 ? 's' : ''} selected
                            </span>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearSelection}
                        >
                            <X className="h-4 w-4 mr-2" />
                            Clear
                        </Button>
                    </div>
                    <Button onClick={handleBulkAction}>
                        Bulk Actions
                    </Button>
                </div>
            )}

            {/* User Table */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">
                                <Checkbox
                                    checked={isAllSelected}
                                    onCheckedChange={toggleAll}
                                    aria-label="Select all users"
                                />
                            </TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created At</TableHead>
                            <TableHead className="w-[140px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell>
                                    <Checkbox
                                        checked={selectedUserIds.includes(user.id)}
                                        onCheckedChange={() => toggleUser(user.id)}
                                        aria-label={`Select ${user.name || user.email}`}
                                    />
                                </TableCell>
                                <TableCell className="font-medium">{user.name || 'N/A'}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                                        {user.role}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={user.status === 'active' ? 'outline' : 'destructive'}>
                                        {user.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Link href={`/users/${user.id}`}>
                                            <Button variant="ghost" size="sm">
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                        <UserActions user={user} />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
