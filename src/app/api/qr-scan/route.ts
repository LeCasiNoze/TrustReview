import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServer();
    const body = await req.json().catch(() => null);

    const businessId = body?.businessId as string | undefined;
    const source = (body?.source as string | undefined) ?? "qr";

    if (!businessId) {
      return NextResponse.json({ error: "businessId required" }, { status: 400 });
    }

    // Find the most recent active QR code for this business
    const { data: qrCode, error: qrError } = await supabase
      .from("qr_codes")
      .select("id, scan_count")
      .eq("business_id", businessId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (qrError || !qrCode) {
      console.log("No active QR code found for business:", businessId);
      // Ne pas échouer, juste retourner succès sans incrément
      return NextResponse.json({ success: true, message: "No QR code to increment" });
    }

    // Increment scan count
    const { error: updateError } = await supabase
      .from("qr_codes")
      .update({ 
        scan_count: (qrCode.scan_count || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq("id", qrCode.id);

    if (updateError) {
      console.error("Failed to increment scan count:", updateError);
      return NextResponse.json({ error: "Failed to increment scan" }, { status: 500 });
    }

    console.log(`✅ Scan incremented for QR ${qrCode.id}, new count: ${(qrCode.scan_count || 0) + 1}`);

    return NextResponse.json({ 
      success: true, 
      qrCodeId: qrCode.id,
      newScanCount: (qrCode.scan_count || 0) + 1
    });

  } catch (error) {
    console.error("QR scan API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
