'use client'

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Copy, Check, AlertTriangle, Mail, Key } from 'lucide-react'
import { resetUserPassword } from '@/features/users/actions'
import { toast } from 'sonner'

interface PasswordResetDialogProps {
    userId: string
    userName: string
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function PasswordResetDialog({ 
    userId, 
    userName, 
    open, 
    onOpenChange 
}: PasswordResetDialogProps) {
    const [method, setMethod] = useState<'temporary' | 'email'>('temporary')
    const [loading, setLoading] = useState(false)
    const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)

    const handleReset = async () => {
        setLoading(true)
        const result = await resetUserPassword(userId, method)
        
        if (result.success) {
            if (method === 'temporary' && result.data?.temporaryPassword) {
                setTemporaryPassword(result.data.temporaryPassword)
                toast.success('Temporary password generated')
            } else {
                toast.success('Password reset email sent')
                onOpenChange(false)
            }
        } else {
            toast.error(result.error)
        }
        
        setLoading(false)
    }

    const copyToClipboard = () => {
        if (temporaryPassword) {
            navigator.clipboard.writeText(temporaryPassword)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
            toast.success('Password copied to clipboard')
        }
    }

    const handleClose = () => {
        setTemporaryPassword(null)
        setCopied(false)
        setMethod('temporary')
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Reset Password</DialogTitle>
                    <DialogDescription>
                        Reset the password for {userName}
                    </DialogDescription>
                </DialogHeader>

                {!temporaryPassword ? (
                    <>
                        <div className="space-y-4 py-4">
                            <RadioGroup value={method} onValueChange={(v) => setMethod(v as any)}>
                                <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4 hover:bg-accent">
                                    <RadioGroupItem value="temporary" id="temporary" />
                                    <div className="space-y-1 leading-none flex-1">
                                        <Label htmlFor="temporary" className="cursor-pointer">
                                            <div className="flex items-center gap-2 font-semibold">
                                                <Key className="h-4 w-4" />
                                                Generate Temporary Password
                                            </div>
                                        </Label>
                                        <p className="text-sm text-muted-foreground">
                                            Create a secure temporary password that you can share with the user. 
                                            The password will be shown once and must be copied.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4 hover:bg-accent">
                                    <RadioGroupItem value="email" id="email" />
                                    <div className="space-y-1 leading-none flex-1">
                                        <Label htmlFor="email" className="cursor-pointer">
                                            <div className="flex items-center gap-2 font-semibold">
                                                <Mail className="h-4 w-4" />
                                                Send Password Reset Email
                                            </div>
                                        </Label>
                                        <p className="text-sm text-muted-foreground">
                                            Send a password reset link to the user's email address. 
                                            They can reset their password themselves.
                                        </p>
                                    </div>
                                </div>
                            </RadioGroup>

                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                    This action will invalidate the user's current password. 
                                    Consider revoking active sessions for additional security.
                                </AlertDescription>
                            </Alert>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={handleClose} disabled={loading}>
                                Cancel
                            </Button>
                            <Button onClick={handleReset} disabled={loading}>
                                {loading ? 'Resetting...' : 'Reset Password'}
                            </Button>
                        </DialogFooter>
                    </>
                ) : (
                    <>
                        <div className="space-y-4 py-4">
                            <Alert>
                                <Key className="h-4 w-4" />
                                <AlertDescription>
                                    <strong>Important:</strong> This password will only be shown once. 
                                    Make sure to copy it before closing this dialog.
                                </AlertDescription>
                            </Alert>

                            <div className="space-y-2">
                                <Label>Temporary Password</Label>
                                <div className="flex gap-2">
                                    <div className="flex-1 p-3 bg-muted rounded-md font-mono text-sm break-all">
                                        {temporaryPassword}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={copyToClipboard}
                                    >
                                        {copied ? (
                                            <Check className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>

                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                    Share this password securely with the user. 
                                    They should change it immediately after logging in.
                                </AlertDescription>
                            </Alert>
                        </div>

                        <DialogFooter>
                            <Button onClick={handleClose}>
                                Close
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}

