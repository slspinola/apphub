import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2 } from 'lucide-react'
import type { Entity } from '@prisma/client'

interface EntitySettingsTabProps {
    entity: Entity & {
        parent?: Entity | null
        _count: {
            memberships: number
            children: number
        }
    }
}

export function EntitySettingsTab({ entity }: EntitySettingsTabProps) {
    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5" />
                            General Information
                        </CardTitle>
                        <CardDescription>
                            Basic information about this entity
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">
                                Name
                            </label>
                            <p className="text-lg font-medium">{entity.name}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">
                                Slug
                            </label>
                            <p className="font-mono text-sm">{entity.slug}</p>
                        </div>
                        {entity.parent && (
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">
                                    Parent Entity
                                </label>
                                <p className="text-sm">{entity.parent.name}</p>
                            </div>
                        )}
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">
                                Created
                            </label>
                            <p className="text-sm">
                                {new Date(entity.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Statistics</CardTitle>
                        <CardDescription>
                            Overview of this entity&apos;s structure
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="rounded-lg border p-4 text-center">
                                <p className="text-3xl font-bold">{entity._count.memberships}</p>
                                <p className="text-sm text-muted-foreground">Members</p>
                            </div>
                            <div className="rounded-lg border p-4 text-center">
                                <p className="text-3xl font-bold">{entity._count.children}</p>
                                <p className="text-sm text-muted-foreground">Sub-Entities</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Entity Configuration</CardTitle>
                    <CardDescription>
                        Configure entity-specific settings and preferences
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Entity configuration options will be available here. This includes
                        branding, notifications, and other entity-specific settings.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}

