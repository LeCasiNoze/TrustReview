import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";

export async function GET() {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get businesses
    const { data: businesses } = await supabase
      .from('businesses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Get active business
    const { data: activeBusiness } = await supabase
      .from('user_preferences')
      .select('active_business_id')
      .eq('user_id', user.id)
      .single();

    return NextResponse.json({
      businesses: businesses || [],
      activeBusinessId: activeBusiness?.active_business_id
    });
  } catch (error) {
    console.error("Error fetching businesses:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { businessId } = await req.json();
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Set active business
    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        active_business_id: businessId
      });

    if (error) {
      return NextResponse.json({ error: "Failed to set active business" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error setting active business:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
