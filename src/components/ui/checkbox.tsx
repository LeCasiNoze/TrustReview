"use client"

import * as React from "react"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

interface CheckboxProps {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  className?: string
  id?: string
}

const Checkbox: React.FC<CheckboxProps> = ({
  checked = false,
  onCheckedChange,
  disabled = false,
  className,
  id,
}) => {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      id={id}
      className={cn(
        "peer h-4 w-4 shrink-0 rounded-sm border border-gray-300 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-blue-600 border-blue-600 text-white" : "",
        disabled ? "opacity-50 cursor-not-allowed" : "",
        className
      )}
      onClick={() => !disabled && onCheckedChange?.(!checked)}
    >
      <Check
        className={cn(
          "h-4 w-4",
          checked ? "opacity-100" : "opacity-0"
        )}
      />
    </button>
  )
}

export { Checkbox }
