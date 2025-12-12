'use client'

import { useEffect, useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Shield, X } from 'lucide-react'
import { getImpersonationStatus, stopImpersonation } from '@/features/users/actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function ImpersonationBanner() {
    const [impersonation, setImpersonation] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    useEffect(() => {
        async function checkImpersonation() {
            try {
                const result = await getImpersonationStatus()
                if (result?.success && result.data) {
                    setImpersonation(result.data)
                }
            } catch (error) {
                console.error('Failed to check impersonation status:', error)
                // Silently fail - impersonation banner is optional
            }
        }
        checkImpersonation()
    }, [])

    const handleStop = async () => {
        setLoading(true)
        try {
            const result = await stopImpersonation()
            if (result?.success) {
                setImpersonation(null)
                toast.success('Impersonation stopped')
                router.refresh()
            } else {
                toast.error(result?.error || 'Failed to stop impersonation')
            }
        } catch (error) {
            console.error('Failed to stop impersonation:', error)
            toast.error('An unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }

    if (!impersonation) return null

    return (
        <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20 mb-4">
            <Shield className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-yellow-900 dark:text-yellow-100">
                        Impersonating {impersonation.user.name || impersonation.user.email}
                    </span>
                    <span className="text-sm text-yellow-700 dark:text-yellow-300">
                        All actions will be logged
                    </span>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleStop}
                    disabled={loading}
                    className="ml-4"
                >
                    <X className="mr-2 h-4 w-4" />
                    Stop Impersonation
                </Button>
            </AlertDescription>
        </Alert>
    )
}

