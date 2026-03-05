import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";

export async function GET() {
  try {
    const supabase = await createSupabaseServer();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error("Business API - User auth error:", userError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Business API - User authenticated:", user.id);

    // Get the business for this user
    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select("id, name, slug, google_review_url, threshold_positive, is_active, logo_url, notification_email, notif_new_review, notif_low_rating")
      .eq("owner_user_id", user.id)
      .single();

    if (businessError) {
      console.error("Business API - Business fetch error:", businessError);
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    if (!business) {
      console.log("Business API - No business found for user:", user.id);
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    console.log("Business API - Business found:", business.id, business.name);

    return NextResponse.json(business);
  } catch (error) {
    console.error("Business API - Error fetching business:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
