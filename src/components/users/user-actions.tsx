'use client'

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Pencil, Trash } from "lucide-react"
import { deleteUser } from "@/features/users/actions"
import { useState } from "react"
import { UserDialog } from "./user-dialog"

interface User {
    id: string
    name: string | null
    email: string
    role: string
    status: string
}

interface UserActionsProps {
    user: User
}

export function UserActions({ user }: UserActionsProps) {
    const [showEditDialog, setShowEditDialog] = useState(false)

    const handleDelete = async () => {
        if (confirm('Are you sure you want to delete this user?')) {
            await deleteUser(user.id)
        }
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                        <Trash className="mr-2 h-4 w-4" />
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <UserDialog
                open={showEditDialog}
                onOpenChange={setShowEditDialog}
                user={user}
            />
        </>
    )
}
