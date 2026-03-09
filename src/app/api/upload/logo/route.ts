import { NextRequest, NextResponse } from 'next/server'
import { getRequestIdentity, getSupabaseForIdentity } from '@/lib/request-identity'

export async function POST(request: NextRequest) {
  try {
    const identity = await getRequestIdentity()
    
    if (!identity.isAuthenticated || !identity.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const supabase = await getSupabaseForIdentity(identity)
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Type de fichier non autorisé. Utilisez JPG, PNG ou WebP.' }, { status: 400 })
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Fichier trop volumineux. Maximum 5MB.' }, { status: 400 })
    }
    
    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${identity.userId}/logo-${Date.now()}.${fileExt}`
    
    // Upload to Supabase Storage
    console.log('Uploading logo:', { fileName, fileSize: file.size, fileType: file.type })
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('logos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      })
    
    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      
      // Handle specific bucket errors
      if (uploadError.message.includes('Bucket not found')) {
        throw new Error('Le bucket de stockage n\'existe pas. Veuillez contacter le support pour configurer le stockage.')
      }
      
      throw new Error(`Upload failed: ${uploadError.message}`)
    }
    
    console.log('Upload successful:', uploadData)
    
    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('logos')
      .getPublicUrl(fileName)
    
    return NextResponse.json({ 
      url: publicUrlData.publicUrl,
      fileName: fileName
    })
    
  } catch (error) {
    console.error('Logo upload error:', error)
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Erreur lors de l\'upload' }, { status: 500 })
  }
}
