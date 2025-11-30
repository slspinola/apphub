import { getUserEntities } from '@/features/entities/actions'
import { CreateEntityDialog } from '@/components/entities/create-entity-dialog'
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
        return <div>Failed to load entities</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Entities</h1>
                <CreateEntityDialog />
            </div>

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
                        {entities?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No entities found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
