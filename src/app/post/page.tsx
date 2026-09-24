import Link from "next/link";
import { TopBar } from "@/components/layout/TopBar";

export const metadata = { title: "Post listing — FindLoop" };

export default function PostPickerPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <TopBar title="New listing" backHref="/feed" />
      <div className="max-w-sm mx-auto px-4 pt-8">
        <p className="text-sm mb-6 text-center" style={{ color: "var(--color-text-secondary)" }}>
          What are you posting about?
        </p>
        <div className="flex flex-col gap-4">
          <Link
            href="/post/lost"
            className="flex items-center gap-4 p-5 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)] transition-colors"
          >
            <span className="text-4xl">😔</span>
            <div>
              <h2 className="font-semibold" style={{ color: "var(--color-text)" }}>I lost something</h2>
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Post a lost item listing</p>
            </div>
          </Link>
          <Link
            href="/post/found"
            className="flex items-center gap-4 p-5 rounded-[var(--radius-lg)] border bg-[var(--color-found-bg)] hover:border-[var(--color-found)] transition-colors"
            style={{ borderColor: "var(--color-border)" }}
          >
            <span className="text-4xl">🎉</span>
            <div>
              <h2 className="font-semibold" style={{ color: "var(--color-text)" }}>I found something</h2>
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Help return it to its owner</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
