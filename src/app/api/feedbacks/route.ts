import { NextResponse } from "next/server";
import { getRequestIdentity, getSupabaseForIdentity } from "@/lib/request-identity";

export async function GET() {
  try {
    const identity = await getRequestIdentity();
    
    if (!identity.isAuthenticated || !identity.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Plus de sessions temporaires - uniquement Supabase
    const supabase = await getSupabaseForIdentity(identity);

    // Get the business for this user
    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select("id, name, slug")
      .eq("owner_user_id", identity.userId)
      .single();

    if (businessError) {
      console.error("Business fetch error:", businessError);
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    if (!business) {
      console.log("No business found for user:", identity.userId);
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    console.log("Business found:", business.id);

    // Get rating sessions for this business
    const { data: ratings, error: ratingsError } = await supabase
      .from("rating_sessions")
      .select("id, stars, created_at")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false });

    // Get feedbacks for this business
    const { data: feedbacks, error: feedbacksError } = await supabase
      .from("feedbacks")
      .select("id, message, created_at, stars")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false });

    if (ratingsError || feedbacksError) {
      console.error("Error fetching feedback data:", ratingsError || feedbacksError);
      return NextResponse.json({ error: "Failed to fetch feedbacks" }, { status: 500 });
    }

    // Combine and format data
    const combinedFeedbacks = [
      ...(ratings?.map(rating => ({
        id: rating.id,
        stars: rating.stars,
        created_at: rating.created_at,
        type: "rating" as const
      })) || []),
      ...(feedbacks?.map(feedback => ({
        id: feedback.id,
        stars: feedback.stars,
        message: feedback.message,
        created_at: feedback.created_at,
        type: "feedback" as const
      })) || [])
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json(combinedFeedbacks);
  } catch (error) {
    console.error("Error fetching feedbacks:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
