import { notFound } from "next/navigation";
import ThanksWrapper from "./thanks-wrapper";
import { createSupabaseServer } from "@/lib/supabase-server";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ stars?: string }>;
};

export default async function Page({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;

  const supabase = await createSupabaseServer();

  const { data: business, error } = await supabase
    .from("businesses")
    .select("id, slug, name, google_review_url, is_active")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !business || !business.is_active) notFound();

  return (
    <ThanksWrapper
      businessId={business.id}
      slug={business.slug}
      name={business.name}
      googleReviewUrl={business.google_review_url}
      stars={Number(sp.stars ?? 0) || 0}
    />
  );
}
