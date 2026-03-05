import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";

export async function POST(req: Request) {
  const supabase = await createSupabaseServer();
  const body = await req.json().catch(() => null);

  const businessId = body?.businessId as string | undefined;
  const stars = body?.stars as number | undefined;
  const source = (body?.source as string | undefined) ?? "qr";

  if (!businessId || typeof stars !== "number" || stars < 1 || stars > 5) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("rating_sessions")
    .insert({ business_id: businessId, stars, source })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: "db_error", details: error.message }, { status: 500 });
  }

  return NextResponse.json({ sessionId: data.id });
}
