import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/layout/TopBar";
import { PostListingForm } from "@/components/post/PostListingForm";

export const metadata = { title: "Report lost item — FindLoop" };

export default async function PostLostPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("is_phone_verified").eq("id", user.id).single();
  if (!profile?.is_phone_verified) redirect("/profile/verify?next=/post/lost");

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <TopBar backHref="/post" />
      <div className="max-w-sm mx-auto px-4 py-6 pb-16">
        <PostListingForm type="lost" />
      </div>
    </div>
  );
}
