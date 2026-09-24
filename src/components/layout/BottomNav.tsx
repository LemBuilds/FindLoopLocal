"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const HomeIcon = ({ active }: { active: boolean }) => (
  <svg width="21" height="21" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const BrowseIcon = ({ active }: { active: boolean }) => (
  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" fill={active ? "currentColor" : "none"} />
    <rect x="14" y="3" width="7" height="7" fill={active ? "currentColor" : "none"} />
    <rect x="3" y="14" width="7" height="7" fill={active ? "currentColor" : "none"} />
    <rect x="14" y="14" width="7" height="7" fill={active ? "currentColor" : "none"} />
  </svg>
);

const MapIcon = ({ active }: { active: boolean }) => (
  <svg width="21" height="21" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
    <line x1="8" y1="2" x2="8" y2="18" />
    <line x1="16" y1="6" x2="16" y2="22" />
  </svg>
);

const ProfileIcon = ({ active }: { active: boolean }) => (
  <svg width="21" height="21" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const ITEMS = [
  { href: "/",          label: "Home",    Icon: HomeIcon    },
  { href: "/feed",      label: "Browse",  Icon: BrowseIcon  },
  { href: "/map",       label: "Map",     Icon: MapIcon     },
  { href: "/profile/me",label: "Profile", Icon: ProfileIcon },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main navigation"
      style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
        background: "var(--nav-bg)",
        backdropFilter: "blur(18px) saturate(180%)",
        WebkitBackdropFilter: "blur(18px) saturate(180%)",
        borderTop: "1px solid var(--bdr)",
        boxShadow: "0 -4px 20px rgba(20,31,23,.08)",
        display: "flex", alignItems: "stretch",
        height: 62,
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {ITEMS.slice(0, 2).map(({ href, label, Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
        return (
          <NavItem key={href} href={href} label={label} active={active}>
            <Icon active={active} />
          </NavItem>
        );
      })}

      {/* Centre — Post CTA */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 72px" }}>
        <Link
          href="/post/lost"
          aria-label="Post a listing"
          style={{
            width: 48, height: 48, borderRadius: "50%",
            background: "var(--accent)", color: "white",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 16px rgba(46,125,82,.40)",
            fontSize: 24, fontWeight: 300, lineHeight: 1,
            transition: "transform .2s cubic-bezier(.22,1,.36,1), box-shadow .2s",
            textDecoration: "none",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.transform = "scale(1.08)";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 22px rgba(46,125,82,.55)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.transform = "";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(46,125,82,.40)";
          }}
        >
          +
        </Link>
      </div>

      {ITEMS.slice(2).map(({ href, label, Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <NavItem key={href} href={href} label={label} active={active}>
            <Icon active={active} />
          </NavItem>
        );
      })}
    </nav>
  );
}

function NavItem({ href, label, active, children }: { href: string; label: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 3,
        color: active ? "var(--accent)" : "var(--ink3)",
        textDecoration: "none",
        transition: "color .15s",
      }}
    >
      {children}
      <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, letterSpacing: .2 }}>
        {label}
      </span>
    </Link>
  );
}
