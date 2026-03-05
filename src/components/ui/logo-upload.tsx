"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface LogoUploadProps {
  currentLogo?: string
  onLogoChange: (logoUrl: string) => void
}

export default function LogoUpload({ currentLogo, onLogoChange }: LogoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentLogo || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      alert('Type de fichier non autorisé. Utilisez JPG, PNG ou WebP.')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Fichier trop volumineux. Maximum 5MB.')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Upload file
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload/logo', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const data = await response.json()
      onLogoChange(data.url)
    } catch (error) {
      console.error('Upload error:', error)
      alert('Erreur lors de l\'upload du logo')
      // Reset preview on error
      setPreview(currentLogo || null)
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveLogo = () => {
    setPreview(null)
    onLogoChange('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center bg-slate-50">
          {preview ? (
            <img 
              src={preview} 
              alt="Logo preview" 
              className="w-full h-full object-contain rounded-lg"
            />
          ) : (
            <div className="text-center">
              <div className="text-2xl text-slate-400">📷</div>
              <div className="text-xs text-slate-400 mt-1">Logo</div>
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
            id="logo-upload"
          />
          
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? 'Upload...' : preview ? 'Changer' : 'Ajouter'} un logo
            </Button>
            
            {preview && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemoveLogo}
              >
                Supprimer
              </Button>
            )}
          </div>
          
          <p className="text-xs text-slate-500 mt-2">
            Formats: JPG, PNG, WebP. Max: 5MB
          </p>
        </div>
      </div>
      
      {preview && (
        <input
          type="hidden"
          name="logo_url"
          value={preview}
        />
      )}
    </div>
  )
}
