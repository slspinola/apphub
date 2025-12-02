'use client'

import * as React from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Palette, Settings as SettingsIcon, Paintbrush } from 'lucide-react'

export type SettingsTabId = 'white-label' | 'general' | 'themes'

interface SettingsTabsProps {
    /** Tab content components */
    children: {
        whiteLabel: React.ReactNode
        general: React.ReactNode
        themes: React.ReactNode
    }
}

export function SettingsTabs({ children }: SettingsTabsProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const currentTab = (searchParams.get('tab') as SettingsTabId) || 'white-label'

    const handleTabChange = (tab: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (tab === 'white-label') {
            params.delete('tab')
        } else {
            params.set('tab', tab)
        }
        const queryString = params.toString()
        router.push(queryString ? `${pathname}?${queryString}` : pathname)
    }

    const tabs = [
        { id: 'white-label' as const, label: 'White Label', icon: Palette },
        { id: 'general' as const, label: 'General', icon: SettingsIcon },
        { id: 'themes' as const, label: 'Themes', icon: Paintbrush },
    ]

    return (
        <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full max-w-2xl mb-6 grid-cols-3">
                {tabs.map((tab) => {
                    const Icon = tab.icon
                    return (
                        <TabsTrigger
                            key={tab.id}
                            value={tab.id}
                            className="flex items-center gap-2 cursor-pointer transition-all hover:bg-accent hover:text-accent-foreground active:scale-[0.98]"
                        >
                            <Icon className="h-4 w-4" />
                            <span>{tab.label}</span>
                        </TabsTrigger>
                    )
                })}
            </TabsList>

            <TabsContent value="white-label" className="mt-0">
                {children.whiteLabel}
            </TabsContent>

            <TabsContent value="general" className="mt-0">
                {children.general}
            </TabsContent>

            <TabsContent value="themes" className="mt-0">
                {children.themes}
            </TabsContent>
        </Tabs>
    )
}


