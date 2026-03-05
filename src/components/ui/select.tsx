"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
}

const Select: React.FC<SelectProps> = ({ value, onValueChange, children }) => {
  const [open, setOpen] = React.useState(false)
  const selectRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  return (
    <div ref={selectRef} className="relative">
      {React.Children.map(children, child => 
        React.isValidElement(child) 
          ? React.cloneElement(child as React.ReactElement<any>, { 
              value, 
              onValueChange, 
              open, 
              setOpen,
              onClose: () => setOpen(false)
            })
          : child
      )}
    </div>
  )
}

interface SelectTriggerProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  className?: string
  children?: React.ReactNode
  open?: boolean
  setOpen?: (open: boolean) => void
}

const SelectTrigger: React.FC<SelectTriggerProps> = ({ 
  value, 
  onValueChange, 
  placeholder = "Sélectionner...", 
  className,
  children,
  open,
  setOpen
}) => {
  return (
    <button
      type="button"
      onClick={() => setOpen?.(!open)}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        className
      )}
    >
      {children || <span>{value || placeholder}</span>}
      <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform", open ? "rotate-180" : "")} />
    </button>
  )
}

interface SelectValueProps {
  placeholder?: string
  value?: string
}

const SelectValue: React.FC<SelectValueProps> = ({ placeholder, value }) => {
  return <span>{value || placeholder}</span>
}

interface SelectContentProps {
  children: React.ReactNode
  onValueChange?: (value: string) => void
  onClose?: () => void
  open?: boolean
}

const SelectContent: React.FC<SelectContentProps> = ({ children, onValueChange, onClose, open }) => {
  if (!open) return null

  return (
    <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
      <div className="max-h-60 overflow-auto py-1">
        {React.Children.map(children, child => 
          React.isValidElement(child) 
            ? React.cloneElement(child as React.ReactElement<any>, { onValueChange, onClose })
            : child
        )}
      </div>
    </div>
  )
}

interface SelectItemProps {
  value: string
  children: React.ReactNode
  onValueChange?: (value: string) => void
  onClose?: () => void
}

const SelectItem: React.FC<SelectItemProps> = ({ value, children, onValueChange, onClose }) => {
  return (
    <button
      type="button"
      onClick={() => {
        onValueChange?.(value)
        onClose?.()
      }}
      className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-gray-100 focus:bg-gray-100"
    >
      {children}
    </button>
  )
}

export {
  Select,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
}
