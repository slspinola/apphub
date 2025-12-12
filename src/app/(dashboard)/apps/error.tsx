'use client'

import { useEffect } from 'react'
import { Container } from '@/components/ui/container'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function AppsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Apps error:', error)
  }, [error])

  return (
    <Container>
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
        <p className="text-muted-foreground mb-6">
          {error.message || 'An error occurred while loading apps'}
        </p>
        <Button onClick={reset}>Try again</Button>
      </div>
    </Container>
  )
}

