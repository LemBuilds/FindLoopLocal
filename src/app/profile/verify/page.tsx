import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/layout/TopBar";
import { VerifyForm } from "@/components/profile/VerifyForm";
import type { Profile } from "@/types";

export const metadata = { title: "Verify account — FindLoop" };

interface Props {
  searchParams: { next?: string };
}

export default async function VerifyPage({ searchParams }: Props) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profileData } = await supabase.from("profiles").select("phone,is_phone_verified").eq("id", user.id).single();
  const profile = profileData as Pick<Profile, "phone" | "is_phone_verified"> | null;

  const nextPath = searchParams.next ?? "/profile/me";
  const isChangingPhone = profile?.is_phone_verified === true && !searchParams.next;

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <TopBar backHref="/profile/me" />
      <div className="max-w-sm mx-auto px-4 pt-8 pb-16">
        <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--color-text)" }}>
          {isChangingPhone ? "Change phone number" : "Verify your account"}
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--color-text-secondary)" }}>
          {isChangingPhone
            ? "Entering a new number will require re-verification."
            : "Add your phone number to post listings and claim found items."}
        </p>
        <VerifyForm
          currentPhone={profile?.phone ?? null}
          nextPath={nextPath}
          isChangingPhone={isChangingPhone}
        />
      </div>
    </div>
  );
}
