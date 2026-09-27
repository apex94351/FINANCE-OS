import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const privateRoutes = [
  "/dashboard", "/invoices", "/expenses", "/revenue", "/payables", "/receivables", "/deadlines", "/documents", "/customers", "/suppliers", "/team", "/analytics", "/ai", "/recommendations", "/ai-cfo", "/automations", "/settings", "/notifications", "/alerts",
];

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const isPrivateRoute = privateRoutes.some((route) => request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(`${route}/`));

  if (!isPrivateRoute) return response;

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};