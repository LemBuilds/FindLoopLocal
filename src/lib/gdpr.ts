export const CONSENT_VERSION = "1.0";

export async function hashIp(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + process.env.NEXT_PUBLIC_SUPABASE_URL);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function claimExpiry(): string {
  const d = new Date();
  d.setHours(d.getHours() + 48);
  return d.toISOString();
}
