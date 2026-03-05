import { createSupabaseServer } from '@/lib/supabase-server'
import { requireUserServer } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'
import sharp from 'sharp'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const user = await requireUserServer()
    const supabase = await createSupabaseServer()
    
    // Get QR code with business info
    const { data: qrCode, error } = await supabase
      .from('qr_codes')
      .select(`
        *,
        businesses (
          name,
          slug,
          logo_url,
          qr_background_color,
          qr_foreground_color,
          qr_text
        )
      `)
      .eq('id', id)
      .single()
    
    if (error || !qrCode) {
      return NextResponse.json({ error: 'QR code not found' }, { status: 404 })
    }
    
    // Verify ownership
    const { data: business } = await supabase
      .from('businesses')
      .select('owner_user_id')
      .eq('id', qrCode.business_id)
      .single()
    
    if (!business || business.owner_user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Generate QR code URL
    let baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    
    // En production, s'assurer que l'URL est correcte
    if (!baseUrl || baseUrl.includes('localhost')) {
      baseUrl = 'https://trustreview-eight.vercel.app';
    }
    const qrUrl = `${baseUrl}/r/${qrCode.businesses.slug}`
    
    // QR code settings
    const settings = qrCode.custom_settings ? JSON.parse(qrCode.custom_settings) : {}
    const backgroundColor = settings.background_color || qrCode.businesses.qr_background_color || '#ffffff'
    const foregroundColor = settings.foreground_color || qrCode.businesses.qr_foreground_color || '#000000'
    const text = settings.text || qrCode.businesses.qr_text || 'Scannez pour donner votre avis'
    const includeLogo = settings.include_logo || false
    
    // Generate QR code
    const qrCodeBuffer = await QRCode.toBuffer(qrUrl, {
      errorCorrectionLevel: 'M',
      type: 'png',
      margin: 1,
      color: {
        dark: foregroundColor,
        light: backgroundColor
      },
      width: 300
    })
    
    // Create image with text and logo - Same logic as preview
    let finalImage = qrCodeBuffer
    
    if (text || includeLogo) {
      try {
        // Create canvas with QR code + text + logo - Same dimensions as preview
        const canvasWidth = 300
        const canvasHeight = includeLogo ? 400 : 350
        const qrSize = 200
        const qrX = (canvasWidth - qrSize) / 2
        const qrY = includeLogo ? 100 : 50
        
        // Create a complete SVG with all elements - Same as preview
        let svgContent = `
          <svg width="${canvasWidth}" height="${canvasHeight}" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="${backgroundColor}"/>
        `
        
        // Add logo if provided and requested
        if (includeLogo && qrCode.businesses.logo_url) {
          try {
            const logoResponse = await fetch(qrCode.businesses.logo_url)
            if (logoResponse.ok) {
              const logoBuffer = Buffer.from(await logoResponse.arrayBuffer())
              const logoSize = 50
              const logoX = (canvasWidth - logoSize) / 2
              const logoY = 10
              
              // Convert logo to base64 for SVG embedding
              const logoBase64 = logoBuffer.toString('base64')
              svgContent += `
                <image x="${logoX}" y="${logoY}" width="${logoSize}" height="${logoSize}" 
                       href="data:image/png;base64,${logoBase64}"/>
              `
            }
          } catch (logoError) {
            console.error('Failed to fetch logo:', logoError)
          }
        }
        
        // Add top invitation text - Same as preview
        svgContent += `
          <text x="50%" y="${includeLogo ? 70 : 30}" font-family="Arial, sans-serif" 
                font-size="14" font-weight="bold" text-anchor="middle" fill="${foregroundColor}">
            ⭐ Votre avis compte ! ⭐
          </text>
          <text x="50%" y="${includeLogo ? 88 : 48}" font-family="Arial, sans-serif" 
                font-size="11" text-anchor="middle" fill="${foregroundColor}">
            Aidez-nous à nous améliorer
          </text>
        `
        
        // Add QR code as base64 image
        const qrBase64 = qrCodeBuffer.toString('base64')
        svgContent += `
          <image x="${qrX}" y="${qrY}" width="${qrSize}" height="${qrSize}" 
                 href="data:image/png;base64,${qrBase64}"/>
        `
        
        // Add bottom thank you text - Same as preview
        const bottomText = text || "Merci pour votre confiance ! 🙏";
        svgContent += `
          <text x="50%" y="${qrY + qrSize + 25}" font-family="Arial, sans-serif" 
                font-size="12" font-weight="bold" text-anchor="middle" fill="${foregroundColor}">
            ${bottomText}
          </text>
          <text x="50%" y="${qrY + qrSize + 42}" font-family="Arial, sans-serif" 
                font-size="10" text-anchor="middle" fill="${foregroundColor}">
            Scannez pour donner votre avis
          </text>
        `
        
        svgContent += '</svg>'
        
        // Convert SVG to PNG using Sharp
        finalImage = await sharp(Buffer.from(svgContent))
          .png()
          .toBuffer()
          
      } catch (compositeError) {
        console.error('Error creating composite image:', compositeError)
        // Fallback to QR code only
        finalImage = qrCodeBuffer
      }
    }
    
    // Return the image
    const headers = new Headers()
    headers.set('Content-Type', 'image/png')
    headers.set('Content-Disposition', `attachment; filename="trustreview-${qrCode.businesses.slug}-${qrCode.id}.png"`)
    
    return new Response(new Uint8Array(finalImage), {
      status: 200,
      headers
    })
    
  } catch (error) {
    console.error('QR code download error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
