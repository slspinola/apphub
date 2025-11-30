'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, Plus } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { switchEntity } from '@/features/entities/actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Entity {
    id: string
    name: string
    slug: string
    role: string
}

interface EntitySwitcherProps {
    entities: Entity[]
    currentEntityId?: string
}

export function EntitySwitcher({
    entities,
    currentEntityId,
}: EntitySwitcherProps) {
    const router = useRouter()
    const currentEntity = entities.find((entity) => entity.id === currentEntityId)

    const onSelect = async (entityId: string) => {
        if (entityId === currentEntityId) return

        const result = await switchEntity(entityId)
        if (result.success) {
            toast.success('Switched entity')
            router.refresh()
        } else {
            toast.error(result.error)
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-label="Select entity"
                    className="w-[200px] justify-between"
                >
                    {currentEntity ? currentEntity.name : 'Select Entity'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[200px]">
                <DropdownMenuLabel>Entities</DropdownMenuLabel>
                {entities.map((entity) => (
                    <DropdownMenuItem
                        key={entity.id}
                        onSelect={() => onSelect(entity.id)}
                        className="text-sm"
                    >
                        <Check
                            className={cn(
                                'mr-2 h-4 w-4',
                                currentEntityId === entity.id ? 'opacity-100' : 'opacity-0'
                            )}
                        />
                        {entity.name}
                    </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => router.push('/dashboard/entities')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Entity
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
