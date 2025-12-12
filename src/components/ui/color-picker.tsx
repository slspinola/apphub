'use client'

import * as React from 'react'
import { Input } from './input'
import { cn } from '@/lib/utils'

interface ColorPickerProps {
  value?: string
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
}

export function ColorPicker({
  value = '#6366f1',
  onChange,
  disabled = false,
  className,
}: ColorPickerProps) {
  const [hexValue, setHexValue] = React.useState(value)

  // Sync internal state when external value changes
  React.useEffect(() => {
    if (value !== hexValue) {
      setHexValue(value || '#6366f1')
    }
  }, [value])

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setHexValue(newValue)
    onChange(newValue)
  }

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value

    // Auto-prepend # if not present
    if (newValue && !newValue.startsWith('#')) {
      newValue = '#' + newValue
    }

    setHexValue(newValue)

    // Only update parent if valid hex color
    if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(newValue)) {
      onChange(newValue)
    }
  }

  const handleHexBlur = () => {
    // On blur, if invalid hex, reset to last valid value
    if (!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hexValue)) {
      setHexValue(value || '#6366f1')
    }
  }

  return (
    <div className={cn('flex gap-2', className)}>
      <div
        className="relative w-12 h-10 rounded-md border border-input overflow-hidden"
        style={{ backgroundColor: hexValue }}
      >
        <Input
          type="color"
          value={hexValue}
          onChange={handleColorChange}
          disabled={disabled}
          className="absolute inset-0 w-full h-full p-0 border-0 cursor-pointer opacity-0"
          aria-label="Color picker"
        />
      </div>
      <Input
        type="text"
        value={hexValue}
        onChange={handleHexChange}
        onBlur={handleHexBlur}
        disabled={disabled}
        placeholder="#6366f1"
        className="flex-1 font-mono"
        maxLength={7}
      />
    </div>
  )
}




