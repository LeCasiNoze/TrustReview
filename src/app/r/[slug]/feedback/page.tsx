import { notFound } from "next/navigation";
import FeedbackWrapper from "./feedback-wrapper";
import { createSupabaseServer } from "@/lib/supabase-server";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ session?: string; stars?: string }>;
};

export default async function Page({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;

  const supabase = await createSupabaseServer();

  const { data: business, error } = await supabase
    .from("businesses")
    .select("id, slug, name, is_active")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !business || !business.is_active) notFound();

  return (
    <FeedbackWrapper
      businessId={business.id}
      slug={business.slug}
      name={business.name}
      sessionId={sp.session ?? ""}
      stars={Number(sp.stars ?? 0) || 0}
    />
  );
}
