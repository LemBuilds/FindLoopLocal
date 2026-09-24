import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/layout/TopBar";
import { ClaimForm } from "@/components/claims/ClaimForm";

interface Props { params: { id: string } }

export const metadata = { title: "Claim item — FindLoop" };

export default async function ClaimPage({ params }: Props) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?redirect=/listings/${params.id}/claim`);

  const { data: listing } = await supabase
    .from("listings")
    .select("id, title, type, status, user_id")
    .eq("id", params.id)
    .single();

  if (!listing) notFound();
  if (listing.type !== "found") redirect(`/listings/${params.id}`);
  if (listing.status !== "active") redirect(`/listings/${params.id}`);
  if (listing.user_id === user.id) redirect(`/listings/${params.id}`);

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <TopBar title="Prove it's yours" backHref={`/listings/${params.id}`} />
      <div className="max-w-sm mx-auto px-4 py-6 pb-16">
        <p className="text-sm mb-6" style={{ color: "var(--color-text-secondary)" }}>
          Your response is private — only the finder sees it. Describe something only the real owner would know.
        </p>
        <ClaimForm listingId={params.id} listingTitle={listing.title} />
      </div>
    </div>
  );
}
