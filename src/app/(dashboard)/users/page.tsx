import { UserList } from "@/components/users/user-list"
import { UserDialog } from "@/components/users/user-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus } from "lucide-react"
import { getUsers } from "@/features/users/actions"

export default async function UsersPage() {
    const result = await getUsers()
    const users = result.success ? result.data : []

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Users</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage user accounts and permissions
                    </p>
                </div>
                <UserDialog>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add User
                    </Button>
                </UserDialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Users</CardTitle>
                    <CardDescription>
                        View and manage all user accounts in your organization
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <UserList users={users} />
                </CardContent>
            </Card>
        </div>
    )
}
