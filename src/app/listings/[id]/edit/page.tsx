"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { updateListingStatus, deleteListing } from "@/actions/listings";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/Button";

interface Props { params: { id: string } }

export default function EditListingPage({ params }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<string>("active");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.from("listings").select("status").eq("id", params.id).single().then(({ data }) => {
      if (data) setStatus(data.status);
    });
  }, [params.id]);

  async function handleStatusChange(newStatus: "active" | "recovered" | "closed") {
    setLoading(true);
    const res = await updateListingStatus(params.id, newStatus);
    if ("error" in res) { alert(res.error); } else { router.push(`/listings/${params.id}`); }
    setLoading(false);
  }

  async function handleDelete() {
    if (!confirm("Delete this listing? This cannot be undone.")) return;
    setDeleting(true);
    const res = await deleteListing(params.id);
    if ("error" in res) { alert(res.error); setDeleting(false); } else { router.push("/feed"); }
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <TopBar title="Edit listing" backHref={`/listings/${params.id}`} />
      <div className="max-w-sm mx-auto px-4 py-6">
        <h2 className="font-semibold mb-4" style={{ color: "var(--color-text)" }}>Update status</h2>
        <div className="flex flex-col gap-2 mb-8">
          {(["active", "recovered", "closed"] as const).map((s) => (
            <button
              key={s}
              onClick={() => handleStatusChange(s)}
              disabled={loading || status === s}
              className="py-3 px-4 rounded-[var(--radius-md)] border text-sm font-medium text-left capitalize transition-colors"
              style={{
                background: status === s ? "var(--color-text)" : "var(--color-surface)",
                color: status === s ? "var(--color-bg)" : "var(--color-text)",
                borderColor: status === s ? "var(--color-text)" : "var(--color-border)",
              }}
            >
              {s === "active" ? "Active — still looking" : s === "recovered" ? "Recovered — item returned ✓" : "Closed — no longer needed"}
            </button>
          ))}
        </div>
        <Button variant="danger" size="md" fullWidth loading={deleting} onClick={handleDelete}>
          Delete listing
        </Button>
      </div>
    </div>
  );
}
