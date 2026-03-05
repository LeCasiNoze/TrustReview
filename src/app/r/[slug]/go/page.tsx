import { redirect, notFound } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase-server";

type PageProps = { params: Promise<{ slug: string }> };

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createSupabaseServer();

  const { data: business, error } = await supabase
    .from("businesses")
    .select("google_review_url, is_active")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !business || !business.is_active || !business.google_review_url) {
    notFound();
  }

  redirect(business.google_review_url);
}
