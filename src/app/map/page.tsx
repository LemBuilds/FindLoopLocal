import dynamicImport from "next/dynamic";
import { createClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/layout/TopBar";
import type { Listing } from "@/types";

const ListingsMap = dynamicImport(
  () => import("@/components/map/ListingsMap").then((m) => m.ListingsMap),
  { ssr: false, loading: () => <div className="w-full h-full flex items-center justify-center" style={{ background: "var(--color-surface-muted)" }}>Loading map…</div> }
);

export const metadata = { title: "Map — FindLoop" };
export const dynamic = "force-dynamic";

async function getListings(): Promise<Listing[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("listings")
    .select("id,title,type,category,location_lat,location_lng,location_label,status")
    .eq("status", "active")
    .is("deleted_at", null)
    .limit(200);
  return (data ?? []) as Listing[];
}

export default async function MapPage() {
  const listings = await getListings();

  return (
    <div className="flex flex-col h-screen" style={{ background: "var(--color-bg)" }}>
      <TopBar title="Map" />
      <div className="flex-1 relative">
        <ListingsMap listings={listings} />
      </div>
    </div>
  );
}
