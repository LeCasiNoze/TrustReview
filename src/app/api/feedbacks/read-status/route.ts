import { NextResponse } from "next/server";
import { getRequestIdentity, getSupabaseForIdentity } from "@/lib/request-identity";

export async function POST(request: Request) {
  try {
    console.log('📝 Read status API called');
    const identity = await getRequestIdentity();
    
    if (!identity.isAuthenticated || !identity.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    if (identity.isTempSession) {
      return NextResponse.json({ error: "Action not available for temporary sessions" }, { status: 403 });
    }
    
    const supabase = await getSupabaseForIdentity(identity);
    const { feedbackId, isRead } = await request.json();

    console.log('📊 Read status data:', {
      feedbackId: feedbackId ? '✅' : '❌',
      isRead: typeof isRead === 'boolean' ? isRead : '❌',
      feedbackIdValue: feedbackId
    });

    if (!feedbackId || typeof isRead !== 'boolean') {
      console.log('❌ Invalid request data:', { feedbackId, isRead });
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }

    // Get the business for this user
    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select("id")
      .eq("owner_user_id", identity.userId)
      .single();

    if (businessError || !business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Check if feedback exists in feedbacks table first
    let feedback = null;
    let feedbackError = null;

    const { data: feedbackData, error: feedbackDataError } = await supabase
      .from("feedbacks")
      .select("id")
      .eq("id", feedbackId)
      .eq("business_id", business.id)
      .single();

    if (!feedbackDataError && feedbackData) {
      feedback = feedbackData;
    } else {
      // Try rating_sessions table if not found in feedbacks
      console.log("🔍 Not found in feedbacks, trying rating_sessions...");
      const { data: ratingData, error: ratingError } = await supabase
        .from("rating_sessions")
        .select("id")
        .eq("id", feedbackId)
        .eq("business_id", business.id)
        .single();

      if (!ratingError && ratingData) {
        feedback = ratingData;
        console.log("✅ Found in rating_sessions");
      } else {
        feedbackError = ratingError || feedbackDataError;
      }
    }

    if (!feedback) {
      console.error("❌ Feedback/Rating not found:", { 
        feedbackId, 
        businessId: business.id, 
        error: feedbackError 
      });
      return NextResponse.json({ 
        error: "Feedback not found", 
        details: `ID ${feedbackId} not found in feedbacks or rating_sessions tables` 
      }, { status: 404 });
    }

    console.log("✅ Feedback/Rating found:", { feedbackId, table: feedbackData ? 'feedbacks' : 'rating_sessions' });

    // Create or update read status in feedback_read_status table
    console.log('💾 Upserting read status:', {
      feedback_id: feedbackId,
      user_id: identity.userId,
      is_read: isRead
    });

    const { data, error } = await supabase
      .from("feedback_read_status")
      .upsert({
        feedback_id: feedbackId,
        user_id: identity.userId,
        is_read: isRead,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'feedback_id,user_id'
      })
      .select();

    if (error) {
      console.error("❌ Error updating read status:", error);
      return NextResponse.json({ error: "Failed to update read status", details: error.message }, { status: 500 });
    }

    console.log('✅ Read status updated successfully:', data);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error updating read status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const identity = await getRequestIdentity();
    
    if (!identity.isAuthenticated || !identity.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    if (identity.isTempSession) {
      return NextResponse.json({ error: "Action not available for temporary sessions" }, { status: 403 });
    }
    
    const supabase = await getSupabaseForIdentity(identity);
    const { searchParams } = new URL(request.url);
    const feedbackIds = searchParams.get('feedbackIds');

    if (!feedbackIds) {
      return NextResponse.json({ error: "feedbackIds parameter is required" }, { status: 400 });
    }

    const feedbackIdArray = feedbackIds.split(',');

    // Get read statuses for these feedbacks
    const { data, error } = await supabase
      .from("feedback_read_status")
      .select("feedback_id, is_read")
      .eq("user_id", identity.userId)
      .in("feedback_id", feedbackIdArray);

    if (error) {
      console.error("Error fetching read statuses:", error);
      return NextResponse.json({ error: "Failed to fetch read statuses" }, { status: 500 });
    }

    // Convert to object for easy lookup
    const readStatusMap = (data || []).reduce((acc, item) => {
      acc[item.feedback_id] = item.is_read;
      return acc;
    }, {} as Record<string, boolean>);

    return NextResponse.json(readStatusMap);
  } catch (error) {
    console.error("Error fetching read statuses:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
