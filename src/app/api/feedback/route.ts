import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { sendEmail, generateFeedbackNotificationEmail } from "@/lib/email-service";

export async function POST(req: Request) {
  console.log('📝 Feedback API called');
  
  const supabase = await createSupabaseServer();
  const body = await req.json().catch(() => null);

  const businessId = body?.businessId as string | undefined;
  const sessionId = (body?.sessionId as string | null | undefined) ?? null;
  const stars = (body?.stars as number | null | undefined) ?? null;
  const message = body?.message as string | undefined;

  console.log('📊 Feedback data:', {
    businessId: businessId ? '✅' : '❌',
    sessionId: sessionId ? '✅' : '❌',
    stars: stars !== null ? stars : '❌',
    messageLength: message?.length || 0,
    messagePreview: message ? (message.substring(0, 50) + (message.length > 50 ? '...' : '')) : '❌'
  });

  if (!businessId || !message || message.trim().length < 3) {
    console.log('❌ Invalid payload:', {
      hasBusinessId: !!businessId,
      hasMessage: !!message,
      messageLength: message?.length || 0
    });
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const { error } = await supabase.from("feedbacks").insert({
    business_id: businessId,
    session_id: sessionId,
    stars,
    message: message.trim(),
  });

  if (error) {
    console.error('❌ Database error:', error);
    return NextResponse.json({ error: "db_error", details: error.message }, { status: 500 });
  }

  console.log('✅ Feedback saved successfully, checking email notification...');

  // Send email notification to business owner
  try {
    console.log('🔍 Fetching business details for notification...');
    
    // Get business details for notification
    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select("name, notification_email, notif_new_review, notif_low_rating")
      .eq("id", businessId)
      .single();

    if (businessError) {
      console.error('❌ Error fetching business:', businessError);
    } else if (business) {
      console.log('📊 Business found:', {
        name: business.name,
        hasEmail: !!business.notification_email,
        email: business.notification_email ? business.notification_email.substring(0, 5) + '***' : '❌'
      });

      if (business.notification_email) {
        // Vérifier les préférences de notification
        const shouldSendNewReview = business.notif_new_review !== false; // true par défaut
        const shouldSendLowRating = business.notif_low_rating !== false && stars !== null && stars <= 3;
        
        if (shouldSendNewReview || shouldSendLowRating) {
          console.log('📧 Generating email notification...', {
            notif_new_review: business.notif_new_review,
            notif_low_rating: business.notif_low_rating,
            stars,
            shouldSend: shouldSendNewReview || shouldSendLowRating
          });
          
          const emailData = generateFeedbackNotificationEmail(
            business.name,
            stars || 0,
            message.trim(),
            business.notification_email
          );
          
          console.log('📧 Email data generated:', {
            to: emailData.to,
            subject: emailData.subject,
            htmlLength: emailData.html.length
          });
          
          const emailSent = await sendEmail(emailData);
          
          if (emailSent) {
            console.log(`✅ Notification sent to ${business.notification_email} for ${business.name}`);
          } else {
            console.log(`❌ Failed to send notification to ${business.notification_email}`);
          }
        } else {
          console.log(`⚠️ Notifications disabled for business ${business.name}`);
          console.log('💡 Enable notifications in settings if needed');
        }
      } else {
        console.log(`⚠️ No notification email configured for business ${business.name} (${businessId})`);
        console.log('💡 Solution: Configure email in business page');
      }
    } else {
      console.log(`❌ Business not found for ID: ${businessId}`);
    }
  } catch (emailError) {
    console.error("❌ Failed to send notification email:", emailError);
    // Don't fail the request if email fails
  }

  console.log('🎉 Feedback API completed successfully');
  return NextResponse.json({ ok: true });
}
