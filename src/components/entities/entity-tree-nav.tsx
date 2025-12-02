'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Building2, Plus, Settings, Users } from 'lucide-react'

import { cn } from '@/lib/utils'
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarMenuSub,
    SidebarMenuSubItem,
    SidebarMenuSubButton,
} from '@/components/ui/sidebar'
import { Badge } from '@/components/ui/badge'
import type { EntityNode } from '@/types/entities'

interface EntityTreeNavProps {
    /** Array of root-level entity nodes */
    entities: EntityNode[]
    /** Currently selected entity ID */
    currentEntityId?: string
    /** Whether user can create new sub-entities */
    canCreate?: boolean
    /** Maximum depth to render (default: 4) */
    maxDepth?: number
    /** Callback when entity is selected */
    onEntitySelect?: (entity: EntityNode) => void
}

interface EntityNavItemProps {
    entity: EntityNode
    currentEntityId?: string
    depth: number
    maxDepth: number
    canCreate: boolean
    pathname: string
    onEntitySelect?: (entity: EntityNode) => void
}

function EntityNavItem({
    entity,
    currentEntityId,
    depth,
    maxDepth,
    canCreate,
    pathname,
    onEntitySelect,
}: EntityNavItemProps) {
    const hasChildren = entity.children && entity.children.length > 0
    const isCurrentEntity = entity.id === currentEntityId
    const isActive = pathname.includes(`/entity/${entity.slug}`)

    // Check if any child is active
    const hasActiveChild = React.useMemo(() => {
        const checkActive = (nodes: EntityNode[]): boolean => {
            return nodes.some(
                (node) =>
                    node.id === currentEntityId ||
                    pathname.includes(`/entity/${node.slug}`) ||
                    (node.children && checkActive(node.children))
            )
        }
        return hasChildren ? checkActive(entity.children) : false
    }, [entity.children, currentEntityId, pathname, hasChildren])

    const [isOpen, setIsOpen] = React.useState(isCurrentEntity || hasActiveChild)

    // Update open state when active state changes
    React.useEffect(() => {
        if (isCurrentEntity || hasActiveChild) {
            setIsOpen(true)
        }
    }, [isCurrentEntity, hasActiveChild])

    if (depth >= maxDepth) {
        return (
            <SidebarMenuSubItem>
                <SidebarMenuSubButton asChild isActive={isActive}>
                    <Link href={`/entity/${entity.slug}`}>
                        <Building2 className="h-3.5 w-3.5" />
                        <span className="truncate">{entity.name}</span>
                    </Link>
                </SidebarMenuSubButton>
            </SidebarMenuSubItem>
        )
    }

    if (!hasChildren) {
        return (
            <SidebarMenuSubItem>
                <SidebarMenuSubButton asChild isActive={isActive}>
                    <Link href={`/entity/${entity.slug}`}>
                        <Building2 className="h-3.5 w-3.5" />
                        <span className="truncate">{entity.name}</span>
                    </Link>
                </SidebarMenuSubButton>
            </SidebarMenuSubItem>
        )
    }

    return (
        <SidebarMenuSubItem>
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                <div className="flex items-center min-w-0">
                    <SidebarMenuSubButton asChild isActive={isActive} className="flex-1 min-w-0">
                        <Link href={`/entity/${entity.slug}`} className="min-w-0">
                            <Building2 className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{entity.name}</span>
                            {entity.children.length > 0 && (
                                <Badge
                                    variant="secondary"
                                    className="ml-auto h-5 min-w-5 px-1 text-[10px] shrink-0"
                                >
                                    {entity.children.length}
                                </Badge>
                            )}
                        </Link>
                    </SidebarMenuSubButton>
                    <CollapsibleTrigger asChild>
                        <button
                            className="ml-1 flex h-6 w-6 items-center justify-center rounded-md hover:bg-sidebar-accent shrink-0"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <ChevronRight
                                className={cn(
                                    'h-3.5 w-3.5 transition-transform duration-200',
                                    isOpen && 'rotate-90'
                                )}
                            />
                        </button>
                    </CollapsibleTrigger>
                </div>
                <CollapsibleContent>
                    <SidebarMenuSub>
                        {entity.children.map((child) => (
                            <EntityNavItem
                                key={child.id}
                                entity={child}
                                currentEntityId={currentEntityId}
                                depth={depth + 1}
                                maxDepth={maxDepth}
                                canCreate={canCreate}
                                pathname={pathname}
                                onEntitySelect={onEntitySelect}
                            />
                        ))}
                    </SidebarMenuSub>
                </CollapsibleContent>
            </Collapsible>
        </SidebarMenuSubItem>
    )
}

export function EntityTreeNav({
    entities,
    currentEntityId,
    canCreate = false,
    maxDepth = 4,
    onEntitySelect,
}: EntityTreeNavProps) {
    const pathname = usePathname()

    if (!entities || entities.length === 0) {
        return (
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton disabled>
                        <Building2 className="h-4 w-4" />
                        <span className="text-muted-foreground text-sm">No sub-entities</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                {canCreate && (
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                            <Link href="/entity/sub-entities/new">
                                <Plus className="h-4 w-4" />
                                <span>Create Sub-Entity</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                )}
            </SidebarMenu>
        )
    }

    return (
        <SidebarMenu>
            {entities.map((entity) => (
                <SidebarMenuItem key={entity.id}>
                    <RootEntityItem
                        entity={entity}
                        currentEntityId={currentEntityId}
                        maxDepth={maxDepth}
                        canCreate={canCreate}
                        pathname={pathname}
                        onEntitySelect={onEntitySelect}
                    />
                </SidebarMenuItem>
            ))}
            {canCreate && (
                <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                        <Link
                            href="/entity/sub-entities/new"
                            className="text-muted-foreground hover:text-foreground"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Create Sub-Entity</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            )}
        </SidebarMenu>
    )
}

interface RootEntityItemProps {
    entity: EntityNode
    currentEntityId?: string
    maxDepth: number
    canCreate: boolean
    pathname: string
    onEntitySelect?: (entity: EntityNode) => void
}

function RootEntityItem({
    entity,
    currentEntityId,
    maxDepth,
    canCreate,
    pathname,
    onEntitySelect,
}: RootEntityItemProps) {
    const hasChildren = entity.children && entity.children.length > 0
    const isCurrentEntity = entity.id === currentEntityId
    const isActive = pathname.includes(`/entity/${entity.slug}`)

    // Check if any child is active
    const hasActiveChild = React.useMemo(() => {
        const checkActive = (nodes: EntityNode[]): boolean => {
            return nodes.some(
                (node) =>
                    node.id === currentEntityId ||
                    pathname.includes(`/entity/${node.slug}`) ||
                    (node.children && checkActive(node.children))
            )
        }
        return hasChildren ? checkActive(entity.children) : false
    }, [entity.children, currentEntityId, pathname, hasChildren])

    const [isOpen, setIsOpen] = React.useState(isCurrentEntity || hasActiveChild)

    React.useEffect(() => {
        if (isCurrentEntity || hasActiveChild) {
            setIsOpen(true)
        }
    }, [isCurrentEntity, hasActiveChild])

    if (!hasChildren) {
        return (
            <SidebarMenuButton asChild isActive={isActive}>
                <Link href={`/entity/${entity.slug}`}>
                    <Building2 className="h-4 w-4" />
                    <span className="truncate">{entity.name}</span>
                </Link>
            </SidebarMenuButton>
        )
    }

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <div className="flex items-center min-w-0">
                <SidebarMenuButton asChild isActive={isActive} className="flex-1 min-w-0">
                    <Link href={`/entity/${entity.slug}`} className="min-w-0">
                        <Building2 className="h-4 w-4 shrink-0" />
                        <span className="truncate">{entity.name}</span>
                        {entity.children.length > 0 && (
                            <Badge
                                variant="secondary"
                                className="ml-auto h-5 min-w-5 px-1 text-xs shrink-0"
                            >
                                {entity.children.length}
                            </Badge>
                        )}
                    </Link>
                </SidebarMenuButton>
                <CollapsibleTrigger asChild>
                    <button
                        className="ml-1 flex h-7 w-7 items-center justify-center rounded-md hover:bg-sidebar-accent shrink-0"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <ChevronRight
                            className={cn(
                                'h-4 w-4 transition-transform duration-200',
                                isOpen && 'rotate-90'
                            )}
                        />
                    </button>
                </CollapsibleTrigger>
            </div>
            <CollapsibleContent>
                <SidebarMenuSub>
                    {/* Quick actions for current entity */}
                    <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                            asChild
                            isActive={pathname === `/entity/${entity.slug}/settings`}
                        >
                            <Link href={`/entity/${entity.slug}/settings`}>
                                <Settings className="h-3.5 w-3.5" />
                                <span>Settings</span>
                            </Link>
                        </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                            asChild
                            isActive={pathname === `/entity/${entity.slug}/members`}
                        >
                            <Link href={`/entity/${entity.slug}/members`}>
                                <Users className="h-3.5 w-3.5" />
                                <span>Members</span>
                            </Link>
                        </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    {/* Render children */}
                    {entity.children.map((child) => (
                        <EntityNavItem
                            key={child.id}
                            entity={child}
                            currentEntityId={currentEntityId}
                            depth={1}
                            maxDepth={maxDepth}
                            canCreate={canCreate}
                            pathname={pathname}
                            onEntitySelect={onEntitySelect}
                        />
                    ))}
                </SidebarMenuSub>
            </CollapsibleContent>
        </Collapsible>
    )
}

