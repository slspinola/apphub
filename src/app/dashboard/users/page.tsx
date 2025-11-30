import { UserList } from "@/components/users/user-list"
import { UserDialog } from "@/components/users/user-dialog"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { getUsers } from "@/features/users/actions"

export default async function UsersPage() {
    const result = await getUsers()
    const users = result.success ? result.data : []

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Users</h2>
                <div className="flex items-center space-x-2">
                    <UserDialog>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add User
                        </Button>
                    </UserDialog>
                </div>
            </div>
            <UserList users={users} />
        </div>
    )
}
