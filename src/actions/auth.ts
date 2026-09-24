"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CONSENT_VERSION, hashIp } from "@/lib/gdpr";

const MIN_PASSWORD_LENGTH = 8;

function siteOrigin(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

export async function signUp(input: {
  email: string;
  password: string;
  fullName: string;
  consent: boolean;
}): Promise<{ error: string } | { needsConfirmation: boolean }> {
  const email = input.email.trim();
  const fullName = input.fullName.trim();
  if (!input.consent) return { error: "You must accept the privacy policy to continue." };
  if (!email || !input.password) return { error: "Email and password are required" };
  if (input.password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` };
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: input.password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${siteOrigin()}/auth/callback?next=/feed`,
    },
  });

  if (error) return { error: error.message };
  if (!data.user) return { error: "Sign up failed. Please try again." };
  // Supabase returns an obfuscated user with no identities when the email is already registered.
  if (data.user.identities?.length === 0) return { needsConfirmation: true };

  // Record GDPR consent with a hashed IP (service role: the user may not have a session yet).
  const ip = headers().get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { error: consentError } = await createAdminClient().from("consent_log").insert({
    user_id: data.user.id,
    consent_version: CONSENT_VERSION,
    ip_hash: await hashIp(ip),
  });
  if (consentError) console.error("signup: failed to record consent", consentError);

  return { needsConfirmation: !data.session };
}
