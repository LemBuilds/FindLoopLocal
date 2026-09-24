"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const NAV_LINKS = [
  { href: "/feed",       label: "Browse"  },
  { href: "/map",        label: "Map"     },
  { href: "/profile/me", label: "Profile" },
];

export function NavBar() {
  const pathname = usePathname();
  const router   = useRouter();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/local/auth/user")
      .then(r => r.json())
      .then(d => setUserId(d?.user?.id ?? null))
      .catch(() => {});
  }, [pathname]); // re-check on navigation

  async function handleSignOut() {
    await fetch("/api/local/auth/logout", { method: "POST" });
    setUserId(null);
    router.push("/");
  }

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 100, height: 58,
      background: "var(--nav-bg)",
      backdropFilter: "blur(18px) saturate(180%)",
      WebkitBackdropFilter: "blur(18px) saturate(180%)",
      borderBottom: "1px solid var(--bdr)",
      display: "flex", alignItems: "center", padding: "0 24px", gap: 16,
    }}>
      {/* Logo */}
      <Link href="/" style={{
        display: "flex", alignItems: "center", gap: 8,
        fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700,
        color: "var(--accent)", flexShrink: 0, textDecoration: "none",
        transition: "opacity .2s",
      }}>
        <span style={{
          width: 30, height: 30, background: "var(--accent)", borderRadius: 8,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 15, color: "white",
          transition: "transform .4s cubic-bezier(.22,1,.36,1)",
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "rotate(-8deg) scale(1.08)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; }}
        >◎</span>
        FindLoop
      </Link>

      {/* Centre nav */}
      <nav style={{ display: "flex", gap: 4, flex: 1, justifyContent: "center" }}>
        {NAV_LINKS.map(({ href, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link key={href} href={href} style={{
              position: "relative", padding: "6px 14px", borderRadius: 99,
              fontSize: 14, fontWeight: 500, textDecoration: "none",
              color: active ? "var(--accent)" : "var(--ink3)",
              background: active ? "var(--surface2)" : "transparent",
              transition: "color .2s, background .2s",
            }}
              onMouseEnter={e => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.color = "var(--accent)";
                  (e.currentTarget as HTMLElement).style.background = "var(--accent-bg)";
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.color = "var(--ink3)";
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }
              }}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Right actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <ThemeToggle />
        {userId ? (
          <button
            onClick={handleSignOut}
            style={{
              padding: "7px 16px", borderRadius: 99, border: "1.5px solid var(--bdr2)",
              background: "transparent", fontSize: 13, fontWeight: 500, color: "var(--ink2)",
              cursor: "pointer", transition: "transform .2s, background .2s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLElement).style.background = "var(--surface2)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            Sign out
          </button>
        ) : (
          <Link href="/auth/login" style={{
            padding: "7px 16px", borderRadius: 99, border: "1.5px solid var(--bdr2)",
            background: "transparent", fontSize: 13, fontWeight: 500, color: "var(--ink2)",
            textDecoration: "none", transition: "transform .2s, background .2s",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLElement).style.background = "var(--surface2)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            Sign in
          </Link>
        )}
        <Link href="/post/lost" style={{
          position: "relative", padding: "8px 18px", borderRadius: 99,
          background: "var(--accent)", color: "white", fontSize: 13, fontWeight: 600,
          textDecoration: "none", overflow: "hidden",
          transition: "transform .2s cubic-bezier(.22,1,.36,1), box-shadow .2s, background .2s",
        }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
            (e.currentTarget as HTMLElement).style.background = "var(--accent-d)";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 20px rgba(46,125,82,.35)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.transform = "";
            (e.currentTarget as HTMLElement).style.background = "var(--accent)";
            (e.currentTarget as HTMLElement).style.boxShadow = "";
          }}
        >
          + Post item
        </Link>
      </div>
    </header>
  );
}
