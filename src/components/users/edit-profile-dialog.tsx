'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2, Upload, X } from 'lucide-react'
import { updateUserProfile, uploadUserAvatar } from '@/features/users/actions'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface EditProfileDialogProps {
    user: any
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function EditProfileDialog({ user, open, onOpenChange }: EditProfileDialogProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [isUploading, setIsUploading] = useState(false)
    
    const [formData, setFormData] = useState({
        name: user.name || '',
        email: user.email || '',
        image: user.image || ''
    })
    
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string>(user.image || '')

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                toast.error('Please select a valid image file')
                return
            }
            
            // Validate file size (5MB max)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Image size must be less than 5MB')
                return
            }
            
            setImageFile(file)
            const url = URL.createObjectURL(file)
            setPreviewUrl(url)
        }
    }

    const handleRemoveImage = () => {
        setImageFile(null)
        setPreviewUrl('')
        setFormData(prev => ({ ...prev, image: '' }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        startTransition(async () => {
            try {
                // First upload image if there's a new one
                let imageUrl = formData.image
                
                if (imageFile) {
                    setIsUploading(true)
                    const formDataObj = new FormData()
                    formDataObj.append('file', imageFile)
                    
                    const uploadResult = await uploadUserAvatar(user.id, formDataObj)
                    setIsUploading(false)
                    
                    if (!uploadResult.success) {
                        toast.error(uploadResult.error || 'Failed to upload image')
                        return
                    }
                    
                    imageUrl = uploadResult.data.imageUrl
                }
                
                // Then update profile
                const result = await updateUserProfile(user.id, {
                    name: formData.name,
                    email: formData.email,
                    image: imageUrl
                })
                
                if (result.success) {
                    toast.success('Profile updated successfully')
                    onOpenChange(false)
                    router.refresh()
                } else {
                    toast.error(result.error || 'Failed to update profile')
                }
            } catch (error) {
                toast.error('An unexpected error occurred')
            }
        })
    }

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                    <DialogDescription>
                        Update user profile information and avatar
                    </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Avatar Section */}
                    <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20">
                            <AvatarImage src={previewUrl} alt={formData.name} />
                            <AvatarFallback className="text-2xl">
                                {getInitials(formData.name || formData.email)}
                            </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex flex-col gap-2">
                            <div className="flex gap-2">
                                <Label htmlFor="image-upload" className="cursor-pointer">
                                    <div className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3">
                                        <Upload className="mr-2 h-4 w-4" />
                                        Upload Photo
                                    </div>
                                </Label>
                                <Input
                                    id="image-upload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageChange}
                                    disabled={isPending || isUploading}
                                />
                                
                                {previewUrl && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleRemoveImage}
                                        disabled={isPending || isUploading}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                JPG, PNG or GIF. Max size 5MB.
                            </p>
                        </div>
                    </div>
                    
                    {/* Name Field */}
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter full name"
                            disabled={isPending || isUploading}
                        />
                    </div>
                    
                    {/* Email Field */}
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="Enter email address"
                            disabled={isPending || isUploading}
                        />
                        <p className="text-xs text-muted-foreground">
                            Changing the email will require verification
                        </p>
                    </div>
                    
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isPending || isUploading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isPending || isUploading}>
                            {(isPending || isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isUploading ? 'Uploading...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

