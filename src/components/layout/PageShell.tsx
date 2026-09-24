import { TopBar } from "./TopBar";

interface PageShellProps {
  children: React.ReactNode;
  title?: string;
  backHref?: string;
  action?: React.ReactNode;
  hideNav?: boolean;
}

export function PageShell({ children, title, backHref, action }: PageShellProps) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--color-bg)" }}>
      <TopBar title={title} backHref={backHref} action={action} />
      <main className="flex-1 w-full max-w-lg mx-auto px-4 py-4 pb-24">
        {children}
      </main>
    </div>
  );
}
