import { notFound } from "next/navigation";
import RatingWrapper from "./rating-wrapper";
import { createSupabaseServer } from "@/lib/supabase-server";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function Page({ params }: PageProps) {
  const { slug } = await params;

  const supabase = await createSupabaseServer();

  const { data: business, error } = await supabase
    .from("businesses")
    .select("id, slug, name, google_review_url, threshold_positive, is_active")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !business || !business.is_active) {
    notFound();
  }

  return (
    <RatingWrapper
      businessId={business.id}
      slug={business.slug}
      name={business.name}
      googleReviewUrl={business.google_review_url}
      thresholdPositive={business.threshold_positive ?? 4}
    />
  );
}