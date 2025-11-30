import { LoginForm } from '@/components/forms/login-form'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Login',
    description: 'Login to your account',
}

export default function LoginPage() {
    return <LoginForm />
}
