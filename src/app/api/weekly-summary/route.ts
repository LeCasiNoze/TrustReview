import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { sendEmail, generateWeeklySummaryEmail } from "@/lib/email-service";

export async function POST() {
  try {
    const supabase = await createSupabaseServer();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the business for this user
    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select("id, name, slug, notification_email")
      .eq("owner_user_id", user.id)
      .single();

    if (businessError || !business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Check if email is configured
    if (!business.notification_email) {
      return NextResponse.json({ 
        error: "No notification email configured",
        message: "Configurez votre email de notification dans les paramètres de l'entreprise"
      }, { status: 400 });
    }

    // Get date range for last week
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Get all ratings and feedbacks from last week
    const [ratingsData, feedbacksData] = await Promise.all([
      supabase
        .from("rating_sessions")
        .select("stars, created_at")
        .eq("business_id", business.id)
        .gte("created_at", oneWeekAgo.toISOString())
        .lte("created_at", now.toISOString()),
      
      supabase
        .from("feedbacks")
        .select("stars, message, created_at")
        .eq("business_id", business.id)
        .gte("created_at", oneWeekAgo.toISOString())
        .lte("created_at", now.toISOString())
    ]);

    // Calculate weekly stats
    const allRatings = [
      ...(ratingsData.data || []).map(r => r.stars || 0),
      ...(feedbacksData.data || []).map(f => f.stars || 0)
    ];

    const totalReviews = allRatings.length;
    const averageRating = totalReviews > 0 
      ? allRatings.reduce((sum, rating) => sum + rating, 0) / totalReviews 
      : 0;
    
    const positiveReviews = allRatings.filter(rating => rating >= 4).length;
    const positiveRate = totalReviews > 0 
      ? (positiveReviews / totalReviews) * 100 
      : 0;

    // Get recent feedbacks with messages
    const recentFeedbacks = (feedbacksData.data || [])
      .filter(f => f.message && f.message.trim())
      .slice(-3) // Last 3 feedbacks with messages
      .map(f => ({
        stars: f.stars,
        message: f.message,
        date: new Date(f.created_at).toLocaleDateString('fr-FR')
      }));

    // Generate and send email
    const emailData = generateWeeklySummaryEmail(
      business.name,
      {
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10,
        positiveRate: Math.round(positiveRate),
        period: `Du ${oneWeekAgo.toLocaleDateString('fr-FR')} au ${now.toLocaleDateString('fr-FR')}`,
        recentFeedbacks
      },
      business.notification_email
    );

    const emailSent = await sendEmail(emailData);

    if (!emailSent) {
      return NextResponse.json({ error: "Failed to send weekly summary" }, { status: 500 });
    }

    console.log(`📧 Weekly summary sent to ${business.notification_email} for ${business.name}`);

    return NextResponse.json({ 
      success: true,
      message: "Récapitulatif hebdomadaire envoyé avec succès",
      stats: {
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10,
        positiveRate: Math.round(positiveRate),
        period: `Du ${oneWeekAgo.toLocaleDateString('fr-FR')} au ${now.toLocaleDateString('fr-FR')}`
      }
    });

  } catch (error) {
    console.error("Error sending weekly summary:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
