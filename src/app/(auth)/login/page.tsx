import { LoginForm } from '@/components/forms/login-form'
import { Metadata } from 'next'
import { Suspense } from 'react'

export const metadata: Metadata = {
    title: 'Login',
    description: 'Login to your account',
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-full max-w-sm">
                    <div className="animate-pulse">
                        <div className="h-64 bg-muted rounded-lg" />
                    </div>
                </div>
            </div>
        }>
            <LoginForm />
        </Suspense>
    )
}
