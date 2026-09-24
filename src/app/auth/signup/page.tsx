import { TopBar } from "@/components/layout/TopBar";
import { SignupForm } from "@/components/auth/SignupForm";

export const metadata = { title: "Create account — FindLoop" };

export default function SignupPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <TopBar backHref="/" />
      <div className="max-w-sm mx-auto px-4 pt-8 pb-16">
        <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--color-text)" }}>Create account</h1>
        <p className="text-sm mb-6" style={{ color: "var(--color-text-secondary)" }}>Join the FindLoop community</p>
        <SignupForm />
      </div>
    </div>
  );
}
