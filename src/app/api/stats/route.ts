import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";

export async function GET() {
  try {
    const supabase = await createSupabaseServer();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error("User auth error:", userError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("User authenticated:", user.id);

    // Get the business for this user
    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select("id, name, slug")
      .eq("owner_user_id", user.id)
      .single();

    if (businessError) {
      console.error("Business fetch error:", businessError);
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    if (!business) {
      console.log("No business found for user:", user.id);
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    console.log("Business found:", business.id);

    // Get rating sessions for this business
    const { data: ratings, error: ratingsError } = await supabase
      .from("rating_sessions")
      .select("stars")
      .eq("business_id", business.id);

    if (ratingsError) {
      console.error("Ratings fetch error:", ratingsError);
      // Don't return error, just use empty array
    }

    console.log("Ratings found:", ratings?.length || 0);

    // Get feedbacks for this business
    const { data: feedbacks, error: feedbacksError } = await supabase
      .from("feedbacks")
      .select("id, stars")
      .eq("business_id", business.id);

    if (feedbacksError) {
      console.error("Feedbacks fetch error:", feedbacksError);
      // Don't return error, just use empty array
    }

    console.log("Feedbacks found:", feedbacks?.length || 0);

    // Calculate metrics
    const totalRatings = ratings?.length || 0;
    const totalFeedbacks = feedbacks?.length || 0;
    const totalReviews = totalRatings + totalFeedbacks; // Total combiné
    
    // Calculate average rating (tous les avis confondus)
    const allRatings = [
        ...(ratings || []).map(r => r.stars || 0),
        ...(feedbacks || []).map(f => f.stars || 0)
    ];
    
    const averageRating = allRatings.length > 0 
      ? allRatings.reduce((sum, rating) => sum + rating, 0) / allRatings.length
      : 0;

    // Calculate positive rate (tous les avis >= 4)
    const positiveReviews = allRatings.filter(rating => rating >= 4).length;
    const positiveRate = allRatings.length > 0 
      ? (positiveReviews / allRatings.length) * 100
      : 0;

    // Calculate rating distribution (réelle cette fois !)
    const ratingDistribution = [0, 0, 0, 0, 0]; // Index 0 = 1 étoile, 4 = 5 étoiles
    
    allRatings.forEach(rating => {
      if (rating >= 1 && rating <= 5) {
        ratingDistribution[rating - 1]++; // rating-1 pour l'index
      }
    });

    const stats = {
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      totalRatings,
      totalFeedbacks,
      totalReviews, // Nouveau champ pour le total combiné
      positiveRate: Math.round(positiveRate), // Round to nearest integer
      ratingDistribution, // Distribution réelle
    };

    console.log("Stats calculated:", {
      ...stats,
      allRatingsCount: allRatings.length,
      positiveReviews,
      distribution: ratingDistribution
    });

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
