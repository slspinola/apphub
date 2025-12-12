'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { adminAssignLicense } from '@/features/apps/actions'
import { toast } from 'sonner'
import { Plus, Loader2 } from 'lucide-react'

interface Plan {
  id: string
  slug: string
  name: string
  price: number | null
  isActive: boolean
}

interface AssignLicenseDialogProps {
  appId: string
  availableEntities: { id: string; name: string; slug: string }[]
  plans: Plan[]
  onSuccess: () => void
}

export function AssignLicenseDialog({
  appId,
  availableEntities,
  plans,
  onSuccess,
}: AssignLicenseDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedEntityId, setSelectedEntityId] = useState<string>('')
  const [selectedPlanId, setSelectedPlanId] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!selectedEntityId) {
      toast.error('Please select an entity')
      return
    }
    if (!selectedPlanId) {
      toast.error('Please select a plan')
      return
    }

    try {
      setIsSubmitting(true)
      await adminAssignLicense(selectedEntityId, appId, selectedPlanId)
      toast.success('License assigned successfully')
      setOpen(false)
      setSelectedEntityId('')
      setSelectedPlanId('')
      onSuccess()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to assign license')
    } finally {
      setIsSubmitting(false)
    }
  }

  const activePlans = plans.filter(p => p.isActive)
  const canAssign = availableEntities.length > 0 && activePlans.length > 0

  const formatPrice = (price: number | null) => {
    if (price === null || price === 0) return 'Free'
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(price)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={!canAssign}>
          <Plus className="mr-2 h-4 w-4" />
          Assign License
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign License to Entity</DialogTitle>
          <DialogDescription>
            Select an entity and a plan to grant access to this application.
            The license will be active immediately.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="entity">Entity</Label>
            <Select value={selectedEntityId} onValueChange={setSelectedEntityId}>
              <SelectTrigger id="entity">
                <SelectValue placeholder="Choose an entity..." />
              </SelectTrigger>
              <SelectContent>
                {availableEntities.map((entity) => (
                  <SelectItem key={entity.id} value={entity.id}>
                    {entity.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="plan">Plan</Label>
            <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
              <SelectTrigger id="plan">
                <SelectValue placeholder="Choose a plan..." />
              </SelectTrigger>
              <SelectContent>
                {activePlans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name} ({formatPrice(plan.price)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !selectedEntityId || !selectedPlanId}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Assign License
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Keep old export for backwards compatibility during transition
export const GrantEntityAccessDialog = AssignLicenseDialog
