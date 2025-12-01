import { getUserEntities } from '@/features/entities/actions'
import { CreateEntityDialog } from '@/components/entities/create-entity-dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export default async function EntitiesPage() {
    const result = await getUserEntities()
    const entities = result.success ? result.data : []

    if (!result.success) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Entities</h1>
                        <p className="text-muted-foreground mt-2">
                            Manage your organizations and entities
                        </p>
                    </div>
                </div>
                <Card>
                    <CardContent className="py-12">
                        <p className="text-center text-muted-foreground">Failed to load entities</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Entities</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage your organizations and entities
                    </p>
                </div>
                <CreateEntityDialog />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Entities</CardTitle>
                    <CardDescription>
                        View and manage all entities in your organization hierarchy
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {entities?.length === 0 ? (
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
                                    <path d="M3 3v18h18" />
                                    <path d="m19 9-5 5-4-4-3 3" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold mb-1">No entities found</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Get started by creating your first entity
                            </p>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Slug</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Parent</TableHead>
                                        <TableHead>Created At</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {entities?.map((entity) => (
                                        <TableRow key={entity.id}>
                                            <TableCell className="font-medium">{entity.name}</TableCell>
                                            <TableCell>{entity.slug}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{entity.role}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                {entity.parent ? entity.parent.name : '-'}
                                            </TableCell>
                                            <TableCell>
                                                {new Date(entity.createdAt).toLocaleDateString()}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
