import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PATHS = ["/feed", "/post", "/matches", "/claims", "/profile/me"];
const ADMIN_PATH = "/admin";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isProtected = PROTECTED_PATHS.some((p) => path.startsWith(p));
  const isAdmin = path.startsWith(ADMIN_PATH);

  if (!isProtected && !isAdmin) return NextResponse.next();

  const session = request.cookies.get("fl_session")?.value;
  if (!session) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirect", path);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
